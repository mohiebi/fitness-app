<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property int $workout_log_id
 * @property int|null $exercise_id
 * @property string $exercise_name
 * @property int $set_number
 * @property int|null $reps
 * @property string|null $weight_kg
 * @property bool $completed
 */
class WorkoutLogSet extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'completed' => 'boolean',
        ];
    }
}
