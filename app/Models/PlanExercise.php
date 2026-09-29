<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $plan_day_id
 * @property int $exercise_id
 * @property int $position
 * @property int $sets
 * @property string $reps
 * @property int|null $rest_seconds
 * @property string|null $target_weight_kg
 * @property string|null $notes
 * @property-read Exercise $exercise
 */
class PlanExercise extends Model
{
    protected $guarded = [];

    /** @return BelongsTo<Exercise, $this> */
    public function exercise(): BelongsTo
    {
        return $this->belongsTo(Exercise::class);
    }
}
