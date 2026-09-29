<?php

namespace App\Services;

use App\Models\Coaching;
use App\Models\CoachProfile;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * The only place that moves coachings between states and keeps the
 * users.coach_id pointer (the trainee's current coach) in sync.
 *
 * A trainee has at most one active and one requested coaching at a time.
 */
class CoachingLifecycle
{
    public const REASON_SWITCHED = 'switched';

    public function __construct(
        private CoachSubscriptions $subscriptions,
        private Notifier $notifier,
    ) {}

    public function request(User $trainee, CoachProfile $profile, ?string $message = null): Coaching
    {
        abort_unless($trainee->isTrainee(), 403);

        $coaching = DB::transaction(function () use ($trainee, $profile, $message): Coaching {
            $trainee = $this->lockTrainee($trainee);

            if (! $profile->is_published || ! $profile->hasCapacity()) {
                $this->fail(__('This coach is not accepting new trainees right now.'));
            }

            if ($trainee->coach_id === $profile->user_id) {
                $this->fail(__('This is already your coach.'));
            }

            if ($this->pendingFor($trainee)) {
                $this->fail(__('You already have a pending request. Withdraw it before requesting another coach.'));
            }

            return Coaching::create([
                'coach_id' => $profile->user_id,
                'trainee_id' => $trainee->id,
                'status' => Coaching::REQUESTED,
                'request_message' => $message,
            ]);
        });
        $this->notifier->coachingRequested($coaching);

        return $coaching;
    }

    public function accept(Coaching $coaching, User $coach): Coaching
    {
        $this->ensureCoachOwns($coaching, $coach);

        DB::transaction(function () use ($coaching, $coach): void {
            $trainee = $this->lockTrainee($coaching->trainee);
            $coaching->refresh();

            if ($coaching->status !== Coaching::REQUESTED) {
                $this->fail(__('This request is no longer pending.'));
            }

            if (! $this->subscriptions->isActive($coach)) {
                $this->fail(__('Your subscription has ended. Renew it to accept new trainees.'));
            }

            $profile = $coach->coachProfile;
            $limit = $profile?->traineeLimit();
            if ($profile !== null && $limit !== null && $profile->activeClientCount() >= $limit) {
                $this->fail(__('You have reached your maximum number of trainees.'));
            }

            $current = $this->activeFor($trainee);
            if ($current) {
                $this->close($current, Coaching::ENDED, $trainee->id, self::REASON_SWITCHED);
            }

            $coaching->update(['status' => Coaching::ACTIVE, 'started_at' => now()]);
            $trainee->forceFill(['coach_id' => $coach->id])->save();
        });
        $this->notifier->coachingAccepted($coaching);

        return $coaching;
    }

    public function decline(Coaching $coaching, User $coach): Coaching
    {
        $this->ensureCoachOwns($coaching, $coach);

        $this->closePending($coaching, Coaching::DECLINED, $coach->id);
        $this->notifier->coachingDeclined($coaching);

        return $coaching;
    }

    public function withdraw(Coaching $coaching, User $trainee): Coaching
    {
        abort_unless($coaching->trainee_id === $trainee->id, 404);

        return $this->closePending($coaching, Coaching::WITHDRAWN, $trainee->id);
    }

    public function end(Coaching $coaching, User $by, ?string $reason = null): Coaching
    {
        abort_unless($by->id === $coaching->coach_id || $by->id === $coaching->trainee_id, 404);

        DB::transaction(function () use ($coaching, $by, $reason): void {
            $trainee = $this->lockTrainee($coaching->trainee);
            $coaching->refresh();

            if ($coaching->status !== Coaching::ACTIVE) {
                $this->fail(__('This coaching is not active.'));
            }

            $this->close($coaching, Coaching::ENDED, $by->id, $reason);

            if ($trainee->coach_id === $coaching->coach_id) {
                $trainee->forceFill(['coach_id' => null])->save();
            }
        });
        $this->notifier->coachingEnded($coaching, $by);

        return $coaching;
    }

    /**
     * Link a trainee the coach created from the dashboard.
     */
    public function startDirect(User $coach, User $trainee): Coaching
    {
        return DB::transaction(function () use ($coach, $trainee): Coaching {
            $trainee->forceFill(['coach_id' => $coach->id])->save();

            return Coaching::create([
                'coach_id' => $coach->id,
                'trainee_id' => $trainee->id,
                'status' => Coaching::ACTIVE,
                'started_at' => now(),
            ]);
        });
    }

    public function activeFor(User $trainee): ?Coaching
    {
        return $trainee->coachingsAsTrainee()->where('status', Coaching::ACTIVE)->latest('id')->first();
    }

    public function pendingFor(User $trainee): ?Coaching
    {
        return $trainee->coachingsAsTrainee()->where('status', Coaching::REQUESTED)->latest('id')->first();
    }

    private function closePending(Coaching $coaching, string $status, int $byId): Coaching
    {
        return DB::transaction(function () use ($coaching, $status, $byId): Coaching {
            $this->lockTrainee($coaching->trainee);
            $coaching->refresh();

            if ($coaching->status !== Coaching::REQUESTED) {
                $this->fail(__('This request is no longer pending.'));
            }

            $this->close($coaching, $status, $byId);

            return $coaching;
        });
    }

    private function close(Coaching $coaching, string $status, int $byId, ?string $reason = null): void
    {
        $coaching->update([
            'status' => $status,
            'ended_at' => now(),
            'ended_by' => $byId,
            'end_reason' => $reason,
        ]);
    }

    private function ensureCoachOwns(Coaching $coaching, User $coach): void
    {
        abort_unless($coach->isCoach() && $coaching->coach_id === $coach->id, 404);
    }

    private function lockTrainee(User $trainee): User
    {
        return User::query()->whereKey($trainee->id)->lockForUpdate()->firstOrFail();
    }

    private function fail(string $message): never
    {
        throw ValidationException::withMessages(['coaching' => $message]);
    }
}
