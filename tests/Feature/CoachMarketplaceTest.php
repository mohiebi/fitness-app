<?php

use App\Models\Coaching;
use App\Models\User;
use App\Services\CoachingLifecycle;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

test('coaches get an unpublished profile and trainees none when registering', function () {
    $this->post(route('register.store'), [
        'name' => 'Sara Coach',
        'email' => 'sara@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'role' => 'coach',
    ]);
    $coach = User::query()->where('email', 'sara@example.com')->firstOrFail();
    expect($coach->role)->toBe('coach');
    expect($coach->coachProfile->is_published)->toBeFalse();

    auth()->logout();

    $this->post(route('register.store'), [
        'name' => 'Ali Trainee',
        'email' => 'ali@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'role' => 'client',
    ]);
    $trainee = User::query()->where('email', 'ali@example.com')->firstOrFail();
    expect($trainee->role)->toBe('client');
    expect($trainee->coachProfile)->toBeNull();
});

test('registration rejects unknown roles', function () {
    $this->post(route('register.store'), [
        'name' => 'Mallory',
        'email' => 'mallory@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'role' => 'admin',
    ])->assertSessionHasErrors('role');

    $this->assertGuest();
});

test('a trainee who registers from a coach page is sent back to that coach', function () {
    $coach = User::factory()->publishedCoach(['slug' => 'sara'])->create();

    $this->post(route('register.store'), [
        'name' => 'Ali Trainee',
        'email' => 'ali@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'role' => 'client',
        'coach' => 'sara',
    ]);

    $this->withHeaders(['X-Inertia' => 'true', 'X-Inertia-Version' => Inertia::getVersion()])
        ->get('/portal')
        ->assertHeader('X-Inertia-Location', '/coaches/sara?request=1');
});

test('the directory lists only published coaches and supports filters', function () {
    User::factory()->publishedCoach(['slug' => 'sara', 'city' => 'Tehran', 'specialties' => ['strength']])->create(['name' => 'Sara']);
    User::factory()->publishedCoach(['slug' => 'reza', 'city' => 'Shiraz', 'specialties' => ['yoga']])->create(['name' => 'Reza']);
    User::factory()->publishedCoach(['slug' => 'hidden', 'is_published' => false])->create();

    $this->getJson('/fitnessos/coaches')->assertOk()->assertJsonCount(2, 'data');
    $this->getJson('/fitnessos/coaches?city=Tehran')->assertJsonCount(1, 'data')->assertJsonPath('data.0.slug', 'sara');
    $this->getJson('/fitnessos/coaches?specialty=yoga')->assertJsonCount(1, 'data')->assertJsonPath('data.0.slug', 'reza');
    $this->getJson('/fitnessos/coaches?q=Sar')->assertJsonCount(1, 'data');

    $this->getJson('/fitnessos/coaches/sara')->assertOk()->assertJsonPath('name', 'Sara');
    $this->getJson('/fitnessos/coaches/hidden')->assertNotFound();
    $this->get('/coaches/sara')->assertOk();
});

test('a coach edits and publishes their profile', function () {
    Storage::fake('public');
    $coach = User::factory()->create();

    $this->actingAs($coach)->getJson('/fitnessos/coach-profile')->assertOk()->assertJsonPath('is_published', false);

    $this->actingAs($coach)->putJson('/fitnessos/coach-profile', [
        'slug' => 'sara-fit',
        'is_published' => true,
    ])->assertUnprocessable()->assertJsonValidationErrors(['headline', 'bio']);

    $this->actingAs($coach)->putJson('/fitnessos/coach-profile', [
        'slug' => 'sara-fit',
        'headline' => 'Strength coach for beginners',
        'bio' => 'Ten years of coaching.',
        'specialties' => ['strength', 'fat loss'],
        'price_from' => 2500000,
        'is_published' => true,
    ])->assertOk()->assertJsonPath('profile.slug', 'sara-fit');

    $this->actingAs($coach)->postJson('/fitnessos/coach-profile/avatar', [
        'avatar' => UploadedFile::fake()->image('me.jpg'),
    ])->assertOk();

    $this->getJson('/fitnessos/coaches/sara-fit')->assertOk()->assertJsonPath('price_from', 2500000);
    expect($coach->coachProfile->avatar_path)->not->toBeNull();
    Storage::disk('public')->assertExists($coach->coachProfile->avatar_path);
});

test('request, accept, message, switch and cancel through the API', function () {
    $first = User::factory()->publishedCoach(['slug' => 'first'])->create();
    $second = User::factory()->publishedCoach(['slug' => 'second'])->create();
    $trainee = User::factory()->trainee()->create();

    $this->actingAs($trainee)->putJson('/fitnessos/trainee-profile', [
        'goal' => 'Lose 5 kg',
        'height_cm' => 175,
        'health_consent' => true,
    ])->assertOk();

    $this->actingAs($trainee)->postJson('/fitnessos/coachings', ['coach' => 'first', 'message' => 'Hi'])->assertCreated();
    $this->actingAs($trainee)->postJson('/fitnessos/coachings', ['coach' => 'second'])->assertUnprocessable();

    $request = $this->actingAs($first)->getJson('/fitnessos/coachings')
        ->assertJsonCount(1)
        ->assertJsonPath('0.trainee.profile.goal', 'Lose 5 kg')
        ->json('0');

    $this->actingAs($second)->postJson("/fitnessos/coachings/{$request['id']}/accept")->assertNotFound();
    $this->actingAs($first)->postJson("/fitnessos/coachings/{$request['id']}/accept")->assertOk();

    $this->actingAs($trainee->fresh())->postJson('/fitnessos/messages', ['body' => 'Hello coach'])->assertCreated();
    $this->actingAs($first)->getJson('/fitnessos/messages/'.$trainee->id)->assertJsonCount(1);
    $this->actingAs($first)->getJson('/fitnessos/clients')->assertJsonCount(1)->assertJsonPath('0.goal', 'Lose 5 kg');

    // Switch to the second coach.
    $this->actingAs($trainee->fresh())->postJson('/fitnessos/coachings', ['coach' => 'second'])->assertCreated();
    $switch = $this->actingAs($second)->getJson('/fitnessos/coachings')->json('0');
    $this->actingAs($second)->postJson("/fitnessos/coachings/{$switch['id']}/accept")->assertOk();

    $this->actingAs($first)->getJson('/fitnessos/clients/'.$trainee->id)->assertNotFound();
    $this->actingAs($first)->getJson('/fitnessos/messages/'.$trainee->id)->assertNotFound();
    $this->actingAs($first)->getJson('/fitnessos/coachings?status=ended')
        ->assertJsonPath('0.end_reason', 'switched');

    $mine = $this->actingAs($trainee->fresh())->getJson('/fitnessos/my-coaching')->assertOk();
    $mine->assertJsonPath('active.coach.slug', 'second')->assertJsonPath('pending', null)->assertJsonCount(1, 'history');

    // Cancel.
    $this->actingAs($trainee->fresh())->postJson("/fitnessos/coachings/{$switch['id']}/end", ['reason' => 'Too expensive'])->assertOk();
    expect($trainee->fresh()->coach_id)->toBeNull();
    $this->actingAs($trainee->fresh())->getJson('/fitnessos/messages')->assertUnprocessable();
});

test('trainees keep their check-in history after coaching ends, but coaches lose it', function () {
    $coach = User::factory()->publishedCoach()->create();
    $trainee = User::factory()->trainee()->create();
    $coaching = app(CoachingLifecycle::class)->startDirect($coach, $trainee);

    $this->actingAs($trainee->fresh())->postJson('/fitnessos/checkins', ['weight_kg' => 80])->assertCreated();
    app(CoachingLifecycle::class)->end($coaching, $trainee->fresh());

    $this->actingAs($trainee->fresh())->getJson('/fitnessos/checkins')->assertOk()->assertJsonCount(1);
    $this->actingAs($trainee->fresh())->postJson('/fitnessos/checkins', ['weight_kg' => 79])->assertUnprocessable();
    $this->actingAs($coach)->getJson('/fitnessos/checkins/'.$trainee->id)->assertNotFound();
    $this->actingAs($coach)->getJson('/fitnessos/checkins')->assertOk()->assertJsonCount(0);

    $checkinId = DB::table('fitnessos_checkins')->value('id');
    $this->actingAs($coach)->patchJson('/fitnessos/checkins/'.$checkinId, ['feedback' => 'Late reply'])->assertNotFound();
});

test('coach-created clients start with an active coaching', function () {
    $coach = User::factory()->create();

    $this->actingAs($coach)->postJson('/fitnessos/clients', [
        'name' => 'Jamie',
        'email' => 'jamie@example.com',
    ])->assertCreated();

    $client = User::query()->where('email', 'jamie@example.com')->firstOrFail();
    expect(Coaching::query()->where('trainee_id', $client->id)->value('status'))->toBe(Coaching::ACTIVE);
});

test('roles are enforced on marketplace endpoints', function () {
    $coach = User::factory()->publishedCoach()->create();
    $trainee = User::factory()->trainee()->create();
    $outsider = User::factory()->trainee()->create();
    $coaching = Coaching::create(['coach_id' => $coach->id, 'trainee_id' => $trainee->id, 'status' => Coaching::REQUESTED]);

    $this->actingAs($coach)->getJson('/fitnessos/contact-messages')->assertForbidden();
    $this->actingAs(User::factory()->create(['role' => 'admin']))->getJson('/fitnessos/contact-messages')->assertOk();
    $this->actingAs($trainee)->getJson('/fitnessos/coach-profile')->assertForbidden();
    $this->actingAs($trainee)->getJson('/fitnessos/coachings')->assertForbidden();
    $this->actingAs($trainee)->postJson("/fitnessos/coachings/{$coaching->id}/accept")->assertForbidden();
    $this->actingAs($coach)->getJson('/fitnessos/my-coaching')->assertForbidden();
    $this->actingAs($coach)->putJson('/fitnessos/trainee-profile', [])->assertForbidden();
    $this->actingAs($coach)->postJson('/fitnessos/coachings', ['coach' => $coach->coachProfile->slug])->assertForbidden();
    $this->actingAs($outsider)->postJson("/fitnessos/coachings/{$coaching->id}/withdraw")->assertNotFound();
    $this->actingAs($outsider)->postJson("/fitnessos/coachings/{$coaching->id}/end")->assertNotFound();

    auth()->forgetGuards();
    $this->getJson('/fitnessos/my-coaching')->assertUnauthorized();
});

test('trainee intake requires health consent', function () {
    $trainee = User::factory()->trainee()->create();

    $this->actingAs($trainee)->putJson('/fitnessos/trainee-profile', ['goal' => 'Strength'])
        ->assertJsonValidationErrors('health_consent');
});

test('coaches can be verified from the command line', function () {
    $coach = User::factory()->publishedCoach(['slug' => 'sara'])->create();

    $this->artisan('fitnessos:verify-coach', ['email' => $coach->email])->assertSuccessful();
    $this->getJson('/fitnessos/coaches/sara')->assertJsonPath('verified', true);

    $this->artisan('fitnessos:verify-coach', ['email' => 'nobody@example.com'])->assertFailed();
});
