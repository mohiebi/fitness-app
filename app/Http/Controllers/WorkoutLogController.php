<?php

namespace App\Http\Controllers;

use App\Models\Exercise;
use App\Models\PlanDay;
use App\Models\WorkoutLog;
use App\Services\TrainingPlans;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Trainee endpoints: the active plan and the sessions they log. Logs
 * belong to the trainee and stay with them when coaching ends.
 */
class WorkoutLogController extends Controller
{
    public function __construct(private TrainingPlans $plans) {}

    public function myPlan(Request $request): JsonResponse
    {
        $trainee = $request->user();
        $plan = $this->plans->activePlanFor($trainee);

        $lastLogs = [];
        if ($plan) {
            $dayIds = $plan->days()->pluck('id');
            $lastLogs = WorkoutLog::query()
                ->where('trainee_id', $trainee->id)
                ->whereIn('plan_day_id', $dayIds)
                ->with('sets')
                ->latest('performed_on')
                ->latest('id')
                ->get()
                ->unique('plan_day_id')
                ->mapWithKeys(fn (WorkoutLog $log) => [$log->plan_day_id => $log->toSummaryArray()])
                ->all();
        }

        return response()->json([
            'plan' => $plan?->toDetailArray(),
            'last_logs' => (object) $lastLogs,
            'adherence' => $this->plans->adherence($trainee),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $logs = WorkoutLog::query()
            ->where('trainee_id', $request->user()->id)
            ->with('sets')
            ->latest('performed_on')
            ->latest('id')
            ->limit(50)
            ->get()
            ->map(fn (WorkoutLog $log) => $log->toSummaryArray());

        return response()->json($logs);
    }

    public function store(Request $request): JsonResponse
    {
        $trainee = $request->user();
        $data = $request->validate([
            'plan_day_id' => ['nullable', 'integer'],
            'title' => ['nullable', 'required_without:plan_day_id', 'string', 'max:120'],
            'performed_on' => ['required', 'date_format:Y-m-d', 'before_or_equal:today', 'after:'.now()->subYear()->toDateString()],
            'duration_minutes' => ['nullable', 'integer', 'between:1,600'],
            'effort' => ['nullable', 'integer', 'between:1,10'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'sets' => ['required', 'array', 'min:1', 'max:150'],
            'sets.*.exercise_id' => ['required', 'integer'],
            'sets.*.set_number' => ['required', 'integer', 'between:1,50'],
            'sets.*.reps' => ['nullable', 'integer', 'between:0,1000'],
            'sets.*.weight_kg' => ['nullable', 'numeric', 'between:0,1000'],
            'sets.*.completed' => ['boolean'],
        ]);

        $day = null;
        if (! empty($data['plan_day_id'])) {
            $plan = $this->plans->activePlanFor($trainee);
            $day = $plan ? PlanDay::query()->where('workout_plan_id', $plan->id)->whereKey((int) $data['plan_day_id'])->first() : null;
            if (! $day) {
                throw ValidationException::withMessages(['plan_day_id' => __('This workout is not part of your current plan.')]);
            }
        }

        $sets = $request->collect('sets');
        $exerciseIds = $sets->pluck('exercise_id')->unique();
        $names = Exercise::query()->whereIn('id', $exerciseIds)->pluck('name', 'id');
        if ($names->count() !== $exerciseIds->count()) {
            throw ValidationException::withMessages(['sets' => __('One of the exercises is not available.')]);
        }

        $log = DB::transaction(function () use ($trainee, $data, $sets, $day, $names): WorkoutLog {
            $log = WorkoutLog::create([
                'trainee_id' => $trainee->id,
                'workout_plan_id' => $day?->workout_plan_id,
                'plan_day_id' => $day?->id,
                'title' => $day !== null ? $day->title : $data['title'],
                'performed_on' => $data['performed_on'],
                'duration_minutes' => $data['duration_minutes'] ?? null,
                'effort' => $data['effort'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);

            $log->sets()->createMany($sets->map(fn (array $set) => [
                'exercise_id' => $set['exercise_id'],
                'exercise_name' => $names[$set['exercise_id']],
                'set_number' => $set['set_number'],
                'reps' => $set['reps'] ?? null,
                'weight_kg' => $set['weight_kg'] ?? null,
                'completed' => $set['completed'] ?? true,
            ])->all());

            return $log;
        });

        return response()->json([
            'message' => __('Workout saved. Nice work!'),
            'log' => $log->toSummaryArray(),
        ], 201);
    }

    public function destroy(Request $request, WorkoutLog $log): JsonResponse
    {
        abort_unless($log->trainee_id === $request->user()->id, 404);
        $log->delete();

        return response()->json(['message' => __('Workout deleted.')]);
    }
}
