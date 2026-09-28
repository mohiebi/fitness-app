<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A coach's training plan: a template when trainee_id is null, otherwise
 * a plan for one trainee (draft, active or archived).
 *
 * @property int $id
 * @property int $coach_id
 * @property int|null $trainee_id
 * @property string $title
 * @property string|null $notes
 * @property string $status
 * @property CarbonInterface|null $activated_at
 * @property CarbonInterface|null $archived_at
 * @property CarbonInterface|null $updated_at
 * @property-read User|null $trainee
 * @property-read Collection<int, PlanDay> $days
 */
class WorkoutPlan extends Model
{
    public const DRAFT = 'draft';

    public const ACTIVE = 'active';

    public const ARCHIVED = 'archived';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'activated_at' => 'datetime',
            'archived_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function trainee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'trainee_id');
    }

    /** @return HasMany<PlanDay, $this> */
    public function days(): HasMany
    {
        return $this->hasMany(PlanDay::class)->orderBy('position');
    }

    public function isTemplate(): bool
    {
        return $this->trainee_id === null;
    }

    /** @return array<string, mixed> */
    public function toSummaryArray(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'status' => $this->status,
            'template' => $this->isTemplate(),
            'trainee' => $this->trainee ? ['id' => $this->trainee->id, 'name' => $this->trainee->name] : null,
            'days_count' => $this->relationLoaded('days') ? $this->days->count() : $this->days()->count(),
            'activated_at' => $this->activated_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }

    /** @return array<string, mixed> */
    public function toDetailArray(): array
    {
        $this->loadMissing('days.exercises.exercise', 'trainee');

        return [
            ...$this->toSummaryArray(),
            'notes' => $this->notes,
            'days' => $this->days->map(fn (PlanDay $day) => [
                'id' => $day->id,
                'title' => $day->title,
                'notes' => $day->notes,
                'exercises' => $day->exercises->map(fn (PlanExercise $item) => [
                    'id' => $item->id,
                    'exercise' => $item->exercise->toSummaryArray(),
                    'sets' => $item->sets,
                    'reps' => $item->reps,
                    'rest_seconds' => $item->rest_seconds,
                    'target_weight_kg' => $item->target_weight_kg !== null ? (float) $item->target_weight_kg : null,
                    'notes' => $item->notes,
                ])->values(),
            ])->values(),
        ];
    }
}
