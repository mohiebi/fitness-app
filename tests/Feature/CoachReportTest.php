<?php

use App\Models\Coaching;
use App\Models\Exercise;
use App\Models\User;
use App\Models\WorkoutLog;
use App\Models\WorkoutPlan;
use App\Services\CoachingLifecycle;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    $this->coach = User::factory()->publishedCoach()->create(['name' => 'Sara Ahmadi']);
});

function reportFor(User $coach): array
{
    return test()->actingAs($coach)->getJson('/fitnessos/reports')->assertOk()->json();
}

function traineeOf(User $coach, string $name, int $startedDaysAgo = 0): User
{
    $trainee = User::factory()->trainee()->create(['name' => $name]);
    $coaching = app(CoachingLifecycle::class)->startDirect($coach, $trainee);
    $coaching->update(['started_at' => now()->subDays($startedDaysAgo)]);

    return $trainee;
}

function activePlan(User $coach, User $trainee, int $days): WorkoutPlan
{
    $exercise = Exercise::query()->whereNull('coach_id')->firstOrFail();
    $plan = WorkoutPlan::create(['coach_id' => $coach->id, 'trainee_id' => $trainee->id, 'title' => 'Plan', 'status' => WorkoutPlan::ACTIVE, 'activated_at' => now()->subDays(40)]);
    foreach (range(1, $days) as $position) {
        $plan->days()->create(['position' => $position, 'title' => "Day {$position}"])
            ->exercises()->create(['exercise_id' => $exercise->id, 'position' => 0, 'sets' => 3, 'reps' => '10']);
    }

    return $plan;
}

function logSessions(User $trainee, int $count, int $daysAgo = 1): void
{
    foreach (range(1, $count) as $i) {
        WorkoutLog::create(['trainee_id' => $trainee->id, 'title' => 'Session', 'performed_on' => now()->subDays($daysAgo)->toDateString()]);
    }
}

test('a coach with no data gets empty numbers, not errors', function () {
    $report = reportFor($this->coach);

    expect($report['summary'])->toMatchArray([
        'active_trainees' => 0, 'new_trainees' => 0, 'retention' => null, 'acceptance' => null,
        'workout_completion' => null, 'checkin_response' => null, 'avg_review_hours' => null, 'rating' => null, 'review_count' => 0,
    ]);
    expect($report['growth'])->toHaveCount(12)->and($report['sessions'])->toHaveCount(8)->and($report['checkins'])->toHaveCount(8);
    expect($report['trainees'])->toBe([]);
});

test('workout completion compares logged sessions with what the plans ask for', function () {
    $nima = traineeOf($this->coach, 'Nima', 60);
    $leila = traineeOf($this->coach, 'Leila', 60);
    activePlan($this->coach, $nima, 3);   // 12 sessions expected in 4 weeks
    activePlan($this->coach, $leila, 2);  // 8 more
    logSessions($nima, 9, 2);
    logSessions($leila, 2, 3);
    logSessions($leila, 5, 40);           // too old to count

    $report = reportFor($this->coach);

    expect($report['summary']['workout_completion'])->toBe(55); // 11 of 20
    expect($report['trainees'])->toBe([
        ['id' => $leila->id, 'name' => 'Leila', 'done' => 2, 'planned' => 8, 'percent' => 25],
        ['id' => $nima->id, 'name' => 'Nima', 'done' => 9, 'planned' => 12, 'percent' => 75],
    ]);
    expect(collect($report['sessions'])->last())->toMatchArray(['done' => 11, 'planned' => 5]);
});

test('trainees on no plan are listed last and never counted as behind', function () {
    $withPlan = traineeOf($this->coach, 'Aida', 30);
    activePlan($this->coach, $withPlan, 1);
    traineeOf($this->coach, 'Bahar', 30);

    $report = reportFor($this->coach);

    expect(collect($report['trainees'])->pluck('name')->all())->toBe(['Aida', 'Bahar']);
    expect($report['trainees'][1]['percent'])->toBeNull();
});

test('retention counts coachings that lasted the first 30 days', function () {
    $stayed = traineeOf($this->coach, 'Stayed', 90);
    $left = traineeOf($this->coach, 'Left', 90);
    $leftEarly = Coaching::query()->where('trainee_id', $left->id)->firstOrFail();
    $leftEarly->update(['status' => Coaching::ENDED, 'ended_at' => now()->subDays(75)]);   // ended after 15 days
    $left->update(['coach_id' => null]);
    traineeOf($this->coach, 'Recent', 5);                                                   // too new to judge

    $report = reportFor($this->coach);

    expect($report['summary']['retention'])->toBe(50);
    expect($report['summary']['active_trainees'])->toBe(2);
    expect($report['summary']['new_trainees'])->toBe(1);
    expect($stayed->fresh()->coach_id)->toBe($this->coach->id);
});

test('request acceptance counts answers from the last 90 days', function () {
    foreach ([Coaching::ACTIVE, Coaching::ACTIVE, Coaching::ACTIVE, Coaching::DECLINED] as $status) {
        Coaching::create([
            'coach_id' => $this->coach->id, 'trainee_id' => User::factory()->trainee()->create()->id, 'status' => $status,
            'started_at' => $status === Coaching::ACTIVE ? now()->subDays(3) : null,
        ]);
    }
    Coaching::create(['coach_id' => $this->coach->id, 'trainee_id' => User::factory()->trainee()->create()->id, 'status' => Coaching::REQUESTED]);

    expect(reportFor($this->coach)['summary']['acceptance'])->toBe(75);
});

test('check-in response and review time come from real check-ins', function () {
    $trainee = traineeOf($this->coach, 'Nima', 20);
    $row = fn (string $status, $created, $updated) => DB::table('fitnessos_checkins')->insert([
        'client_id' => $trainee->id, 'coach_id' => $this->coach->id, 'status' => $status, 'created_at' => $created, 'updated_at' => $updated,
    ]);
    $row('Reviewed', now()->subDays(3), now()->subDays(3)->addHours(2));
    $row('Reviewed', now()->subDays(2), now()->subDays(2)->addHours(4));
    $row('Pending', now()->subDay(), now()->subDay());

    $summary = reportFor($this->coach)['summary'];

    expect($summary['checkin_response'])->toBe(67);
    expect($summary['avg_review_hours'])->toEqual(3);
    expect(collect(reportFor($this->coach)['checkins'])->sum('submitted'))->toBe(3);
});

test('growth shows active trainees week by week', function () {
    traineeOf($this->coach, 'Old one', 100);
    traineeOf($this->coach, 'New one', 3);

    $growth = reportFor($this->coach)['growth'];

    expect($growth[0]['active'])->toBe(1);
    expect(collect($growth)->last())->toMatchArray(['active' => 2, 'started' => 1]);
});

test('reports only ever include the signed-in coach data', function () {
    $other = User::factory()->publishedCoach()->create();
    $theirs = traineeOf($other, 'Someone Else', 40);
    activePlan($other, $theirs, 3);
    logSessions($theirs, 6);

    $report = reportFor($this->coach);

    expect($report['summary']['active_trainees'])->toBe(0)->and($report['summary']['workout_completion'])->toBeNull();
    expect($report['trainees'])->toBe([]);
    expect(collect($report['sessions'])->sum('done'))->toBe(0);
});

test('trainees cannot open reports and the range is validated', function () {
    $trainee = User::factory()->trainee()->create();
    $this->actingAs($trainee)->getJson('/fitnessos/reports')->assertForbidden();

    $this->actingAs($this->coach)->getJson('/fitnessos/reports?weeks=2')->assertUnprocessable();
    expect($this->actingAs($this->coach)->getJson('/fitnessos/reports?weeks=8')->json('growth'))->toHaveCount(8);
});
