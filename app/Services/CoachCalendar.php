<?php

namespace App\Services;

use App\Models\CalendarEvent;
use App\Models\Coaching;
use App\Models\User;
use App\Models\WorkoutLog;
use App\Models\WorkoutPlan;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * What the coach's calendar shows for a stretch of days: their own
 * appointments, and what their current trainees did (sessions logged,
 * check-ins sent, coachings started, plans activated).
 */
class CoachCalendar
{
    /** Most activity rows returned for one range. */
    private const ACTIVITY_LIMIT = 500;

    public function __construct(private CoachSubscriptions $subscriptions) {}

    /**
     * @return array{events: list<array<string, mixed>>, activity: list<array<string, mixed>>, upcoming: list<array<string, mixed>>, subscription_ends_at: string|null}
     */
    public function range(User $coach, CarbonInterface $from, CarbonInterface $to): array
    {
        $events = CalendarEvent::query()
            ->where('coach_id', $coach->id)
            ->where('starts_at', '>=', $from)
            ->where('starts_at', '<', $to)
            ->with('trainee:id,name')
            ->orderBy('starts_at')
            ->get();

        $upcoming = CalendarEvent::query()
            ->where('coach_id', $coach->id)
            ->where('starts_at', '>=', now())
            ->with('trainee:id,name')
            ->orderBy('starts_at')
            ->limit(6)
            ->get();

        $endsAt = $this->subscriptions->for($coach)->endsAt();

        return [
            'events' => array_values($events->map(fn (CalendarEvent $event) => $event->toSummaryArray())->all()),
            'activity' => $this->activity($coach, $from, $to),
            'upcoming' => array_values($upcoming->map(fn (CalendarEvent $event) => $event->toSummaryArray())->all()),
            'subscription_ends_at' => $endsAt !== null && $endsAt->gte($from) && $endsAt->lt($to) ? $endsAt->toIso8601String() : null,
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function activity(User $coach, CarbonInterface $from, CarbonInterface $to): array
    {
        $names = User::query()->where('role', 'client')->where('coach_id', $coach->id)->pluck('name', 'id');
        if ($names->isEmpty()) {
            return [];
        }
        $ids = $names->keys();
        $rows = [];

        WorkoutLog::query()
            ->whereIn('trainee_id', $ids)
            ->whereDate('performed_on', '>=', $from->toDateString())
            ->whereDate('performed_on', '<', $to->toDateString())
            ->orderBy('performed_on')
            ->limit(self::ACTIVITY_LIMIT)
            ->get(['trainee_id', 'title', 'performed_on'])
            ->each(function (WorkoutLog $log) use (&$rows, $names): void {
                $rows[] = ['type' => 'session', 'at' => $log->performed_on->toDateString(), 'trainee' => $this->trainee($names, $log->trainee_id), 'label' => $log->title];
            });

        DB::table('fitnessos_checkins')
            ->where('coach_id', $coach->id)
            ->whereIn('client_id', $ids)
            ->where('created_at', '>=', $from)
            ->where('created_at', '<', $to)
            ->orderBy('created_at')
            ->limit(self::ACTIVITY_LIMIT)
            ->get(['client_id', 'status', 'created_at'])
            ->each(function ($checkin) use (&$rows, $names): void {
                $rows[] = ['type' => 'checkin', 'at' => Carbon::parse($checkin->created_at)->toIso8601String(), 'trainee' => $this->trainee($names, (int) $checkin->client_id), 'label' => $checkin->status];
            });

        Coaching::query()
            ->where('coach_id', $coach->id)
            ->where('status', Coaching::ACTIVE)
            ->whereIn('trainee_id', $ids)
            ->where('started_at', '>=', $from)
            ->where('started_at', '<', $to)
            ->get(['trainee_id', 'started_at'])
            ->each(function (Coaching $coaching) use (&$rows, $names): void {
                $rows[] = ['type' => 'started', 'at' => $coaching->started_at->toIso8601String(), 'trainee' => $this->trainee($names, $coaching->trainee_id), 'label' => null];
            });

        WorkoutPlan::query()
            ->where('coach_id', $coach->id)
            ->whereIn('trainee_id', $ids)
            ->where('activated_at', '>=', $from)
            ->where('activated_at', '<', $to)
            ->get(['trainee_id', 'title', 'activated_at'])
            ->each(function (WorkoutPlan $plan) use (&$rows, $names): void {
                $rows[] = ['type' => 'plan', 'at' => $plan->activated_at->toIso8601String(), 'trainee' => $this->trainee($names, (int) $plan->trainee_id), 'label' => $plan->title];
            });

        return $rows;
    }

    /**
     * @param  Collection<int, string>  $names
     * @return array{id: int, name: string}
     */
    private function trainee(Collection $names, int $id): array
    {
        return ['id' => $id, 'name' => (string) $names->get($id)];
    }
}
