<?php

namespace App\Services\Payments;

use App\Models\SubscriptionPayment;
use App\Models\User;
use App\Services\CoachSubscriptions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Coach payments for subscription periods. Amounts always come from the
 * plan config at the time the payment starts, never from the client.
 */
class SubscriptionPayments
{
    public function __construct(private CoachSubscriptions $subscriptions) {}

    /**
     * Start (or reuse) an open Telegram payment for a plan.
     */
    public function start(User $coach, string $plan): SubscriptionPayment
    {
        $this->subscriptions->ensurePlan($plan);
        $price = $this->subscriptions->plans()[$plan]['price'];

        $open = SubscriptionPayment::query()
            ->where('coach_id', $coach->id)
            ->where('plan', $plan)
            ->where('amount', $price)
            ->where('status', SubscriptionPayment::PENDING)
            ->latest('id')
            ->first();

        return $open ?? SubscriptionPayment::create([
            'coach_id' => $coach->id,
            'plan' => $plan,
            'amount' => $price,
            'period_days' => (int) config('fitnessos.period_days'),
            'status' => SubscriptionPayment::PENDING,
            'method' => SubscriptionPayment::TELEGRAM,
            'reference' => $this->newReference(),
        ]);
    }

    /**
     * Record a payment made outside the bot and activate it right away.
     */
    public function recordManual(User $coach, string $plan, ?int $days = null, string $reviewer = 'cli'): SubscriptionPayment
    {
        $this->subscriptions->ensurePlan($plan);
        $payment = SubscriptionPayment::create([
            'coach_id' => $coach->id,
            'plan' => $plan,
            'amount' => $this->subscriptions->plans()[$plan]['price'],
            'period_days' => $days ?? (int) config('fitnessos.period_days'),
            'status' => SubscriptionPayment::SUBMITTED,
            'method' => SubscriptionPayment::MANUAL,
            'reference' => $this->newReference(),
        ]);
        $this->approve($payment, $reviewer);

        return $payment->refresh();
    }

    public function attachReceipt(SubscriptionPayment $payment, string $chatId, string $fileId): void
    {
        $payment->fill([
            'telegram_chat_id' => $chatId,
            'receipt_file_id' => $fileId,
            'status' => SubscriptionPayment::SUBMITTED,
        ])->save();
    }

    /**
     * Mark the payment paid and extend the subscription. Returns false if
     * the payment was already handled, so a double tap can't pay twice.
     */
    public function approve(SubscriptionPayment $payment, string $reviewer): bool
    {
        return DB::transaction(function () use ($payment, $reviewer): bool {
            $locked = SubscriptionPayment::query()->whereKey($payment->id)->lockForUpdate()->firstOrFail();
            if (! $locked->isOpen()) {
                return false;
            }

            $locked->fill(['status' => SubscriptionPayment::PAID, 'paid_at' => now(), 'reviewed_by' => $reviewer])->save();
            $this->subscriptions->extend($locked->coach, $locked->plan, $locked->period_days);
            $payment->refresh();

            return true;
        });
    }

    public function reject(SubscriptionPayment $payment, string $reviewer): bool
    {
        return DB::transaction(function () use ($payment, $reviewer): bool {
            $locked = SubscriptionPayment::query()->whereKey($payment->id)->lockForUpdate()->firstOrFail();
            if (! $locked->isOpen()) {
                return false;
            }

            $locked->fill(['status' => SubscriptionPayment::REJECTED, 'rejected_at' => now(), 'reviewed_by' => $reviewer])->save();
            $payment->refresh();

            return true;
        });
    }

    public function cancel(SubscriptionPayment $payment): void
    {
        if ($payment->status === SubscriptionPayment::PENDING) {
            $payment->update(['status' => SubscriptionPayment::CANCELED]);
        }
    }

    /**
     * Deep link that opens the bot with this payment's reference.
     */
    public function telegramLink(SubscriptionPayment $payment): ?string
    {
        $username = config('fitnessos.telegram.bot_username');

        return is_string($username) && $username !== ''
            ? 'https://t.me/'.ltrim($username, '@').'?start=pay_'.$payment->reference
            : null;
    }

    private function newReference(): string
    {
        do {
            $reference = 'FOS'.Str::upper(Str::random(8));
        } while (SubscriptionPayment::query()->where('reference', $reference)->exists());

        return $reference;
    }
}
