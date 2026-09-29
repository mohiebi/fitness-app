<?php

namespace App\Services;

use App\Models\Coaching;
use App\Models\CoachReview;
use App\Models\User;
use Illuminate\Validation\ValidationException;

/**
 * Verified reviews: a trainee can review a coaching once they trained
 * together for at least the minimum number of days.
 */
class CoachReviews
{
    public function minimumDays(): int
    {
        return (int) config('fitnessos.review_min_days', 14);
    }

    public function canReview(Coaching $coaching): bool
    {
        if ($coaching->started_at === null || ! in_array($coaching->status, [Coaching::ACTIVE, Coaching::ENDED], true)) {
            return false;
        }

        $until = $coaching->status === Coaching::ENDED && $coaching->ended_at !== null ? $coaching->ended_at : now();

        return $coaching->started_at->diffInDays($until) >= $this->minimumDays();
    }

    /**
     * Create or update the trainee's review of a coaching.
     */
    public function save(User $trainee, Coaching $coaching, int $rating, ?string $comment): CoachReview
    {
        abort_unless($coaching->trainee_id === $trainee->id, 404);

        if (! $this->canReview($coaching)) {
            throw ValidationException::withMessages(['rating' => __('You can review a coach after training together for :days days.', ['days' => $this->minimumDays()])]);
        }

        return CoachReview::query()->updateOrCreate(['coaching_id' => $coaching->id], [
            'coach_id' => $coaching->coach_id,
            'trainee_id' => $trainee->id,
            'rating' => $rating,
            'comment' => $comment,
        ]);
    }

    public function reply(User $coach, CoachReview $review, ?string $reply): CoachReview
    {
        abort_unless($review->coach_id === $coach->id, 404);

        $review->fill([
            'coach_reply' => $reply,
            'replied_at' => $reply === null ? null : now(),
        ])->save();

        return $review;
    }

    /**
     * @return array{average: float|null, count: int}
     */
    public function summary(User $coach): array
    {
        $query = CoachReview::query()->visible()->where('coach_id', $coach->id);
        $count = (clone $query)->count();

        return [
            'average' => $count > 0 ? round((float) $query->avg('rating'), 1) : null,
            'count' => $count,
        ];
    }
}
