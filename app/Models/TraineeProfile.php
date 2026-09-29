<?php

namespace App\Models;

use App\Support\Trans;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $user_id
 * @property int|null $birth_year
 * @property int|null $height_cm
 * @property string|null $weight_kg
 * @property string|null $goal
 * @property string|null $experience
 * @property string|null $limitations
 * @property CarbonInterface|null $health_consent_at
 */
#[Fillable(['birth_year', 'height_cm', 'weight_kg', 'goal', 'experience', 'limitations'])]
class TraineeProfile extends Model
{
    protected function casts(): array
    {
        return [
            'health_consent_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    private const GOALS = [
        'fat-loss' => 'Lose fat',
        'muscle-gain' => 'Build muscle',
        'strength' => 'Get stronger',
        'health' => 'General health',
        'performance' => 'Sports performance',
        'rehab' => 'Recover from injury',
    ];

    private const EXPERIENCE = [
        'beginner' => 'Beginner',
        'intermediate' => 'Intermediate',
        'advanced' => 'Advanced',
    ];

    /** The goal in words, in the app language. */
    public function goalLabel(): ?string
    {
        return $this->goal === null ? null : Trans::text(self::GOALS[$this->goal] ?? $this->goal);
    }

    public function experienceLabel(): ?string
    {
        return $this->experience === null ? null : Trans::text(self::EXPERIENCE[$this->experience] ?? $this->experience);
    }

    /** @return array<string, mixed> */
    public function toSummaryArray(): array
    {
        return [
            'birth_year' => $this->birth_year,
            'height_cm' => $this->height_cm,
            'weight_kg' => $this->weight_kg !== null ? (float) $this->weight_kg : null,
            'goal' => $this->goal,
            'experience' => $this->experience,
            'limitations' => $this->limitations,
            'health_consent' => $this->health_consent_at !== null,
        ];
    }
}
