<?php

namespace App\Services;

use App\Models\AiDraft;
use App\Models\Coaching;
use App\Models\User;
use App\Models\WorkoutPlan;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as SupportCollection;
use Illuminate\Support\Facades\DB;
use stdClass;

/**
 * What is waiting for a coach right now. Shared by the Telegram bot and
 * the morning summary, so both count things the same way.
 */
class CoachDesk
{
    /** Days without a logged session before a trainee counts as idle. */
    public const IDLE_DAYS = 7;

    public function __construct(private CoachSubscriptions $subscriptions) {}

    /**
     * Coaching requests waiting for an answer, oldest first.
     *
     * @return Collection<int, Coaching>
     */
    public function requests(User $coach): Collection
    {
        return Coaching::query()
            ->where('coach_id', $coach->id)
            ->where('status', Coaching::REQUESTED)
            ->with('trainee.traineeProfile')
            ->oldest('id')
            ->get();
    }

    /**
     * Trainees whose latest message is unanswered, most recent first.
     *
     * @return SupportCollection<int, stdClass> rows with client_id, name, body, created_at
     */
    public function awaitingReply(User $coach): SupportCollection
    {
        $latest = DB::table('fitnessos_messages')
            ->select(DB::raw('max(id) as id'))
            ->where('coach_id', $coach->id)
            ->groupBy('client_id');

        return DB::table('fitnessos_messages')
            ->joinSub($latest, 'latest', 'latest.id', '=', 'fitnessos_messages.id')
            ->join('users', 'users.id', '=', 'fitnessos_messages.client_id')
            ->where('users.coach_id', $coach->id)
            ->where('fitnessos_messages.sender_id', '<>', $coach->id)
            ->orderByDesc('fitnessos_messages.id')
            ->get(['fitnessos_messages.client_id', 'users.name', 'fitnessos_messages.body', 'fitnessos_messages.created_at']);
    }

    /**
     * Check-ins the coach has not reviewed yet, oldest first.
     *
     * @return SupportCollection<int, stdClass>
     */
    public function pendingCheckins(User $coach): SupportCollection
    {
        return DB::table('fitnessos_checkins')
            ->join('users', 'users.id', '=', 'fitnessos_checkins.client_id')
            ->where('fitnessos_checkins.coach_id', $coach->id)
            ->where('users.coach_id', $coach->id)
            ->where('fitnessos_checkins.status', 'Pending')
            ->orderBy('fitnessos_checkins.id')
            ->get(['fitnessos_checkins.*', 'users.name as client_name']);
    }

    /**
     * Trainees on an active plan who have not logged a session lately.
     *
     * @return Collection<int, User>
     */
    public function idleTrainees(User $coach, int $days = self::IDLE_DAYS): Collection
    {
        $cutoff = now()->subDays($days);

        return User::query()
            ->where('role', 'client')
            ->where('coach_id', $coach->id)
            ->whereExists(fn ($plan) => $plan->from('workout_plans')
                ->whereColumn('workout_plans.trainee_id', 'users.id')
                ->where('workout_plans.status', WorkoutPlan::ACTIVE)
                ->where('workout_plans.activated_at', '<=', $cutoff))
            ->whereNotExists(fn ($log) => $log->from('workout_logs')
                ->whereColumn('workout_logs.trainee_id', 'users.id')
                ->whereDate('workout_logs.performed_on', '>=', $cutoff->toDateString()))
            ->orderBy('name')
            ->get();
    }

    /**
     * AI drafts waiting for the coach's decision, newest first.
     *
     * @return Collection<int, AiDraft>
     */
    public function drafts(User $coach): Collection
    {
        return AiDraft::query()
            ->where('coach_id', $coach->id)
            ->where('status', AiDraft::PENDING)
            ->whereHas('trainee', fn ($trainee) => $trainee->where('coach_id', $coach->id))
            ->with('trainee')
            ->latest('id')
            ->get();
    }

    /**
     * The coach's current trainees by name.
     *
     * @return Collection<int, User>
     */
    public function trainees(User $coach): Collection
    {
        return User::query()->where('role', 'client')->where('coach_id', $coach->id)->orderBy('name')->get();
    }

    /**
     * Everything that needs the coach, in one place.
     *
     * @return array{
     *     requests: int,
     *     waiting: int,
     *     checkins: int,
     *     drafts: int,
     *     idle: Collection<int, User>,
     *     subscription_active: bool,
     *     subscription_days: int
     * }
     */
    public function summary(User $coach): array
    {
        $subscription = $this->subscriptions->for($coach);

        return [
            'requests' => $this->requests($coach)->count(),
            'waiting' => $this->awaitingReply($coach)->count(),
            'checkins' => $this->pendingCheckins($coach)->count(),
            'drafts' => $this->drafts($coach)->count(),
            'idle' => $this->idleTrainees($coach),
            'subscription_active' => $subscription->isActive(),
            'subscription_days' => $subscription->endsAt() === null ? 0 : max(0, (int) ceil(now()->diffInDays($subscription->endsAt(), false))),
        ];
    }
}
