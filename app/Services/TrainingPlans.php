<?php

namespace App\Services;

use App\Models\Exercise;
use App\Models\PlanDay;
use App\Models\PlanExercise;
use App\Models\User;
use App\Models\WorkoutLog;
use App\Models\WorkoutPlan;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Coach-side plan management. A trainee has at most one active plan; a
 * coach only manages templates and plans of trainees they currently coach.
 */
class TrainingPlans
{
    public function __construct(private Notifier $notifier) {}

    /**
     * A trainee the coach currently coaches, or 404.
     */
    public function currentTrainee(User $coach, int $traineeId): User
    {
        return User::query()
            ->whereKey($traineeId)
            ->where('role', 'client')
            ->where('coach_id', $coach->id)
            ->firstOrFail();
    }

    public function ensureCanManage(User $coach, WorkoutPlan $plan): void
    {
        abort_unless($plan->coach_id === $coach->id, 404);

        if (! $plan->isTemplate()) {
            abort_unless($plan->trainee?->coach_id === $coach->id, 404);
        }
    }

    /**
     * @param  array{title: string, trainee_id?: int|null, from_plan_id?: int|null}  $data
     */
    public function create(User $coach, array $data): WorkoutPlan
    {
        $traineeId = $data['trainee_id'] ?? null;
        if ($traineeId !== null) {
            $this->currentTrainee($coach, $traineeId);
        }

        $source = null;
        if (! empty($data['from_plan_id'])) {
            $source = WorkoutPlan::query()->findOrFail($data['from_plan_id']);
            $this->ensureCanManage($coach, $source);
        }

        return DB::transaction(function () use ($coach, $data, $traineeId, $source): WorkoutPlan {
            $plan = WorkoutPlan::create([
                'coach_id' => $coach->id,
                'trainee_id' => $traineeId,
                'title' => $data['title'],
                'notes' => $source?->notes,
                'status' => WorkoutPlan::DRAFT,
            ]);

            foreach ($source?->days()->with('exercises')->get() ?? [] as $day) {
                $copy = $plan->days()->create(Arr::only($day->getAttributes(), ['position', 'title', 'notes']));
                foreach ($day->exercises as $item) {
                    $copy->exercises()->create(Arr::only($item->getAttributes(), [
                        'exercise_id', 'position', 'sets', 'reps', 'rest_seconds', 'target_weight_kg', 'notes',
                    ]));
                }
            }

            return $plan;
        });
    }

    /**
     * Replace the plan's content. Days and exercises that come back with
     * their id are updated in place so workout logs stay linked to them.
     *
     * @param  array{title: string, notes?: string|null, days: array<int, array<string, mixed>>}  $data
     */
    public function sync(User $coach, WorkoutPlan $plan, array $data): WorkoutPlan
    {
        $exerciseIds = collect($data['days'])->flatMap(fn (array $day) => Arr::pluck($day['exercises'], 'exercise_id'))->unique();
        $visible = Exercise::query()->visibleTo($coach)->whereIn('id', $exerciseIds)->count();
        if ($visible !== $exerciseIds->count()) {
            throw ValidationException::withMessages(['days' => __('One of the exercises is not available.')]);
        }

        return DB::transaction(function () use ($plan, $data): WorkoutPlan {
            $plan->update(['title' => $data['title'], 'notes' => $data['notes'] ?? null]);

            $existingDays = $plan->days()->with('exercises')->get()->keyBy('id');
            $keptDayIds = collect($data['days'])->pluck('id')->filter()->intersect($existingDays->keys());
            $plan->days()->whereNotIn('id', $keptDayIds)->delete();

            foreach (array_values($data['days']) as $position => $dayData) {
                $attributes = ['position' => $position, 'title' => $dayData['title'], 'notes' => $dayData['notes'] ?? null];
                $existing = isset($dayData['id']) ? $existingDays->get($dayData['id']) : null;

                $day = $existing ?? $plan->days()->make();
                $day->fill($attributes)->save();
                $this->syncExercises($day, $existing, $dayData['exercises']);
            }

            return $plan->refresh();
        });
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     */
    private function syncExercises(PlanDay $day, ?PlanDay $existing, array $items): void
    {
        $existingItems = $existing?->exercises->keyBy('id') ?? collect();
        $keptIds = collect($items)->pluck('id')->filter()->intersect($existingItems->keys());
        $day->exercises()->whereNotIn('id', $keptIds)->delete();

        foreach (array_values($items) as $position => $itemData) {
            $item = (isset($itemData['id']) ? $existingItems->get($itemData['id']) : null) ?? new PlanExercise(['plan_day_id' => $day->id]);
            $item->fill([
                'plan_day_id' => $day->id,
                'exercise_id' => $itemData['exercise_id'],
                'position' => $position,
                'sets' => $itemData['sets'],
                'reps' => $itemData['reps'],
                'rest_seconds' => $itemData['rest_seconds'] ?? null,
                'target_weight_kg' => $itemData['target_weight_kg'] ?? null,
                'notes' => $itemData['notes'] ?? null,
            ])->save();
        }
    }

    public function activate(User $coach, WorkoutPlan $plan): WorkoutPlan
    {
        if ($plan->isTemplate()) {
            throw ValidationException::withMessages(['plan' => __('Assign the template to a trainee before activating it.')]);
        }

        if (! $plan->days()->whereHas('exercises')->exists()) {
            throw ValidationException::withMessages(['plan' => __('Add at least one exercise before activating the plan.')]);
        }

        $activated = DB::transaction(function () use ($plan): WorkoutPlan {
            WorkoutPlan::query()
                ->where('trainee_id', $plan->trainee_id)
                ->where('status', WorkoutPlan::ACTIVE)
                ->whereKeyNot($plan->id)
                ->update(['status' => WorkoutPlan::ARCHIVED, 'archived_at' => now()]);

            $plan->update(['status' => WorkoutPlan::ACTIVE, 'activated_at' => now(), 'archived_at' => null]);

            return $plan;
        });
        $this->notifier->planActivated($activated);

        return $activated;
    }

    public function archive(WorkoutPlan $plan): WorkoutPlan
    {
        $plan->update(['status' => WorkoutPlan::ARCHIVED, 'archived_at' => now()]);

        return $plan;
    }

    public function activePlanFor(User $trainee): ?WorkoutPlan
    {
        return WorkoutPlan::query()
            ->where('trainee_id', $trainee->id)
            ->where('status', WorkoutPlan::ACTIVE)
            ->latest('activated_at')
            ->first();
    }

    /**
     * Sessions planned per week versus sessions logged, this week and the
     * three weeks before (each "week" is a rolling 7-day window).
     *
     * @return array{planned_per_week: int, weeks: list<array{starts_on: string, done: int}>}
     */
    public function adherence(User $trainee): array
    {
        $plan = $this->activePlanFor($trainee);
        $planned = $plan ? $plan->days()->whereHas('exercises')->count() : 0;
        $today = now()->startOfDay();

        $weeks = [];
        for ($week = 0; $week < 4; $week++) {
            $end = $today->copy()->subDays($week * 7);
            $start = $end->copy()->subDays(6);
            $weeks[] = [
                'starts_on' => $start->toDateString(),
                'done' => WorkoutLog::query()
                    ->where('trainee_id', $trainee->id)
                    ->whereDate('performed_on', '>=', $start->toDateString())
                    ->whereDate('performed_on', '<=', $end->toDateString())
                    ->count(),
            ];
        }

        return ['planned_per_week' => $planned, 'weeks' => $weeks];
    }
}
