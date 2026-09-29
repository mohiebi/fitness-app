<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A coach's connection to the Telegram bot.
 *
 * @property int $id
 * @property int $user_id
 * @property string|null $chat_id
 * @property string|null $username
 * @property string|null $link_token_hash
 * @property CarbonInterface|null $link_expires_at
 * @property CarbonInterface|null $linked_at
 * @property array<string, mixed>|null $state
 * @property array<string, mixed>|null $preferences
 * @property CarbonInterface|null $last_digest_on
 * @property-read User $user
 */
class TelegramAccount extends Model
{
    /** What a coach can switch on or off. */
    public const GROUPS = ['messages', 'requests', 'checkins', 'billing', 'reviews', 'digest'];

    public const DEFAULT_DIGEST_HOUR = 8;

    /** A pending reply is forgotten after this many minutes. */
    private const STATE_MINUTES = 30;

    /** Which preference group each notice kind belongs to. */
    private const KIND_GROUPS = [
        'message' => 'messages',
        'coaching_requested' => 'requests',
        'coaching_ended' => 'requests',
        'checkin_submitted' => 'checkins',
        'payment_confirmed' => 'billing',
        'payment_rejected' => 'billing',
        'subscription_ending' => 'billing',
        'review_received' => 'reviews',
    ];

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'link_expires_at' => 'datetime',
            'linked_at' => 'datetime',
            'last_digest_on' => 'date',
            'state' => 'array',
            'preferences' => 'array',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isLinked(): bool
    {
        return $this->chat_id !== null;
    }

    public function wants(string $group): bool
    {
        return (bool) ($this->preferences[$group] ?? true);
    }

    public function wantsKind(string $kind): bool
    {
        $group = self::KIND_GROUPS[$kind] ?? null;

        return $group === null || $this->wants($group);
    }

    public function digestHour(): int
    {
        return (int) ($this->preferences['digest_hour'] ?? self::DEFAULT_DIGEST_HOUR);
    }

    /**
     * Remember what the next plain message from the coach means.
     */
    public function expect(string $type, int $id): void
    {
        $this->forceFill(['state' => ['type' => $type, 'id' => $id, 'until' => now()->addMinutes(self::STATE_MINUTES)->timestamp]])->save();
    }

    /**
     * @return array{type: string, id: int}|null
     */
    public function expected(): ?array
    {
        $state = $this->state;
        if (! is_array($state) || ! isset($state['type'], $state['id'], $state['until'])) {
            return null;
        }

        if ((int) $state['until'] < now()->timestamp) {
            $this->clearExpectation();

            return null;
        }

        return ['type' => (string) $state['type'], 'id' => (int) $state['id']];
    }

    public function clearExpectation(): void
    {
        if ($this->state !== null) {
            $this->forceFill(['state' => null])->save();
        }
    }

    /** @return array<string, mixed> */
    public function toSummaryArray(): array
    {
        return [
            'linked' => $this->isLinked(),
            'username' => $this->username,
            'linked_at' => $this->linked_at?->toIso8601String(),
            'preferences' => [
                ...array_combine(self::GROUPS, array_map(fn (string $group) => $this->wants($group), self::GROUPS)),
                'digest_hour' => $this->digestHour(),
            ],
        ];
    }
}
