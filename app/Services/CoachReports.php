<?php

namespace App\Services;

use App\Models\Coaching;
use App\Models\User;
use App\Models\WorkoutLog;
use App\Models\WorkoutPlan;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Business numbers for one coach, worked out from what is stored: their
 * coachings, their trainees' logged workouts, check-ins and reviews.
 * Time is counted in rolling 7-day weeks ending today, so the numbers mean
 * the same in any calendar.
 */
class CoachReports
{
    /** Days a coaching must last to count as retained. */
    private const RETENTION_DAYS = 30;

    /** Window for workout and check-in rates. */
    private const RATE_DAYS = 28;

    /**
     * @return array<string, mixed>
     */
    public function for(User $coach, int $weeks = 12): array
    {
        $weeks = max(4, min(26, $weeks));
        $today = CarbonImmutable::today();

        $coachings = Coaching::query()->where('coach_id', $coach->id)->get(['status', 'started_at', 'ended_at', 'created_at']);
        $trainees = User::query()->where('role', 'client')->where('coach_id', $coach->id)->orderBy('name')->get(['id', 'name']);
        $planned = $this->plannedPerWeek($trainees);

        $sessionsSince = $today->subDays(max($weeks, 8) * 7);
        $logs = WorkoutLog::query()
            ->whereIn('trainee_id', $trainees->pluck('id'))
            ->whereDate('performed_on', '>=', $sessionsSince->toDateString())
            ->get(['trainee_id', 'performed_on']);

        $checkins = DB::table('fitnessos_checkins')
            ->where('coach_id', $coach->id)
            ->where('created_at', '>=', $sessionsSince)
            ->get(['status', 'created_at', 'updated_at']);

        return [
            'summary' => $this->summary($coach, $coachings, $trainees, $planned, $logs, $checkins, $today),
            'growth' => $this->growth($coachings, $weeks, $today),
            'sessions' => $this->sessions($logs, array_sum($planned), 8, $today),
            'checkins' => $this->weeklyCheckins($checkins, 8, $today),
            'trainees' => $this->traineeAdherence($trainees, $planned, $logs, $today),
        ];
    }

    /**
     * Sessions per week the active plan asks for, by trainee id.
     *
     * @param  Collection<int, User>  $trainees
     * @return array<int, int>
     */
    private function plannedPerWeek(Collection $trainees): array
    {
        $plans = WorkoutPlan::query()
            ->whereIn('trainee_id', $trainees->pluck('id'))
            ->where('status', WorkoutPlan::ACTIVE)
            ->withCount(['days as planned_days' => fn ($days) => $days->whereHas('exercises')])
            ->get();

        $planned = [];
        foreach ($plans as $plan) {
            $planned[(int) $plan->trainee_id] = (int) $plan->getAttribute('planned_days');
        }

        return $planned;
    }

    /**
     * @param  Collection<int, Coaching>  $coachings
     * @param  Collection<int, User>  $trainees
     * @param  array<int, int>  $planned
     * @param  Collection<int, WorkoutLog>  $logs
     * @param  Collection<int, \stdClass>  $checkins
     * @return array<string, mixed>
     */
    private function summary(User $coach, Collection $coachings, Collection $trainees, array $planned, Collection $logs, Collection $checkins, CarbonImmutable $today): array
    {
        $started = $coachings->filter(fn (Coaching $coaching) => $coaching->started_at !== null);

        // Retention: of coachings that began long enough ago, how many lasted.
        $old = $started->filter(fn (Coaching $coaching) => $coaching->started_at->lte(now()->subDays(self::RETENTION_DAYS)));
        $retained = $old->filter(fn (Coaching $coaching) => $coaching->ended_at === null
            || $coaching->ended_at->gte($coaching->started_at->addDays(self::RETENTION_DAYS)));

        // Requests answered in the last 90 days: how many were accepted.
        $answered = $coachings->filter(fn (Coaching $coaching) => $coaching->created_at !== null
            && $coaching->created_at->gte(now()->subDays(90))
            && ($coaching->started_at !== null || $coaching->status === Coaching::DECLINED));
        $accepted = $answered->filter(fn (Coaching $coaching) => $coaching->started_at !== null);

        // Workouts logged against what the plans ask for.
        $windowStart = $today->subDays(self::RATE_DAYS - 1);
        $done = $logs->filter(fn (WorkoutLog $log) => $log->performed_on->gte($windowStart))->count();
        $plannedSessions = array_sum($planned) * (self::RATE_DAYS / 7);

        // Check-ins reviewed, and how long a review takes.
        $recent = $checkins->filter(fn ($checkin) => CarbonImmutable::parse($checkin->created_at)->gte($windowStart));
        $reviewed = $recent->where('status', 'Reviewed');
        $hours = $reviewed->map(fn ($checkin) => CarbonImmutable::parse($checkin->created_at)->diffInMinutes(CarbonImmutable::parse($checkin->updated_at)) / 60);

        $rating = $coach->coachProfile?->ratingSummary() ?? ['average' => null, 'count' => 0];

        return [
            'active_trainees' => $trainees->count(),
            'new_trainees' => $started->filter(fn (Coaching $coaching) => $coaching->started_at->gte(now()->subDays(30)))->count(),
            'retention' => $this->percent($retained->count(), $old->count()),
            'acceptance' => $this->percent($accepted->count(), $answered->count()),
            'workout_completion' => $plannedSessions > 0 ? min(100, (int) round($done / $plannedSessions * 100)) : null,
            'checkin_response' => $this->percent($reviewed->count(), $recent->count()),
            'avg_review_hours' => $hours->isEmpty() ? null : round((float) $hours->avg(), 1),
            'rating' => $rating['average'],
            'review_count' => $rating['count'],
        ];
    }

    private function percent(int $part, int $whole): ?int
    {
        return $whole === 0 ? null : (int) round($part / $whole * 100);
    }

    /**
     * Active trainees and new/ended coachings for each week, oldest first.
     *
     * @param  Collection<int, Coaching>  $coachings
     * @return list<array{week_start: string, active: int, started: int, ended: int}>
     */
    private function growth(Collection $coachings, int $weeks, CarbonImmutable $today): array
    {
        $started = $coachings->filter(fn (Coaching $coaching) => $coaching->started_at !== null);
        $rows = [];

        foreach ($this->weeks($weeks, $today) as [$start, $end]) {
            $endOfWeek = $end->endOfDay();
            $rows[] = [
                'week_start' => $start->toDateString(),
                'active' => $started->filter(fn (Coaching $coaching) => $coaching->started_at->lte($endOfWeek)
                    && ($coaching->ended_at === null || $coaching->ended_at->gt($endOfWeek)))->count(),
                'started' => $started->filter(fn (Coaching $coaching) => $coaching->started_at->between($start->startOfDay(), $endOfWeek))->count(),
                'ended' => $started->filter(fn (Coaching $coaching) => $coaching->ended_at !== null
                    && $coaching->ended_at->between($start->startOfDay(), $endOfWeek))->count(),
            ];
        }

        return $rows;
    }

    /**
     * Sessions the trainees logged each week, against what the plans ask for now.
     *
     * @param  Collection<int, WorkoutLog>  $logs
     * @return list<array{week_start: string, done: int, planned: int}>
     */
    private function sessions(Collection $logs, int $planned, int $weeks, CarbonImmutable $today): array
    {
        $rows = [];

        foreach ($this->weeks($weeks, $today) as [$start, $end]) {
            $rows[] = [
                'week_start' => $start->toDateString(),
                'done' => $logs->filter(fn (WorkoutLog $log) => $log->performed_on->between($start->startOfDay(), $end->endOfDay()))->count(),
                'planned' => $planned,
            ];
        }

        return $rows;
    }

    /**
     * @param  Collection<int, \stdClass>  $checkins
     * @return list<array{week_start: string, submitted: int, reviewed: int}>
     */
    private function weeklyCheckins(Collection $checkins, int $weeks, CarbonImmutable $today): array
    {
        $rows = [];

        foreach ($this->weeks($weeks, $today) as [$start, $end]) {
            $inWeek = $checkins->filter(fn ($checkin) => CarbonImmutable::parse($checkin->created_at)->between($start->startOfDay(), $end->endOfDay()));
            $rows[] = [
                'week_start' => $start->toDateString(),
                'submitted' => $inWeek->count(),
                'reviewed' => $inWeek->where('status', 'Reviewed')->count(),
            ];
        }

        return $rows;
    }

    /**
     * Each trainee's sessions in the last four weeks against the plan, so
     * the coach sees who needs a nudge. Lowest adherence first.
     *
     * @param  Collection<int, User>  $trainees
     * @param  array<int, int>  $planned
     * @param  Collection<int, WorkoutLog>  $logs
     * @return list<array{id: int, name: string, done: int, planned: int, percent: int|null}>
     */
    private function traineeAdherence(Collection $trainees, array $planned, Collection $logs, CarbonImmutable $today): array
    {
        $windowStart = $today->subDays(self::RATE_DAYS - 1);

        $rows = $trainees
            ->map(function (User $trainee) use ($planned, $logs, $windowStart): array {
                $done = $logs->filter(fn (WorkoutLog $log) => $log->trainee_id === $trainee->id && $log->performed_on->gte($windowStart))->count();
                $expected = (int) round(($planned[$trainee->id] ?? 0) * (self::RATE_DAYS / 7));

                return [
                    'id' => $trainee->id,
                    'name' => $trainee->name,
                    'done' => $done,
                    'planned' => $expected,
                    'percent' => $expected > 0 ? min(100, (int) round($done / $expected * 100)) : null,
                ];
            })
            ->sortBy(fn (array $row) => $row['percent'] ?? 1000)
            ->all();

        return array_values($rows);
    }

    /**
     * Rolling weeks ending today, oldest first, as [start, end] dates.
     *
     * @return list<array{0: CarbonImmutable, 1: CarbonImmutable}>
     */
    private function weeks(int $count, CarbonImmutable $today): array
    {
        $weeks = [];

        for ($i = $count - 1; $i >= 0; $i--) {
            $end = $today->subDays($i * 7);
            $weeks[] = [$end->subDays(6), $end];
        }

        return $weeks;
    }
}
