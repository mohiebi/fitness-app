<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One trainee-coach relationship, from request to end.
 *
 * @property int $id
 * @property int $coach_id
 * @property int $trainee_id
 * @property string $status
 * @property string|null $request_message
 * @property CarbonInterface|null $started_at
 * @property CarbonInterface|null $ended_at
 * @property int|null $ended_by
 * @property string|null $end_reason
 * @property CarbonInterface|null $created_at
 * @property-read User $coach
 * @property-read User $trainee
 */
class Coaching extends Model
{
    public const REQUESTED = 'requested';

    public const ACTIVE = 'active';

    public const DECLINED = 'declined';

    public const WITHDRAWN = 'withdrawn';

    public const ENDED = 'ended';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function coach(): BelongsTo
    {
        return $this->belongsTo(User::class, 'coach_id');
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
            'status' => $this->status,
            'request_message' => $this->request_message,
            'requested_at' => $this->created_at?->toIso8601String(),
            'started_at' => $this->started_at?->toIso8601String(),
            'ended_at' => $this->ended_at?->toIso8601String(),
            'end_reason' => $this->end_reason,
        ];
    }
}
