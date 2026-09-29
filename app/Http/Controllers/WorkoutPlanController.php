<?php

namespace App\Http\Controllers;

use App\Models\WorkoutLog;
use App\Models\WorkoutPlan;
use App\Services\TrainingPlans;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Coach endpoints for building, assigning and activating plans.
 */
class WorkoutPlanController extends Controller
{
    public function __construct(private TrainingPlans $plans) {}

    public function index(Request $request): JsonResponse
    {
        $coach = $request->user();

        $plans = WorkoutPlan::query()
            ->where('coach_id', $coach->id)
            ->where(fn ($query) => $query
                ->whereNull('trainee_id')
                ->orWhereHas('trainee', fn ($trainee) => $trainee->where('coach_id', $coach->id)))
            ->with('trainee')
            ->withCount('days')
            ->latest('updated_at')
            ->get()
            ->map(fn (WorkoutPlan $plan) => [...$plan->toSummaryArray(), 'days_count' => $plan->days_count]);

        return response()->json($plans);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:120'],
            'trainee_id' => ['nullable', 'integer'],
            'from_plan_id' => ['nullable', 'integer'],
        ]);

        $plan = $this->plans->create($request->user(), $data);

        return response()->json($plan->toDetailArray(), 201);
    }

    public function show(Request $request, WorkoutPlan $plan): JsonResponse
    {
        $this->plans->ensureCanManage($request->user(), $plan);

        return response()->json($plan->toDetailArray());
    }

    public function update(Request $request, WorkoutPlan $plan): JsonResponse
    {
        $this->plans->ensureCanManage($request->user(), $plan);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:120'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'days' => ['present', 'array', 'max:14'],
            'days.*.id' => ['nullable', 'integer'],
            'days.*.title' => ['required', 'string', 'max:80'],
            'days.*.notes' => ['nullable', 'string', 'max:2000'],
            'days.*.exercises' => ['present', 'array', 'max:30'],
            'days.*.exercises.*.id' => ['nullable', 'integer'],
            'days.*.exercises.*.exercise_id' => ['required', 'integer'],
            'days.*.exercises.*.sets' => ['required', 'integer', 'between:1,20'],
            'days.*.exercises.*.reps' => ['required', 'string', 'max:20'],
            'days.*.exercises.*.rest_seconds' => ['nullable', 'integer', 'between:0,900'],
            'days.*.exercises.*.target_weight_kg' => ['nullable', 'numeric', 'between:0,1000'],
            'days.*.exercises.*.notes' => ['nullable', 'string', 'max:500'],
        ]);

        $plan = $this->plans->sync($request->user(), $plan, $data);

        return response()->json([
            'message' => __('Plan saved.'),
            'plan' => $plan->toDetailArray(),
        ]);
    }

    public function activate(Request $request, WorkoutPlan $plan): JsonResponse
    {
        $this->plans->ensureCanManage($request->user(), $plan);
        $this->plans->activate($request->user(), $plan);

        return response()->json(['message' => __('The plan is now active for your trainee.')]);
    }

    public function archive(Request $request, WorkoutPlan $plan): JsonResponse
    {
        $this->plans->ensureCanManage($request->user(), $plan);
        $this->plans->archive($plan);

        return response()->json(['message' => __('Plan archived.')]);
    }

    public function destroy(Request $request, WorkoutPlan $plan): JsonResponse
    {
        $this->plans->ensureCanManage($request->user(), $plan);
        abort_if($plan->status === WorkoutPlan::ACTIVE, 422, __('Archive the plan before deleting it.'));

        $plan->delete();

        return response()->json(['message' => __('Plan deleted.')]);
    }

    /**
     * A current trainee's active plan, adherence and recent sessions.
     */
    public function training(Request $request, int $trainee): JsonResponse
    {
        $user = $this->plans->currentTrainee($request->user(), $trainee);

        return response()->json([
            'active_plan' => $this->plans->activePlanFor($user)?->toSummaryArray(),
            'adherence' => $this->plans->adherence($user),
            'recent_logs' => WorkoutLog::query()
                ->where('trainee_id', $user->id)
                ->with('sets')
                ->latest('performed_on')
                ->latest('id')
                ->limit(10)
                ->get()
                ->map(fn (WorkoutLog $log) => $log->toSummaryArray()),
        ]);
    }
}
