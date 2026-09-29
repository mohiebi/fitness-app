<?php

namespace App\Services;

use App\Models\CoachSubscription;
use App\Models\User;
use InvalidArgumentException;

/**
 * Coach subscriptions: a free trial, then prepaid periods. Paying extends
 * the subscription from its current end (or from now if it has lapsed).
 */
class CoachSubscriptions
{
    public function for(User $coach): CoachSubscription
    {
        return CoachSubscription::query()->firstOrCreate(['coach_id' => $coach->id], [
            'plan' => config('fitnessos.trial_plan'),
            'trial_ends_at' => now()->addDays((int) config('fitnessos.trial_days')),
        ]);
    }

    public function isActive(User $coach): bool
    {
        return $this->for($coach)->isActive();
    }

    /**
     * How many active trainees the coach's plan allows (null = no limit).
     * A lapsed subscription allows no new trainees.
     */
    public function traineeLimit(User $coach): ?int
    {
        $subscription = $this->for($coach);

        return $subscription->isActive() ? $subscription->maxTrainees() : 0;
    }

    /**
     * Record a paid period for a plan.
     */
    public function extend(User $coach, string $plan, ?int $days = null): CoachSubscription
    {
        $this->ensurePlan($plan);
        $subscription = $this->for($coach);
        $days ??= (int) config('fitnessos.period_days');

        // Paid time continues from the end of the current paid period; a
        // trial or lapsed subscription starts from now.
        $from = $subscription->paid_until !== null && $subscription->paid_until->isFuture()
            ? $subscription->paid_until
            : now();

        $subscription->fill([
            'plan' => $plan,
            'paid_until' => $from->copy()->addDays($days),
            'reminded_at' => null,
        ])->save();

        return $subscription;
    }

    /** @return array<string, array{name: string, price: int, max_trainees: int|null}> */
    public function plans(): array
    {
        /** @var array<string, array{name: string, price: int, max_trainees: int|null}> $plans */
        $plans = config('fitnessos.plans');

        return $plans;
    }

    public function ensurePlan(string $plan): void
    {
        if (! array_key_exists($plan, $this->plans())) {
            throw new InvalidArgumentException("Unknown plan {$plan}");
        }
    }
}
