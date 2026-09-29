<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $coach_id
 * @property string $plan
 * @property int $amount
 * @property int $period_days
 * @property string $status
 * @property string $method
 * @property string $reference
 * @property string|null $telegram_chat_id
 * @property string|null $receipt_file_id
 * @property string|null $reviewed_by
 * @property CarbonInterface|null $paid_at
 * @property CarbonInterface|null $rejected_at
 * @property CarbonInterface|null $created_at
 * @property-read User $coach
 */
class SubscriptionPayment extends Model
{
    public const PENDING = 'pending';

    public const SUBMITTED = 'submitted';

    public const PAID = 'paid';

    public const REJECTED = 'rejected';

    public const CANCELED = 'canceled';

    public const TELEGRAM = 'telegram';

    public const MANUAL = 'manual';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'period_days' => 'integer',
            'paid_at' => 'datetime',
            'rejected_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function coach(): BelongsTo
    {
        return $this->belongsTo(User::class, 'coach_id');
    }

    public function isOpen(): bool
    {
        return in_array($this->status, [self::PENDING, self::SUBMITTED], true);
    }

    /** @return array<string, mixed> */
    public function toSummaryArray(): array
    {
        return [
            'id' => $this->id,
            'plan' => $this->plan,
            'amount' => $this->amount,
            'period_days' => $this->period_days,
            'status' => $this->status,
            'method' => $this->method,
            'reference' => $this->reference,
            'created_at' => $this->created_at?->toIso8601String(),
            'paid_at' => $this->paid_at?->toIso8601String(),
        ];
    }
}
