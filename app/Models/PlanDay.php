<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $workout_plan_id
 * @property int $position
 * @property string $title
 * @property string|null $notes
 * @property-read WorkoutPlan $plan
 * @property-read Collection<int, PlanExercise> $exercises
 */
class PlanDay extends Model
{
    protected $guarded = [];

    /** @return BelongsTo<WorkoutPlan, $this> */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(WorkoutPlan::class, 'workout_plan_id');
    }

    /** @return HasMany<PlanExercise, $this> */
    public function exercises(): HasMany
    {
        return $this->hasMany(PlanExercise::class)->orderBy('position');
    }
}
