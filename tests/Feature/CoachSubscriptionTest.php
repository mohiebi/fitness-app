<?php

use App\Models\Coaching;
use App\Models\User;
use App\Services\CoachingLifecycle;
use App\Services\CoachSubscriptions;
use Illuminate\Validation\ValidationException;

test('new coaches start a trial on the trial plan', function () {
    $this->post(route('register.store'), [
        'name' => 'Sara',
        'email' => 'sara@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'role' => 'coach',
    ]);

    $subscription = User::query()->where('email', 'sara@example.com')->firstOrFail()->subscription;
    expect($subscription->onTrial())->toBeTrue();
    expect($subscription->plan)->toBe('pro');
    expect($subscription->isActive())->toBeTrue();
    expect($subscription->trial_ends_at->isAfter(now()->addDays(13)))->toBeTrue();
});

test('a lapsed coach disappears from the directory and cannot take new trainees', function () {
    $coach = User::factory()->publishedCoach(['slug' => 'sara'])->create();
    $this->getJson('/fitnessos/coaches')->assertJsonCount(1, 'data');

    $coach->subscription->update(['trial_ends_at' => now()->subDay()]);

    $this->getJson('/fitnessos/coaches')->assertJsonCount(0, 'data');
    $this->getJson('/fitnessos/coaches/sara')->assertOk()->assertJsonPath('accepting_clients', false);

    $trainee = User::factory()->trainee()->create();
    $this->actingAs($trainee)->postJson('/fitnessos/coachings', ['coach' => 'sara'])->assertUnprocessable();
    $this->actingAs($coach)->postJson('/fitnessos/clients', ['name' => 'Jamie', 'email' => 'jamie@example.com'])
        ->assertJsonValidationErrors('email');
});

test('a coach whose subscription lapses cannot accept pending requests, but keeps current trainees', function () {
    $coach = User::factory()->publishedCoach()->create();
    $current = User::factory()->trainee()->create();
    $lifecycle = app(CoachingLifecycle::class);
    $lifecycle->startDirect($coach, $current);
    $request = $lifecycle->request(User::factory()->trainee()->create(), $coach->coachProfile);

    $coach->subscription->update(['trial_ends_at' => now()->subDay()]);

    expect(fn () => $lifecycle->accept($request, $coach))->toThrow(ValidationException::class);
    expect(Coaching::query()->where('status', Coaching::ACTIVE)->count())->toBe(1);
    $this->actingAs($current->fresh())->postJson('/fitnessos/messages', ['body' => 'Still here'])->assertCreated();
});

test('the starter plan caps active trainees', function () {
    config(['fitnessos.plans.starter.max_trainees' => 2]);
    $coach = User::factory()->publishedCoach()->create();
    app(CoachSubscriptions::class)->extend($coach, 'starter');
    $lifecycle = app(CoachingLifecycle::class);
    $lifecycle->startDirect($coach, User::factory()->trainee()->create());
    $pending = $lifecycle->request(User::factory()->trainee()->create(), $coach->coachProfile->fresh());
    $lifecycle->startDirect($coach, User::factory()->trainee()->create());

    expect($coach->coachProfile->fresh()->hasCapacity())->toBeFalse();
    expect(fn () => $lifecycle->accept($pending, $coach))->toThrow(ValidationException::class);
});

test('paying extends from the end of the paid period, or from now after a trial or lapse', function () {
    $coach = User::factory()->publishedCoach()->create();
    $subscriptions = app(CoachSubscriptions::class);

    $first = $subscriptions->extend($coach, 'starter');
    expect($first->onTrial())->toBeFalse();
    expect((int) round(now()->diffInDays($first->paid_until)))->toBe(30);

    $second = $subscriptions->extend($coach, 'pro');
    expect($second->plan)->toBe('pro');
    expect((int) round(now()->diffInDays($second->paid_until)))->toBe(60);

    $second->update(['paid_until' => now()->subDays(5)]);
    $third = $subscriptions->extend($coach, 'pro');
    expect((int) round(now()->diffInDays($third->paid_until)))->toBe(30);

    expect(fn () => $subscriptions->extend($coach, 'platinum'))->toThrow(InvalidArgumentException::class);
});
