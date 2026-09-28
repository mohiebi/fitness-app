<?php

use App\Models\Coaching;
use App\Models\User;
use App\Services\CoachingLifecycle;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

beforeEach(function () {
    $this->lifecycle = app(CoachingLifecycle::class);
});

test('a request becomes the active coaching once the coach accepts', function () {
    $coach = User::factory()->publishedCoach()->create();
    $trainee = User::factory()->trainee()->create();

    $coaching = $this->lifecycle->request($trainee, $coach->coachProfile, 'Hi!');
    expect($coaching->status)->toBe(Coaching::REQUESTED);
    expect($trainee->fresh()->coach_id)->toBeNull();

    $this->lifecycle->accept($coaching, $coach);

    expect($coaching->fresh()->status)->toBe(Coaching::ACTIVE);
    expect($coaching->fresh()->started_at)->not->toBeNull();
    expect($trainee->fresh()->coach_id)->toBe($coach->id);
});

test('accepting a new coach ends the previous coaching as switched', function () {
    $first = User::factory()->publishedCoach()->create();
    $second = User::factory()->publishedCoach()->create();
    $trainee = User::factory()->trainee()->create();

    $old = $this->lifecycle->accept($this->lifecycle->request($trainee, $first->coachProfile), $first);
    $new = $this->lifecycle->accept($this->lifecycle->request($trainee->fresh(), $second->coachProfile), $second);

    expect($old->fresh()->status)->toBe(Coaching::ENDED);
    expect($old->fresh()->end_reason)->toBe(CoachingLifecycle::REASON_SWITCHED);
    expect($new->fresh()->status)->toBe(Coaching::ACTIVE);
    expect($trainee->fresh()->coach_id)->toBe($second->id);
});

test('a trainee can only have one pending request', function () {
    $first = User::factory()->publishedCoach()->create();
    $second = User::factory()->publishedCoach()->create();
    $trainee = User::factory()->trainee()->create();

    $this->lifecycle->request($trainee, $first->coachProfile);
    $this->lifecycle->request($trainee, $second->coachProfile);
})->throws(ValidationException::class);

test('unpublished, closed and full coaches cannot be requested', function (array $profile, bool $fillOneSpot) {
    $coach = User::factory()->publishedCoach($profile)->create();
    if ($fillOneSpot) {
        $this->lifecycle->startDirect($coach, User::factory()->trainee()->create());
    }

    $this->lifecycle->request(User::factory()->trainee()->create(), $coach->coachProfile->fresh());
})->with([
    'unpublished' => [['is_published' => false], false],
    'not accepting' => [['accepting_clients' => false], false],
    'full' => [['max_clients' => 1], true],
])->throws(ValidationException::class);

test('either side can end an active coaching and the trainee loses the coach pointer', function (string $who) {
    $coach = User::factory()->publishedCoach()->create();
    $trainee = User::factory()->trainee()->create();
    $coaching = $this->lifecycle->startDirect($coach, $trainee);

    $this->lifecycle->end($coaching, $who === 'coach' ? $coach : $trainee->fresh(), 'moving city');

    expect($coaching->fresh()->status)->toBe(Coaching::ENDED);
    expect($coaching->fresh()->end_reason)->toBe('moving city');
    expect($trainee->fresh()->coach_id)->toBeNull();
})->with(['coach', 'trainee']);

test('pending requests can be declined by the coach or withdrawn by the trainee', function () {
    $coach = User::factory()->publishedCoach()->create();
    $trainee = User::factory()->trainee()->create();

    $declined = $this->lifecycle->request($trainee, $coach->coachProfile);
    $this->lifecycle->decline($declined, $coach);
    expect($declined->fresh()->status)->toBe(Coaching::DECLINED);

    $withdrawn = $this->lifecycle->request($trainee, $coach->coachProfile);
    $this->lifecycle->withdraw($withdrawn, $trainee);
    expect($withdrawn->fresh()->status)->toBe(Coaching::WITHDRAWN);

    expect(fn () => $this->lifecycle->accept($withdrawn, $coach))->toThrow(ValidationException::class);
});

test('a coach cannot act on another coach\'s request', function () {
    $coach = User::factory()->publishedCoach()->create();
    $other = User::factory()->publishedCoach()->create();
    $coaching = $this->lifecycle->request(User::factory()->trainee()->create(), $coach->coachProfile);

    $this->lifecycle->accept($coaching, $other);
})->throws(NotFoundHttpException::class);
