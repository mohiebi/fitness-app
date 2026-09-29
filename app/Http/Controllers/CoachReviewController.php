<?php

namespace App\Http\Controllers;

use App\Models\Coaching;
use App\Models\CoachProfile;
use App\Models\CoachReview;
use App\Services\CoachReviews;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CoachReviewController extends Controller
{
    public function __construct(private CoachReviews $reviews) {}

    /**
     * Public: a coach's visible reviews.
     */
    public function index(string $slug): JsonResponse
    {
        $profile = CoachProfile::query()->published()->with('user')->where('slug', $slug)->firstOrFail();

        return response()->json([
            'summary' => $this->reviews->summary($profile->user),
            'reviews' => $profile->reviews()->visible()->with('trainee')->latest('id')->limit(30)->get()
                ->map(fn (CoachReview $review) => $review->toPublicArray()),
        ]);
    }

    /**
     * Trainee: coachings they can review, with any review already written.
     */
    public function mine(Request $request): JsonResponse
    {
        $trainee = $request->user();
        $reviews = CoachReview::query()->where('trainee_id', $trainee->id)->get()->keyBy('coaching_id');

        $coachings = $trainee->coachingsAsTrainee()
            ->whereIn('status', [Coaching::ACTIVE, Coaching::ENDED])
            ->whereNotNull('started_at')
            ->with('coach')
            ->latest('id')
            ->get()
            ->map(fn (Coaching $coaching) => [
                'coaching_id' => $coaching->id,
                'coach_name' => $coaching->coach->name,
                'status' => $coaching->status,
                'can_review' => $this->reviews->canReview($coaching),
                'eligible_on' => $coaching->started_at?->copy()->addDays($this->reviews->minimumDays())->toDateString(),
                'review' => ($review = $reviews->get($coaching->id)) ? [
                    'rating' => $review->rating,
                    'comment' => $review->comment,
                    'coach_reply' => $review->coach_reply,
                    'hidden' => $review->hidden_at !== null,
                ] : null,
            ]);

        return response()->json($coachings);
    }

    public function store(Request $request, Coaching $coaching): JsonResponse
    {
        $data = $request->validate([
            'rating' => ['required', 'integer', 'between:1,5'],
            'comment' => ['nullable', 'string', 'max:2000'],
        ]);

        $this->reviews->save($request->user(), $coaching, (int) $data['rating'], $data['comment'] ?? null);

        return response()->json(['message' => __('Thanks! Your review is published.')]);
    }

    /**
     * Coach: their own reviews, including hidden ones.
     */
    public function coachIndex(Request $request): JsonResponse
    {
        $coach = $request->user();

        return response()->json([
            'summary' => $this->reviews->summary($coach),
            'reviews' => CoachReview::query()->where('coach_id', $coach->id)->with('trainee')->latest('id')->limit(100)->get()
                ->map(fn (CoachReview $review) => [...$review->toPublicArray(), 'hidden' => $review->hidden_at !== null]),
        ]);
    }

    public function reply(Request $request, CoachReview $review): JsonResponse
    {
        $data = $request->validate(['reply' => ['nullable', 'string', 'max:1000']]);
        $reply = isset($data['reply']) && trim($data['reply']) !== '' ? trim($data['reply']) : null;

        $this->reviews->reply($request->user(), $review, $reply);

        return response()->json(['message' => __('Reply saved.')]);
    }
}
