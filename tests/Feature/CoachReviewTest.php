<?php

use App\Models\CoachReview;
use App\Models\User;
use App\Services\CoachingLifecycle;

beforeEach(function () {
    $this->coach = User::factory()->publishedCoach(['slug' => 'sara'])->create(['name' => 'Sara Ahmadi']);
    $this->trainee = User::factory()->trainee()->create(['name' => 'Nima Rezaei']);
    $this->coaching = app(CoachingLifecycle::class)->startDirect($this->coach, $this->trainee);
});

test('trainees can review only after the minimum coaching time', function () {
    $this->actingAs($this->trainee)->getJson('/fitnessos/my-reviews')->assertJsonPath('0.can_review', false);
    $this->actingAs($this->trainee)->postJson("/fitnessos/coachings/{$this->coaching->id}/review", ['rating' => 5])
        ->assertJsonValidationErrors('rating');

    $this->coaching->update(['started_at' => now()->subDays(15)]);

    $this->actingAs($this->trainee)->getJson('/fitnessos/my-reviews')->assertJsonPath('0.can_review', true);
    $this->actingAs($this->trainee)->postJson("/fitnessos/coachings/{$this->coaching->id}/review", ['rating' => 5, 'comment' => 'Great coach'])
        ->assertOk();
    $this->actingAs($this->trainee)->postJson("/fitnessos/coachings/{$this->coaching->id}/review", ['rating' => 4, 'comment' => 'Updated'])
        ->assertOk();

    expect(CoachReview::count())->toBe(1);
    expect(CoachReview::query()->value('rating'))->toBe(4);
});

test('a short coaching that already ended cannot be reviewed', function () {
    $this->coaching->update(['started_at' => now()->subDays(20)]);
    app(CoachingLifecycle::class)->end($this->coaching, $this->trainee->fresh());
    $this->coaching->update(['ended_at' => now()->subDays(12)]);

    $this->actingAs($this->trainee)->postJson("/fitnessos/coachings/{$this->coaching->id}/review", ['rating' => 1])
        ->assertJsonValidationErrors('rating');

    $this->coaching->update(['ended_at' => now()->subDays(2)]);
    $this->actingAs($this->trainee)->postJson("/fitnessos/coachings/{$this->coaching->id}/review", ['rating' => 3])->assertOk();
});

test('reviews appear on the profile and in the directory with the first name only', function () {
    $this->coaching->update(['started_at' => now()->subDays(30)]);
    $this->actingAs($this->trainee)->postJson("/fitnessos/coachings/{$this->coaching->id}/review", ['rating' => 4, 'comment' => 'Knows her stuff']);

    $this->getJson('/fitnessos/coaches/sara/reviews')->assertOk()
        ->assertJsonPath('summary.count', 1)
        ->assertJsonPath('summary.average', 4)
        ->assertJsonPath('reviews.0.reviewer', 'Nima')
        ->assertJsonMissing(['reviewer' => 'Nima Rezaei']);

    $this->getJson('/fitnessos/coaches')->assertJsonPath('data.0.rating.count', 1)->assertJsonPath('data.0.rating.average', 4);
    $this->getJson('/fitnessos/coaches/sara')->assertJsonPath('rating.count', 1);
});

test('coaches reply to their own reviews; hidden reviews leave the public page', function () {
    $this->coaching->update(['started_at' => now()->subDays(30)]);
    $this->actingAs($this->trainee)->postJson("/fitnessos/coachings/{$this->coaching->id}/review", ['rating' => 2, 'comment' => 'Slow replies']);
    $review = CoachReview::query()->firstOrFail();
    $other = User::factory()->publishedCoach()->create();

    $this->actingAs($other)->postJson("/fitnessos/coach-reviews/{$review->id}/reply", ['reply' => 'Hi'])->assertNotFound();
    $this->actingAs($this->coach)->postJson("/fitnessos/coach-reviews/{$review->id}/reply", ['reply' => 'Sorry, I will do better.'])->assertOk();
    $this->getJson('/fitnessos/coaches/sara/reviews')->assertJsonPath('reviews.0.coach_reply', 'Sorry, I will do better.');

    $this->artisan('fitnessos:reviews:hide', ['id' => $review->id])->assertSuccessful();
    $this->getJson('/fitnessos/coaches/sara/reviews')->assertJsonPath('summary.count', 0)->assertJsonCount(0, 'reviews');
    $this->actingAs($this->coach)->getJson('/fitnessos/coach-reviews')->assertJsonPath('reviews.0.hidden', true);
});

test('only the trainee of a coaching can review it', function () {
    $this->coaching->update(['started_at' => now()->subDays(30)]);
    $stranger = User::factory()->trainee()->create();

    $this->actingAs($stranger)->postJson("/fitnessos/coachings/{$this->coaching->id}/review", ['rating' => 1])->assertNotFound();
    $this->actingAs($this->coach)->postJson("/fitnessos/coachings/{$this->coaching->id}/review", ['rating' => 5])->assertForbidden();
});
