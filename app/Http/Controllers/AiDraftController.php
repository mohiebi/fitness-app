<?php

namespace App\Http\Controllers;

use App\Models\AiDraft;
use App\Services\Ai\AssistantUnavailable;
use App\Services\Ai\CoachAssistant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Coach-only endpoints for the AI assistant. Every route sits behind the
 * coach role middleware; trainees have no way to reach the assistant.
 */
class AiDraftController extends Controller
{
    public function __construct(private CoachAssistant $assistant) {}

    public function status(Request $request): JsonResponse
    {
        return response()->json([
            'enabled' => $this->assistant->enabled(),
            'remaining_today' => $this->assistant->remainingToday($request->user()),
            'daily_limit' => (int) config('services.ai.daily_drafts_per_coach'),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'status' => ['nullable', Rule::in([AiDraft::PENDING, AiDraft::APPROVED, AiDraft::DISCARDED, AiDraft::FAILED])],
        ]);
        $coach = $request->user();

        $drafts = AiDraft::query()
            ->where('coach_id', $coach->id)
            ->where('status', $data['status'] ?? AiDraft::PENDING)
            ->whereHas('trainee', fn ($trainee) => $trainee->where('coach_id', $coach->id))
            ->with('trainee')
            ->latest('id')
            ->limit(100)
            ->get()
            ->map(fn (AiDraft $draft) => $draft->toSummaryArray());

        return response()->json($drafts);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'kind' => ['required', Rule::in(AiDraft::KINDS)],
            'trainee_id' => ['required', 'integer'],
            'checkin_id' => ['nullable', 'required_if:kind,'.AiDraft::CHECKIN_FEEDBACK, 'integer'],
            'instruction' => ['nullable', 'string', 'max:1000'],
        ]);

        try {
            $draft = $this->assistant->draft(
                $request->user(),
                $data['kind'],
                (int) $data['trainee_id'],
                isset($data['checkin_id']) ? (int) $data['checkin_id'] : null,
                $data['instruction'] ?? null,
            );
        } catch (AssistantUnavailable $e) {
            return response()->json(['message' => $e->getMessage()], 503);
        }

        return response()->json($draft->load('trainee')->toSummaryArray(), 201);
    }

    public function approve(Request $request, AiDraft $draft): JsonResponse
    {
        $data = $request->validate([
            'content' => ['nullable', 'string', 'max:5000'],
            'title' => ['nullable', 'string', 'max:120'],
        ]);

        $draft = $this->assistant->approve($request->user(), $draft, $data['content'] ?? null, $data['title'] ?? null);

        return response()->json([
            'message' => $draft->kind === AiDraft::PLAN
                ? __('Draft plan created. Review it in the plan editor, then activate it.')
                : __('Sent to your trainee.'),
            'draft' => $draft->load('trainee')->toSummaryArray(),
        ]);
    }

    public function discard(Request $request, AiDraft $draft): JsonResponse
    {
        $this->assistant->discard($request->user(), $draft);

        return response()->json(['message' => __('Draft discarded.')]);
    }
}
