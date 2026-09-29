<?php

use App\Models\Exercise;
use App\Models\User;
use App\Notifications\AppNotice;
use App\Services\CoachingLifecycle;
use App\Services\Payments\SubscriptionPayments;
use App\Services\TrainingPlans;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

beforeEach(function () {
    $this->coach = User::factory()->publishedCoach()->create(['name' => 'Sara']);
    $this->trainee = User::factory()->trainee()->create(['name' => 'Nima']);
});

function sentKinds(User $user): array
{
    return $user->notifications()->get()->map(fn ($notification) => $notification->data['kind'])->all();
}

test('coaching events notify the other side, with email for the important ones', function () {
    Notification::fake();
    $lifecycle = app(CoachingLifecycle::class);

    $coaching = $lifecycle->request($this->trainee, $this->coach->coachProfile, 'Hi');
    Notification::assertSentTo($this->coach, AppNotice::class, fn (AppNotice $notice, array $channels) => $notice->kind === 'coaching_requested'
        && in_array('mail', $channels, true)
        && $notice->url === '/dashboard/requests');

    $lifecycle->accept($coaching, $this->coach);
    Notification::assertSentTo($this->trainee, AppNotice::class, fn (AppNotice $notice, array $channels) => $notice->kind === 'coaching_accepted' && in_array('mail', $channels, true));

    $lifecycle->end($coaching->fresh(), $this->trainee->fresh());
    Notification::assertSentTo($this->coach, AppNotice::class, fn (AppNotice $notice, array $channels) => $notice->kind === 'coaching_ended' && $channels === ['database']);
});

test('messages notify once per unread conversation', function () {
    app(CoachingLifecycle::class)->startDirect($this->coach, $this->trainee);
    $trainee = $this->trainee->fresh();

    $this->actingAs($trainee)->postJson('/fitnessos/messages', ['body' => 'Hello'])->assertCreated();
    $this->actingAs($trainee)->postJson('/fitnessos/messages', ['body' => 'Are you there?'])->assertCreated();
    expect($this->coach->unreadNotifications()->count())->toBe(1);

    $this->actingAs($this->coach)->postJson('/fitnessos/notifications/read')->assertJsonPath('unread_count', 0);
    $this->actingAs($trainee)->postJson('/fitnessos/messages', ['body' => 'One more'])->assertCreated();
    expect($this->coach->unreadNotifications()->count())->toBe(1);

    $this->actingAs($this->coach)->postJson('/fitnessos/messages', ['client_id' => $trainee->id, 'body' => 'Hi Nima'])->assertCreated();
    expect(sentKinds($trainee))->toContain('message');
});

test('check-ins, plans and payments notify the right person', function () {
    app(CoachingLifecycle::class)->startDirect($this->coach, $this->trainee);
    $trainee = $this->trainee->fresh();

    $this->actingAs($trainee)->postJson('/fitnessos/checkins', ['weight_kg' => 80])->assertCreated();
    expect(sentKinds($this->coach))->toContain('checkin_submitted');

    $checkinId = DB::table('fitnessos_checkins')->value('id');
    $this->actingAs($this->coach)->patchJson("/fitnessos/checkins/{$checkinId}", ['feedback' => 'Good week'])->assertOk();
    expect(sentKinds($trainee))->toContain('checkin_reviewed')->not->toContain('message');

    $plans = app(TrainingPlans::class);
    $plan = $plans->create($this->coach, ['title' => 'Plan', 'trainee_id' => $trainee->id]);
    $plans->sync($this->coach, $plan, ['title' => 'Plan', 'days' => [['title' => 'A', 'exercises' => [
        ['exercise_id' => Exercise::query()->value('id'), 'sets' => 3, 'reps' => '10'],
    ]]]]);
    $plans->activate($this->coach, $plan);
    expect(sentKinds($trainee))->toContain('plan_activated');

    app(SubscriptionPayments::class)->recordManual($this->coach, 'pro');
    expect(sentKinds($this->coach))->toContain('payment_confirmed');
});

test('the notifications endpoint lists newest first and marks one as read', function () {
    app(CoachingLifecycle::class)->request($this->trainee, $this->coach->coachProfile);

    $list = $this->actingAs($this->coach)->getJson('/fitnessos/notifications')->assertOk()
        ->assertJsonPath('unread_count', 1)
        ->assertJsonPath('items.0.kind', 'coaching_requested')
        ->assertJsonPath('items.0.read', false)
        ->json();

    $this->actingAs($this->coach)->postJson('/fitnessos/notifications/read', ['id' => $list['items'][0]['id']])
        ->assertJsonPath('unread_count', 0);

    $this->actingAs($this->trainee)->getJson('/fitnessos/notifications')->assertJsonPath('unread_count', 0);
});

test('coaches are reminded once before their subscription ends', function () {
    $this->coach->subscription->update(['trial_ends_at' => now()->addDays(2)]);
    $later = User::factory()->publishedCoach()->create();
    $later->subscription->update(['trial_ends_at' => now()->addDays(10)]);

    $this->artisan('fitnessos:subscriptions:remind')->assertSuccessful();
    $this->artisan('fitnessos:subscriptions:remind')->assertSuccessful();

    expect(collect(sentKinds($this->coach))->filter(fn ($kind) => $kind === 'subscription_ending'))->toHaveCount(1);
    expect(sentKinds($later))->not->toContain('subscription_ending');
});
