<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Something the AI assistant wrote for a coach. It never reaches the
 * trainee on its own: only CoachAssistant::approve() acts on it.
 *
 * @property int $id
 * @property int $coach_id
 * @property int $trainee_id
 * @property string $kind
 * @property string $status
 * @property int|null $source_id
 * @property string|null $instruction
 * @property string|null $content
 * @property array<string, mixed>|null $plan
 * @property string|null $error
 * @property string|null $model
 * @property int|null $input_tokens
 * @property int|null $output_tokens
 * @property int|null $result_id
 * @property CarbonInterface|null $approved_at
 * @property CarbonInterface|null $discarded_at
 * @property CarbonInterface|null $created_at
 * @property-read User $trainee
 */
class AiDraft extends Model
{
    public const REPLY = 'reply';

    public const CHECKIN_FEEDBACK = 'checkin_feedback';

    public const PLAN = 'plan';

    public const KINDS = [self::REPLY, self::CHECKIN_FEEDBACK, self::PLAN];

    public const PENDING = 'pending';

    public const APPROVED = 'approved';

    public const DISCARDED = 'discarded';

    public const FAILED = 'failed';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'plan' => 'array',
            'approved_at' => 'datetime',
            'discarded_at' => 'datetime',
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
            'kind' => $this->kind,
            'status' => $this->status,
            'trainee' => ['id' => $this->trainee->id, 'name' => $this->trainee->name],
            'source_id' => $this->source_id,
            'instruction' => $this->instruction,
            'content' => $this->content,
            'plan' => $this->plan,
            'error' => $this->error,
            'result_id' => $this->result_id,
            'created_at' => $this->created_at?->toIso8601String(),
            'approved_at' => $this->approved_at?->toIso8601String(),
        ];
    }
}
