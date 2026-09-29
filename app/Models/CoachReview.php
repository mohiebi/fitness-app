<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $coach_id
 * @property int $trainee_id
 * @property int $coaching_id
 * @property int $rating
 * @property string|null $comment
 * @property string|null $coach_reply
 * @property CarbonInterface|null $replied_at
 * @property CarbonInterface|null $hidden_at
 * @property CarbonInterface|null $created_at
 * @property CarbonInterface|null $updated_at
 * @property-read User $trainee
 */
class CoachReview extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'rating' => 'integer',
            'replied_at' => 'datetime',
            'hidden_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function trainee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'trainee_id');
    }

    /** @param Builder<CoachReview> $query */
    public function scopeVisible(Builder $query): void
    {
        $query->whereNull('hidden_at');
    }

    /**
     * Public view: the reviewer's first name only.
     *
     * @return array<string, mixed>
     */
    public function toPublicArray(): array
    {
        return [
            'id' => $this->id,
            'rating' => $this->rating,
            'comment' => $this->comment,
            'reviewer' => strtok($this->trainee->name, ' ') ?: '',
            'coach_reply' => $this->coach_reply,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
