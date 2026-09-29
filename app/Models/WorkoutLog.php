<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * One training session a trainee logged.
 *
 * @property int $id
 * @property int $trainee_id
 * @property int|null $workout_plan_id
 * @property int|null $plan_day_id
 * @property string $title
 * @property CarbonInterface $performed_on
 * @property int|null $duration_minutes
 * @property int|null $effort
 * @property string|null $notes
 * @property-read Collection<int, WorkoutLogSet> $sets
 */
class WorkoutLog extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'performed_on' => 'date',
        ];
    }

    /** @return HasMany<WorkoutLogSet, $this> */
    public function sets(): HasMany
    {
        return $this->hasMany(WorkoutLogSet::class)->orderBy('id');
    }

    /** @return array<string, mixed> */
    public function toSummaryArray(): array
    {
        $this->loadMissing('sets');

        return [
            'id' => $this->id,
            'plan_day_id' => $this->plan_day_id,
            'title' => $this->title,
            'performed_on' => $this->performed_on->toDateString(),
            'duration_minutes' => $this->duration_minutes,
            'effort' => $this->effort,
            'notes' => $this->notes,
            'sets' => $this->sets->map(fn (WorkoutLogSet $set) => [
                'exercise_id' => $set->exercise_id,
                'exercise_name' => $set->exercise_name,
                'set_number' => $set->set_number,
                'reps' => $set->reps,
                'weight_kg' => $set->weight_kg !== null ? (float) $set->weight_kg : null,
                'completed' => $set->completed,
            ])->values(),
        ];
    }
}
