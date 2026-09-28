<?php

use App\Models\Exercise;
use App\Models\User;
use App\Models\WorkoutLog;
use App\Services\CoachingLifecycle;
use App\Services\TrainingPlans;

beforeEach(function () {
    $this->coach = User::factory()->publishedCoach()->create();
    $this->trainee = User::factory()->trainee()->create();
    $this->coaching = app(CoachingLifecycle::class)->startDirect($this->coach, $this->trainee);
    $this->squat = Exercise::query()->where('name_en', 'Back squat')->firstOrFail();

    $service = app(TrainingPlans::class);
    $this->plan = $service->create($this->coach, ['title' => 'Strength', 'trainee_id' => $this->trainee->id]);
    $service->sync($this->coach, $this->plan, ['title' => 'Strength', 'days' => [
        ['title' => 'Day A', 'exercises' => [['exercise_id' => $this->squat->id, 'sets' => 3, 'reps' => '5']]],
        ['title' => 'Day B', 'exercises' => [['exercise_id' => $this->squat->id, 'sets' => 2, 'reps' => '8']]],
    ]]);
    $service->activate($this->coach, $this->plan);
    $this->dayA = $this->plan->days()->first();
});

function logPayload(array $overrides = []): array
{
    return [
        'performed_on' => now()->toDateString(),
        'effort' => 7,
        'sets' => [
            ['exercise_id' => Exercise::query()->where('name_en', 'Back squat')->value('id'), 'set_number' => 1, 'reps' => 5, 'weight_kg' => 60, 'completed' => true],
            ['exercise_id' => Exercise::query()->where('name_en', 'Back squat')->value('id'), 'set_number' => 2, 'reps' => 5, 'weight_kg' => 62.5, 'completed' => true],
        ],
        ...$overrides,
    ];
}

test('a trainee sees the active plan and logs a session for one of its days', function () {
    $this->actingAs($this->trainee)->getJson('/fitnessos/my-plan')->assertOk()
        ->assertJsonPath('plan.title', 'Strength')
        ->assertJsonCount(2, 'plan.days')
        ->assertJsonPath('adherence.planned_per_week', 2);

    $this->actingAs($this->trainee)->postJson('/fitnessos/workout-logs', logPayload(['plan_day_id' => $this->dayA->id]))
        ->assertCreated()
        ->assertJsonPath('log.title', 'Day A')
        ->assertJsonPath('log.sets.1.weight_kg', 62.5)
        ->assertJsonPath('log.sets.0.exercise_name', 'اسکوات با هالتر');

    $this->actingAs($this->trainee)->getJson('/fitnessos/my-plan')
        ->assertJsonPath("last_logs.{$this->dayA->id}.sets.0.reps", 5)
        ->assertJsonPath('adherence.weeks.0.done', 1);
});

test('free sessions need a title and logs cannot point at other plans or the future', function () {
    $this->actingAs($this->trainee)->postJson('/fitnessos/workout-logs', logPayload())->assertJsonValidationErrors('title');
    $this->actingAs($this->trainee)->postJson('/fitnessos/workout-logs', logPayload(['title' => 'Park run']))->assertCreated();

    $this->actingAs($this->trainee)->postJson('/fitnessos/workout-logs', logPayload([
        'plan_day_id' => $this->dayA->id,
        'performed_on' => now()->addDay()->toDateString(),
    ]))->assertJsonValidationErrors('performed_on');

    $otherTrainee = User::factory()->trainee()->create();
    app(CoachingLifecycle::class)->startDirect($this->coach, $otherTrainee);
    $this->actingAs($otherTrainee->fresh())->postJson('/fitnessos/workout-logs', logPayload(['plan_day_id' => $this->dayA->id]))
        ->assertJsonValidationErrors('plan_day_id');
});

test('the coach sees current trainees\' sessions, and the trainee keeps them after coaching ends', function () {
    $this->actingAs($this->trainee)->postJson('/fitnessos/workout-logs', logPayload(['plan_day_id' => $this->dayA->id]))->assertCreated();

    $this->actingAs($this->coach)->getJson("/fitnessos/trainees/{$this->trainee->id}/training")->assertOk()
        ->assertJsonPath('active_plan.title', 'Strength')
        ->assertJsonCount(1, 'recent_logs')
        ->assertJsonPath('adherence.weeks.0.done', 1);

    app(CoachingLifecycle::class)->end($this->coaching, $this->trainee->fresh());

    $this->actingAs($this->coach)->getJson("/fitnessos/trainees/{$this->trainee->id}/training")->assertNotFound();
    $this->actingAs($this->trainee->fresh())->getJson('/fitnessos/workout-logs')->assertOk()->assertJsonCount(1);
});

test('trainees can delete only their own sessions', function () {
    $log = $this->actingAs($this->trainee)->postJson('/fitnessos/workout-logs', logPayload(['plan_day_id' => $this->dayA->id]))->json('log');
    $other = User::factory()->trainee()->create();

    $this->actingAs($other)->deleteJson("/fitnessos/workout-logs/{$log['id']}")->assertNotFound();
    $this->actingAs($this->trainee)->deleteJson("/fitnessos/workout-logs/{$log['id']}")->assertOk();
    expect(WorkoutLog::count())->toBe(0);

    $this->actingAs($this->coach)->getJson('/fitnessos/my-plan')->assertForbidden();
});

test('sessions older than a week do not count toward this week\'s adherence', function () {
    $this->actingAs($this->trainee)->postJson('/fitnessos/workout-logs', logPayload([
        'plan_day_id' => $this->dayA->id,
        'performed_on' => now()->subDays(8)->toDateString(),
    ]))->assertCreated();

    $weeks = app(TrainingPlans::class)->adherence($this->trainee)['weeks'];
    expect($weeks[0]['done'])->toBe(0);
    expect($weeks[1]['done'])->toBe(1);
});
