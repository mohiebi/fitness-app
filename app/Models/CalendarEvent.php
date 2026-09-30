<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * An appointment in a coach's calendar.
 *
 * @property int $id
 * @property int $coach_id
 * @property int|null $trainee_id
 * @property string $title
 * @property string $kind
 * @property CarbonInterface $starts_at
 * @property int|null $duration_minutes
 * @property string|null $notes
 * @property-read User|null $trainee
 */
class CalendarEvent extends Model
{
    public const CALL = 'call';

    public const VIDEO = 'video';

    public const IN_PERSON = 'in_person';

    public const OTHER = 'other';

    public const KINDS = [self::CALL, self::VIDEO, self::IN_PERSON, self::OTHER];

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function trainee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'trainee_id');
    }

    /** @return array<string, mixed> */
    public function toSummaryArray(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'kind' => $this->kind,
            'starts_at' => $this->starts_at->toIso8601String(),
            'duration_minutes' => $this->duration_minutes,
            'notes' => $this->notes,
            'trainee' => $this->trainee ? ['id' => $this->trainee->id, 'name' => $this->trainee->name] : null,
        ];
    }
}
