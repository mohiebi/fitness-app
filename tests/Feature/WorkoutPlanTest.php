<?php

use App\Models\Exercise;
use App\Models\User;
use App\Models\WorkoutPlan;
use App\Services\CoachingLifecycle;
use App\Services\TrainingPlans;

beforeEach(function () {
    $this->coach = User::factory()->publishedCoach()->create();
    $this->trainee = User::factory()->trainee()->create();
    $this->coaching = app(CoachingLifecycle::class)->startDirect($this->coach, $this->trainee);
    $this->squat = Exercise::query()->where('name_en', 'Back squat')->firstOrFail();
    $this->bench = Exercise::query()->where('name_en', 'Bench press')->firstOrFail();
});

function planPayload(array $exercises, array $overrides = []): array
{
    return [
        'title' => 'Strength block',
        'notes' => null,
        'days' => [[
            'title' => 'Day A',
            'exercises' => $exercises,
        ]],
        ...$overrides,
    ];
}

test('the migration ships a shared exercise library and coaches can add their own', function () {
    expect(Exercise::query()->whereNull('coach_id')->count())->toBeGreaterThan(30);

    $this->actingAs($this->coach)->postJson('/fitnessos/exercises', [
        'name' => 'اسکوات روی باکس',
        'muscle_group' => 'legs',
        'equipment' => 'barbell',
    ])->assertCreated()->assertJsonPath('custom', true);

    $other = User::factory()->create();
    $this->actingAs($this->coach)->getJson('/fitnessos/exercises?q=باکس')->assertJsonCount(1);
    $this->actingAs($other)->getJson('/fitnessos/exercises?q=باکس')->assertJsonCount(0);
    $this->actingAs($this->coach)->getJson('/fitnessos/exercises?muscle_group=chest')->assertOk()
        ->assertJsonFragment(['name_en' => 'Bench press']);
});

test('a coach builds, saves and activates a plan for a current trainee', function () {
    $plan = $this->actingAs($this->coach)->postJson('/fitnessos/plans', [
        'title' => 'Strength block',
        'trainee_id' => $this->trainee->id,
    ])->assertCreated()->json();

    $this->actingAs($this->coach)->postJson("/fitnessos/plans/{$plan['id']}/activate")->assertUnprocessable();

    $saved = $this->actingAs($this->coach)->putJson("/fitnessos/plans/{$plan['id']}", planPayload([
        ['exercise_id' => $this->squat->id, 'sets' => 4, 'reps' => '6-8', 'rest_seconds' => 150, 'target_weight_kg' => 60],
        ['exercise_id' => $this->bench->id, 'sets' => 3, 'reps' => '8-10'],
    ]))->assertOk()->json('plan');

    expect($saved['days'][0]['exercises'])->toHaveCount(2);
    expect($saved['days'][0]['exercises'][0]['target_weight_kg'])->toEqual(60);

    $this->actingAs($this->coach)->postJson("/fitnessos/plans/{$plan['id']}/activate")->assertOk();
    expect(WorkoutPlan::find($plan['id'])->status)->toBe(WorkoutPlan::ACTIVE);
});

test('saving keeps ids of days and exercises that come back and removes the rest', function () {
    $plan = app(TrainingPlans::class)->create($this->coach, ['title' => 'Plan', 'trainee_id' => $this->trainee->id]);
    $first = $this->actingAs($this->coach)->putJson("/fitnessos/plans/{$plan->id}", planPayload([
        ['exercise_id' => $this->squat->id, 'sets' => 4, 'reps' => '5'],
        ['exercise_id' => $this->bench->id, 'sets' => 3, 'reps' => '8'],
    ]))->json('plan');

    $day = $first['days'][0];
    $second = $this->actingAs($this->coach)->putJson("/fitnessos/plans/{$plan->id}", planPayload([
        ['id' => $day['exercises'][1]['id'], 'exercise_id' => $this->bench->id, 'sets' => 5, 'reps' => '5'],
    ], ['days' => [
        ['id' => $day['id'], 'title' => 'Day A', 'exercises' => [
            ['id' => $day['exercises'][1]['id'], 'exercise_id' => $this->bench->id, 'sets' => 5, 'reps' => '5'],
        ]],
        ['title' => 'Day B', 'exercises' => []],
    ]]))->assertOk()->json('plan');

    expect($second['days'])->toHaveCount(2);
    expect($second['days'][0]['id'])->toBe($day['id']);
    expect($second['days'][0]['exercises'])->toHaveCount(1);
    expect($second['days'][0]['exercises'][0]['id'])->toBe($day['exercises'][1]['id']);
    expect($second['days'][0]['exercises'][0]['sets'])->toBe(5);
});

test('activating a plan archives the trainee\'s previous active plan', function () {
    $service = app(TrainingPlans::class);
    $old = $service->create($this->coach, ['title' => 'Old', 'trainee_id' => $this->trainee->id]);
    $service->sync($this->coach, $old, planPayload([['exercise_id' => $this->squat->id, 'sets' => 3, 'reps' => '5']]));
    $service->activate($this->coach, $old);

    $new = $service->create($this->coach, ['title' => 'New', 'trainee_id' => $this->trainee->id, 'from_plan_id' => $old->id]);
    expect($new->days()->first()->exercises()->count())->toBe(1);
    $service->activate($this->coach, $new);

    expect($old->fresh()->status)->toBe(WorkoutPlan::ARCHIVED);
    expect($new->fresh()->status)->toBe(WorkoutPlan::ACTIVE);
});

test('templates can be copied to a trainee but not activated directly', function () {
    $template = $this->actingAs($this->coach)->postJson('/fitnessos/plans', ['title' => 'Beginner full body'])->assertCreated()->json();
    $this->actingAs($this->coach)->putJson("/fitnessos/plans/{$template['id']}", planPayload([
        ['exercise_id' => $this->squat->id, 'sets' => 3, 'reps' => '10'],
    ], ['title' => 'Beginner full body']))->assertOk();

    $this->actingAs($this->coach)->postJson("/fitnessos/plans/{$template['id']}/activate")->assertUnprocessable();

    $copy = $this->actingAs($this->coach)->postJson('/fitnessos/plans', [
        'title' => 'Beginner full body',
        'trainee_id' => $this->trainee->id,
        'from_plan_id' => $template['id'],
    ])->assertCreated()->json();

    expect($copy['template'])->toBeFalse();
    expect($copy['days'][0]['exercises'])->toHaveCount(1);
});

test('coaches cannot touch other coaches\' plans, ex-trainees, or other coaches\' exercises', function () {
    $service = app(TrainingPlans::class);
    $plan = $service->create($this->coach, ['title' => 'Plan', 'trainee_id' => $this->trainee->id]);
    $other = User::factory()->publishedCoach()->create();
    $stranger = User::factory()->trainee()->create();

    $this->actingAs($other)->getJson("/fitnessos/plans/{$plan->id}")->assertNotFound();
    $this->actingAs($other)->postJson('/fitnessos/plans', ['title' => 'X', 'trainee_id' => $this->trainee->id])->assertNotFound();
    $this->actingAs($this->coach)->postJson('/fitnessos/plans', ['title' => 'X', 'trainee_id' => $stranger->id])->assertNotFound();

    $foreign = new Exercise(['name' => 'Secret move', 'muscle_group' => 'legs', 'equipment' => 'other']);
    $foreign->coach_id = $other->id;
    $foreign->save();
    $this->actingAs($this->coach)->putJson("/fitnessos/plans/{$plan->id}", planPayload([
        ['exercise_id' => $foreign->id, 'sets' => 3, 'reps' => '5'],
    ]))->assertUnprocessable();

    app(CoachingLifecycle::class)->end($this->coaching, $this->trainee->fresh());
    $this->actingAs($this->coach)->getJson("/fitnessos/plans/{$plan->id}")->assertNotFound();
    $this->actingAs($this->coach)->getJson('/fitnessos/plans')->assertJsonCount(0);
    $this->actingAs($this->coach)->getJson("/fitnessos/trainees/{$this->trainee->id}/training")->assertNotFound();
});

test('active plans must be archived before deletion, and trainees cannot use coach plan endpoints', function () {
    $service = app(TrainingPlans::class);
    $plan = $service->create($this->coach, ['title' => 'Plan', 'trainee_id' => $this->trainee->id]);
    $service->sync($this->coach, $plan, planPayload([['exercise_id' => $this->squat->id, 'sets' => 3, 'reps' => '5']]));
    $service->activate($this->coach, $plan);

    $this->actingAs($this->coach)->deleteJson("/fitnessos/plans/{$plan->id}")->assertUnprocessable();
    $this->actingAs($this->coach)->postJson("/fitnessos/plans/{$plan->id}/archive")->assertOk();
    $this->actingAs($this->coach)->deleteJson("/fitnessos/plans/{$plan->id}")->assertOk();

    $this->actingAs($this->trainee->fresh())->getJson('/fitnessos/plans')->assertForbidden();
    $this->actingAs($this->trainee->fresh())->getJson('/fitnessos/exercises')->assertForbidden();
});
