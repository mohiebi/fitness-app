<?php

use App\Models\CalendarEvent;
use App\Models\Coaching;
use App\Models\User;
use App\Models\WorkoutLog;
use App\Models\WorkoutPlan;
use App\Services\CoachingLifecycle;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    Carbon::setTestNow('2026-10-10 10:00:00');
    $this->coach = User::factory()->publishedCoach()->create(['name' => 'Sara Ahmadi']);
    $this->trainee = User::factory()->trainee()->create(['name' => 'Nima Rezaei']);
    app(CoachingLifecycle::class)->startDirect($this->coach, $this->trainee);
});

afterEach(fn () => Carbon::setTestNow());

function calendarFor(User $coach, string $from = '2026-10-01', string $to = '2026-11-01'): array
{
    return test()->actingAs($coach)->getJson("/fitnessos/calendar?from={$from}&to={$to}")->assertOk()->json();
}

test('a coach schedules an appointment with a trainee and sees it in the month', function () {
    $response = $this->actingAs($this->coach)->postJson('/fitnessos/calendar/events', [
        'title' => 'Program review', 'kind' => 'video', 'starts_at' => '2026-10-15T11:00:00Z',
        'duration_minutes' => 45, 'trainee_id' => $this->trainee->id, 'notes' => 'Bring the check-in numbers',
    ])->assertCreated();

    $response->assertJsonPath('title', 'Program review')->assertJsonPath('trainee.name', 'Nima Rezaei')->assertJsonPath('duration_minutes', 45);

    $calendar = calendarFor($this->coach);
    expect($calendar['events'])->toHaveCount(1);
    expect($calendar['events'][0]['starts_at'])->toBe('2026-10-15T11:00:00+00:00');
    expect($calendar['upcoming'])->toHaveCount(1);
    expect(calendarFor($this->coach, '2026-11-01', '2026-12-01')['events'])->toBe([]);
});

test('events are validated and can only involve current trainees', function () {
    $post = fn (array $extra = []) => $this->actingAs($this->coach)->postJson('/fitnessos/calendar/events', [
        'title' => 'Call', 'kind' => 'call', 'starts_at' => '2026-10-15T09:00:00Z', ...$extra,
    ]);

    $post(['title' => ''])->assertJsonValidationErrors('title');
    $post(['kind' => 'party'])->assertJsonValidationErrors('kind');
    $post(['starts_at' => 'soon'])->assertJsonValidationErrors('starts_at');
    $post(['duration_minutes' => 2])->assertJsonValidationErrors('duration_minutes');

    $stranger = User::factory()->trainee()->create();
    $post(['trainee_id' => $stranger->id])->assertNotFound();
    expect(CalendarEvent::count())->toBe(0);

    $post()->assertCreated();
    expect(CalendarEvent::query()->value('trainee_id'))->toBeNull();
});

test('a coach only sees and deletes their own events', function () {
    $mine = CalendarEvent::create(['coach_id' => $this->coach->id, 'title' => 'Mine', 'kind' => 'call', 'starts_at' => '2026-10-12 09:00:00']);
    $other = User::factory()->publishedCoach()->create();
    $theirs = CalendarEvent::create(['coach_id' => $other->id, 'title' => 'Theirs', 'kind' => 'call', 'starts_at' => '2026-10-12 09:00:00']);

    expect(collect(calendarFor($this->coach)['events'])->pluck('title')->all())->toBe(['Mine']);

    $this->actingAs($this->coach)->deleteJson("/fitnessos/calendar/events/{$theirs->id}")->assertNotFound();
    $this->actingAs($this->coach)->deleteJson("/fitnessos/calendar/events/{$mine->id}")->assertOk();
    expect(CalendarEvent::pluck('title')->all())->toBe(['Theirs']);
});

test('the calendar shows what current trainees did', function () {
    WorkoutLog::create(['trainee_id' => $this->trainee->id, 'title' => 'Push day', 'performed_on' => '2026-10-05']);
    WorkoutLog::create(['trainee_id' => $this->trainee->id, 'title' => 'Too early', 'performed_on' => '2026-09-30']);
    DB::table('fitnessos_checkins')->insert(['client_id' => $this->trainee->id, 'coach_id' => $this->coach->id, 'status' => 'Pending', 'created_at' => '2026-10-07 08:00:00', 'updated_at' => '2026-10-07 08:00:00']);
    WorkoutPlan::create(['coach_id' => $this->coach->id, 'trainee_id' => $this->trainee->id, 'title' => 'Month one', 'status' => 'active', 'activated_at' => '2026-10-02 09:00:00']);

    $activity = collect(calendarFor($this->coach)['activity']);

    expect($activity->pluck('type')->sort()->values()->all())->toBe(['checkin', 'plan', 'session', 'started']);
    expect($activity->firstWhere('type', 'session'))->toMatchArray(['at' => '2026-10-05', 'label' => 'Push day', 'trainee' => ['id' => $this->trainee->id, 'name' => 'Nima Rezaei']]);
    expect($activity->firstWhere('type', 'plan')['label'])->toBe('Month one');
});

test('activity of trainees who left or belong to another coach is not shown', function () {
    $other = User::factory()->publishedCoach()->create();
    $theirs = User::factory()->trainee()->create();
    app(CoachingLifecycle::class)->startDirect($other, $theirs);
    WorkoutLog::create(['trainee_id' => $theirs->id, 'title' => 'Not yours', 'performed_on' => '2026-10-05']);

    $coaching = Coaching::query()->where('trainee_id', $this->trainee->id)->firstOrFail();
    WorkoutLog::create(['trainee_id' => $this->trainee->id, 'title' => 'Before leaving', 'performed_on' => '2026-10-05']);
    app(CoachingLifecycle::class)->end($coaching, $this->coach);

    expect(calendarFor($this->coach)['activity'])->toBe([]);
});

test('the subscription end appears on the day it falls', function () {
    $this->coach->subscription()->update(['trial_ends_at' => '2026-10-20 12:00:00']);

    expect(calendarFor($this->coach)['subscription_ends_at'])->toBe('2026-10-20T12:00:00+00:00');
    expect(calendarFor($this->coach, '2026-11-01', '2026-12-01')['subscription_ends_at'])->toBeNull();
});

test('the date range is validated and trainees cannot use the calendar', function () {
    $this->actingAs($this->coach)->getJson('/fitnessos/calendar')->assertUnprocessable();
    $this->actingAs($this->coach)->getJson('/fitnessos/calendar?from=2026-10-10&to=2026-10-01')->assertUnprocessable();
    $this->actingAs($this->coach)->getJson('/fitnessos/calendar?from=2026-01-01&to=2026-12-31')->assertUnprocessable();

    $this->actingAs($this->trainee)->getJson('/fitnessos/calendar?from=2026-10-01&to=2026-11-01')->assertForbidden();
    $this->actingAs($this->trainee)->postJson('/fitnessos/calendar/events', ['title' => 'x', 'kind' => 'call', 'starts_at' => '2026-10-15T09:00:00Z'])->assertForbidden();
});
