<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $coach_id
 * @property string $plan
 * @property CarbonInterface|null $trial_ends_at
 * @property CarbonInterface|null $paid_until
 * @property CarbonInterface|null $reminded_at
 */
class CoachSubscription extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'trial_ends_at' => 'datetime',
            'paid_until' => 'datetime',
            'reminded_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function coach(): BelongsTo
    {
        return $this->belongsTo(User::class, 'coach_id');
    }

    public function onTrial(): bool
    {
        return $this->paid_until === null;
    }

    public function endsAt(): ?CarbonInterface
    {
        return $this->paid_until ?? $this->trial_ends_at;
    }

    public function isActive(): bool
    {
        return $this->endsAt()?->isFuture() ?? false;
    }

    /**
     * Subscriptions that are currently running.
     *
     * @param  Builder<CoachSubscription>  $query
     */
    public function scopeRunning(Builder $query): void
    {
        $query->where(fn (Builder $query) => $query
            ->where('paid_until', '>', now())
            ->orWhere(fn (Builder $query) => $query->whereNull('paid_until')->where('trial_ends_at', '>', now())));
    }

    public function maxTrainees(): ?int
    {
        $max = config("fitnessos.plans.{$this->plan}.max_trainees");

        return is_int($max) ? $max : null;
    }

    /** @return array<string, mixed> */
    public function toSummaryArray(): array
    {
        return [
            'plan' => $this->plan,
            'on_trial' => $this->onTrial(),
            'active' => $this->isActive(),
            'ends_at' => $this->endsAt()?->toIso8601String(),
            'max_trainees' => $this->maxTrainees(),
        ];
    }
}
