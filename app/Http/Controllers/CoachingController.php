<?php

namespace App\Http\Controllers;

use App\Models\Coaching;
use App\Models\CoachProfile;
use App\Services\CoachingLifecycle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CoachingController extends Controller
{
    public function __construct(private CoachingLifecycle $lifecycle) {}

    /**
     * Coach: requests, current trainees or past trainees.
     */
    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'status' => ['nullable', Rule::in([Coaching::REQUESTED, Coaching::ACTIVE, Coaching::ENDED])],
        ]);

        $coachings = Coaching::query()
            ->where('coach_id', $request->user()->id)
            ->where('status', $data['status'] ?? Coaching::REQUESTED)
            ->with('trainee.traineeProfile')
            ->latest('id')
            ->limit(200)
            ->get()
            ->map(fn (Coaching $coaching) => [
                ...$coaching->toSummaryArray(),
                'trainee' => [
                    'id' => $coaching->trainee->id,
                    'name' => $coaching->trainee->name,
                    'email' => $coaching->trainee->email,
                    'profile' => $coaching->trainee->traineeProfile?->toSummaryArray(),
                ],
            ]);

        return response()->json($coachings);
    }

    /**
     * Trainee: current coach, pending request and history.
     */
    public function mine(Request $request): JsonResponse
    {
        $coachings = $request->user()->coachingsAsTrainee()
            ->with('coach.coachProfile.user')
            ->latest('id')
            ->get();

        $present = fn (?Coaching $coaching) => $coaching ? [
            ...$coaching->toSummaryArray(),
            'coach' => $coaching->coach->coachProfile?->toPublicArray() ?? ['name' => $coaching->coach->name],
        ] : null;

        return response()->json([
            'active' => $present($coachings->firstWhere('status', Coaching::ACTIVE)),
            'pending' => $present($coachings->firstWhere('status', Coaching::REQUESTED)),
            'history' => $coachings
                ->whereNotIn('status', [Coaching::ACTIVE, Coaching::REQUESTED])
                ->values()
                ->map($present),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'coach' => ['required', 'string', 'max:60'],
            'message' => ['nullable', 'string', 'max:2000'],
        ]);

        $profile = CoachProfile::query()->published()->where('slug', $data['coach'])->firstOrFail();
        $coaching = $this->lifecycle->request($request->user(), $profile, $data['message'] ?? null);

        return response()->json([
            'id' => $coaching->id,
            'message' => __('Your request was sent. The coach will review it soon.'),
        ], 201);
    }

    public function accept(Request $request, Coaching $coaching): JsonResponse
    {
        $this->lifecycle->accept($coaching, $request->user());

        return response()->json(['message' => __('Request accepted.')]);
    }

    public function decline(Request $request, Coaching $coaching): JsonResponse
    {
        $this->lifecycle->decline($coaching, $request->user());

        return response()->json(['message' => __('Request declined.')]);
    }

    public function withdraw(Request $request, Coaching $coaching): JsonResponse
    {
        $this->lifecycle->withdraw($coaching, $request->user());

        return response()->json(['message' => __('Request withdrawn.')]);
    }

    public function end(Request $request, Coaching $coaching): JsonResponse
    {
        $data = $request->validate(['reason' => ['nullable', 'string', 'max:500']]);
        $this->lifecycle->end($coaching, $request->user(), $data['reason'] ?? null);

        return response()->json(['message' => __('Coaching ended.')]);
    }
}
