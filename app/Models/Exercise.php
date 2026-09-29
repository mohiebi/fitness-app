<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property int|null $coach_id
 * @property string $name
 * @property string|null $name_en
 * @property string $muscle_group
 * @property string $equipment
 * @property string|null $video_url
 * @property string|null $instructions
 */
#[Fillable(['name', 'name_en', 'muscle_group', 'equipment', 'video_url', 'instructions'])]
class Exercise extends Model
{
    public const MUSCLE_GROUPS = ['chest', 'back', 'shoulders', 'arms', 'legs', 'glutes', 'core', 'full-body', 'cardio'];

    public const EQUIPMENT = ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'kettlebell', 'band', 'other'];

    /**
     * The shared library plus this coach's own exercises.
     *
     * @param  Builder<Exercise>  $query
     */
    public function scopeVisibleTo(Builder $query, User $coach): void
    {
        $query->where(fn (Builder $query) => $query->whereNull('coach_id')->orWhere('coach_id', $coach->id));
    }

    /** @return array<string, mixed> */
    public function toSummaryArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'name_en' => $this->name_en,
            'muscle_group' => $this->muscle_group,
            'equipment' => $this->equipment,
            'video_url' => $this->video_url,
            'instructions' => $this->instructions,
            'custom' => $this->coach_id !== null,
        ];
    }
}
