<?php

use App\Models\CoachProfile;
use App\Models\User;
use App\Models\WorkoutPlan;
use App\Services\CoachingLifecycle;

beforeEach(function () {
    app()->setLocale('en');
    config(['fitnessos.telegram.bot_token' => null]);
});

/** A coach who just signed up: an empty profile and the welcome still to come. */
function newCoach(): User
{
    $coach = User::factory()->create(['role' => 'coach', 'name' => 'Sara Ahmadi']);
    $coach->coachProfile()->create(['slug' => CoachProfile::uniqueSlugFor($coach->name), 'onboarding_pending' => true]);
    $coach->subscription()->create(['plan' => 'pro', 'trial_ends_at' => now()->addDays(14)]);

    return $coach;
}

function onboarding(User $coach): array
{
    return test()->actingAs($coach)->getJson('/fitnessos/onboarding')->assertOk()->json();
}

function stepState(array $summary, string $key): ?array
{
    return collect($summary['steps'])->firstWhere('key', $key);
}

function fillProfile(User $coach): void
{
    $coach->coachProfile->update(['headline' => 'Strength coach', 'bio' => 'I help busy people lift well.', 'specialties' => ['strength']]);
}

test('a coach who just registered is sent to the welcome guide once', function () {
    $this->post(route('register.store'), [
        'name' => 'Test Coach', 'email' => 'new-coach@example.com', 'password' => 'password',
        'password_confirmation' => 'password', 'role' => 'coach',
    ]);

    $this->get('/portal')->assertRedirect('/dashboard/welcome');
    $this->get('/portal')->assertRedirect('/dashboard');
});

test('existing coaches and trainees are not sent to the guide', function () {
    $coach = User::factory()->publishedCoach()->create();
    $this->actingAs($coach)->get('/portal')->assertRedirect('/dashboard');

    $trainee = User::factory()->trainee()->create();
    $this->actingAs($trainee)->get('/portal')->assertRedirect('/app');
});

test('a coach who already finished the essentials skips the welcome page', function () {
    $coach = newCoach();
    fillProfile($coach);
    $coach->coachProfile->update(['is_published' => true]);

    $this->actingAs($coach)->get('/portal')->assertRedirect('/dashboard');
});

test('a new coach starts with nothing done and publishing blocked', function () {
    $summary = onboarding(newCoach());

    expect($summary['complete'])->toBeFalse()->and($summary['dismissed'])->toBeFalse()->and($summary['done'])->toBe(0);
    expect(array_column($summary['steps'], 'key'))->toBe(['profile', 'photo', 'publish', 'plan', 'trainee']);
    expect(stepState($summary, 'publish'))->toMatchArray(['done' => false, 'blocked' => true]);
    expect($summary['missing_profile'])->toBe(['headline', 'bio', 'specialties']);
    expect($summary['public_url'])->toBeNull();
});

test('each step follows what the coach actually does', function () {
    $coach = newCoach();

    fillProfile($coach);
    $summary = onboarding($coach);
    expect(stepState($summary, 'profile')['done'])->toBeTrue();
    expect(stepState($summary, 'publish'))->toMatchArray(['done' => false, 'blocked' => false]);

    $coach->coachProfile->forceFill(['avatar_path' => 'avatars/me.jpg'])->save();
    expect(stepState(onboarding($coach), 'photo')['done'])->toBeTrue();

    WorkoutPlan::create(['coach_id' => $coach->id, 'title' => 'Template', 'status' => WorkoutPlan::DRAFT]);
    expect(stepState(onboarding($coach), 'plan')['done'])->toBeTrue();

    $coach->coachProfile->update(['is_published' => true]);
    $trainee = User::factory()->trainee()->create();
    app(CoachingLifecycle::class)->request($trainee, $coach->coachProfile->fresh(), 'hello');
    $summary = onboarding($coach);

    expect(stepState($summary, 'trainee')['done'])->toBeTrue();
    expect($summary['complete'])->toBeTrue()->and($summary['public_url'])->toEndWith('/coaches/'.$coach->coachProfile->slug);
});

test('the Telegram step only appears once the bot is set up and follows the connection', function () {
    $coach = newCoach();
    expect(stepState(onboarding($coach), 'telegram'))->toBeNull();

    config(['fitnessos.telegram.bot_token' => 'test-token', 'fitnessos.telegram.bot_username' => 'FitnessOSBot']);
    fillProfile($coach);
    $coach->coachProfile->update(['is_published' => true]);

    $summary = onboarding($coach);
    expect(stepState($summary, 'telegram'))->toMatchArray(['done' => false, 'optional' => false]);
    expect($summary['complete'])->toBeFalse();

    $coach->telegramAccount()->update(['chat_id' => '123', 'linked_at' => now()]);
    $summary = onboarding($coach);
    expect(stepState($summary, 'telegram')['done'])->toBeTrue()->and($summary['complete'])->toBeTrue();
});

test('the guide can publish the profile only when it is ready', function () {
    $coach = newCoach();

    $this->actingAs($coach)->postJson('/fitnessos/onboarding/publish')
        ->assertUnprocessable()->assertJsonValidationErrors('profile');
    expect($coach->coachProfile->fresh()->is_published)->toBeFalse();

    fillProfile($coach);
    $this->actingAs($coach)->postJson('/fitnessos/onboarding/publish')->assertOk()
        ->assertJsonPath('steps.2.done', true);
    expect($coach->coachProfile->fresh()->is_published)->toBeTrue();
});

test('the checklist can be hidden and brought back', function () {
    $coach = newCoach();

    $this->actingAs($coach)->postJson('/fitnessos/onboarding/dismiss')->assertOk()->assertJsonPath('dismissed', true);
    expect(onboarding($coach)['dismissed'])->toBeTrue();

    $this->actingAs($coach)->postJson('/fitnessos/onboarding/restore')->assertJsonPath('dismissed', false);
});

test('only coaches can use the guide and each sees their own progress', function () {
    $this->postJson('/fitnessos/onboarding/publish')->assertUnauthorized();
    $this->actingAs(User::factory()->trainee()->create())->getJson('/fitnessos/onboarding')->assertForbidden();

    $mine = newCoach();
    $other = newCoach();
    fillProfile($other);

    expect(onboarding($mine)['done'])->toBe(0);
    expect(onboarding($other)['done'])->toBe(1);
});
