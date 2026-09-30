<?php

namespace App\Services\Telegram;

use App\Models\SubscriptionPayment;
use App\Services\CoachSubscriptions;
use App\Services\Payments\SubscriptionPayments;
use App\Support\LocalFormat;
use App\Support\Trans;

/**
 * The Telegram side of subscription payments:
 *
 * 1. A coach opens the bot from the billing page (/start pay_<reference>)
 *    and gets the amount and card details.
 * 2. They send a photo of the transfer receipt; it is forwarded to the
 *    admin chat with Approve / Reject buttons.
 * 3. An admin taps a button; approving extends the subscription.
 *
 * Only the admin chat can approve. Everything the bot says to coaches goes
 * through __() so it follows the app language. TelegramBot routes updates
 * here; this class never looks at the raw update itself.
 */
class PaymentBot
{
    public function __construct(
        private TelegramClient $telegram,
        private SubscriptionPayments $payments,
        private CoachSubscriptions $subscriptions,
    ) {}

    /**
     * /start pay_<reference>: the coach opened the bot from Billing.
     */
    public function start(string $chatId, string $payload): void
    {
        $payment = str_starts_with($payload, 'pay_')
            ? SubscriptionPayment::query()->where('reference', substr($payload, 4))->first()
            : null;

        if ($payment === null || ! $payment->isOpen()) {
            $this->telegram->sendMessage($chatId, __('To pay for FitnessOS, open Billing in your coach dashboard and tap Pay with Telegram. Then send the transfer receipt here.'));

            return;
        }

        $this->instructions($payment, $chatId);
    }

    /**
     * Tell the coach how much to pay and where, and remember the chat so
     * the receipt they send next lands on this payment.
     */
    public function instructions(SubscriptionPayment $payment, string $chatId): void
    {
        $payment->update(['telegram_chat_id' => $chatId]);
        $plan = $this->subscriptions->plans()[$payment->plan];

        $this->telegram->sendMessage($chatId, implode('
', [
            __('FitnessOS subscription: :plan plan, :days days', ['plan' => __($plan['name']), 'days' => LocalFormat::number($payment->period_days)]),
            __('Amount: :amount toman', ['amount' => LocalFormat::number($payment->amount)]),
            '',
            __('Please transfer the amount to this card:'),
            '<code>'.e((string) config('fitnessos.payment_card.number')).'</code>',
            e((string) config('fitnessos.payment_card.holder')),
            '',
            __('Then send a photo of the receipt in this chat. We will confirm it shortly.'),
            __('Reference: :reference', ['reference' => '<code>'.$payment->reference.'</code>']),
        ]));
    }

    /**
     * Handle a photo, or an image/PDF file, as a transfer receipt.
     *
     * @param  array<string, mixed>  $message
     * @return bool whether the message was a receipt
     */
    public function receipt(string $chatId, array $message): bool
    {
        $receipt = $this->receiptFile($message);
        if ($receipt === null) {
            return false;
        }

        $this->handleReceipt($chatId, $receipt);

        return true;
    }

    /**
     * @param  array{type: 'photo'|'document', file_id: string}  $receipt
     */
    private function handleReceipt(string $chatId, array $receipt): void
    {
        $payment = SubscriptionPayment::query()
            ->where('telegram_chat_id', $chatId)
            ->where('status', SubscriptionPayment::PENDING)
            ->latest('id')
            ->first();

        if ($payment === null) {
            $this->telegram->sendMessage($chatId, __('There is no open payment for this chat. Start from Billing in your coach dashboard.'));

            return;
        }

        $this->payments->attachReceipt($payment, $chatId, $receipt['type'].':'.$receipt['file_id']);
        $coach = $payment->coach;

        $forward = $receipt['type'] === 'photo' ? $this->telegram->sendPhoto(...) : $this->telegram->sendDocument(...);
        $forward($this->adminChatId(), $receipt['file_id'], implode("\n", [
            '💳 '.e($coach->name).' ('.e($coach->email).')',
            __('Plan: :plan for :days days', ['plan' => $this->planName($payment), 'days' => LocalFormat::number($payment->period_days)]),
            __('Amount: :amount toman', ['amount' => LocalFormat::number($payment->amount)]),
            __('Reference: :reference', ['reference' => '<code>'.$payment->reference.'</code>']),
        ]), [[
            ['text' => __('✅ Approve'), 'callback_data' => 'pay:approve:'.$payment->id],
            ['text' => __('❌ Reject'), 'callback_data' => 'pay:reject:'.$payment->id],
        ]]);

        $this->telegram->sendMessage($chatId, __('Receipt received. We will check it and confirm here shortly.'));
    }

    /**
     * @param  array<string, mixed>  $callback
     */
    public function callback(array $callback): void
    {
        $callbackId = (string) ($callback['id'] ?? '');
        $chatId = (string) ($callback['message']['chat']['id'] ?? '');

        if ($chatId === '' || $chatId !== $this->adminChatId()) {
            $this->telegram->answerCallback($callbackId, __('You are not allowed to do this.'));

            return;
        }

        if (! preg_match('/^pay:(approve|reject):(\d+)$/', (string) ($callback['data'] ?? ''), $match)) {
            $this->telegram->answerCallback($callbackId, __('Unknown action.'));

            return;
        }

        $payment = SubscriptionPayment::query()->find((int) $match[2]);
        if ($payment === null) {
            $this->telegram->answerCallback($callbackId, __('That payment was not found.'));

            return;
        }

        $reviewer = 'telegram:'.($callback['from']['username'] ?? $callback['from']['id'] ?? 'admin');
        $approve = $match[1] === 'approve';
        $changed = $approve ? $this->payments->approve($payment, $reviewer) : $this->payments->reject($payment, $reviewer);

        if (! $changed) {
            $this->telegram->answerCallback($callbackId, __('This payment is already :status.', ['status' => $this->statusLabel($payment->status)]));

            return;
        }

        $this->telegram->answerCallback($callbackId, $approve ? __('Payment approved.') : __('Payment rejected.'));
        if (isset($callback['message']['message_id'])) {
            $this->telegram->editCaption($chatId, (int) $callback['message']['message_id'], implode("\n", [
                ($approve ? __('✅ Approved by :who', ['who' => e($reviewer)]) : __('❌ Rejected by :who', ['who' => e($reviewer)])),
                __(':name / :plan / :amount toman', ['name' => e($payment->coach->name), 'plan' => $this->planName($payment), 'amount' => LocalFormat::number($payment->amount)]),
                __('Reference: :reference', ['reference' => '<code>'.$payment->reference.'</code>']),
            ]));
        }

        if ($payment->telegram_chat_id !== null) {
            $this->telegram->sendMessage($payment->telegram_chat_id, $approve
                ? __('Payment confirmed. Your subscription is active until :date.', ['date' => LocalFormat::date($this->subscriptions->for($payment->coach)->endsAt())])
                : __('We could not confirm this payment. Please check the receipt and contact support.'));
        }
    }

    /**
     * A receipt photo, or an image/PDF sent as a file.
     *
     * @param  array<string, mixed>  $message
     * @return array{type: 'photo'|'document', file_id: string}|null
     */
    private function receiptFile(array $message): ?array
    {
        if (isset($message['photo']) && is_array($message['photo']) && $message['photo'] !== []) {
            $largest = end($message['photo']);

            return is_array($largest) && isset($largest['file_id']) ? ['type' => 'photo', 'file_id' => (string) $largest['file_id']] : null;
        }

        $mime = (string) ($message['document']['mime_type'] ?? '');
        if (isset($message['document']['file_id']) && (str_starts_with($mime, 'image/') || $mime === 'application/pdf')) {
            return ['type' => 'document', 'file_id' => (string) $message['document']['file_id']];
        }

        return null;
    }

    private function planName(SubscriptionPayment $payment): string
    {
        $plan = $this->subscriptions->plans()[$payment->plan]['name'] ?? $payment->plan;

        return Trans::text($plan);
    }

    private function statusLabel(string $status): string
    {
        return match ($status) {
            SubscriptionPayment::PAID => __('paid'),
            SubscriptionPayment::REJECTED => __('rejected'),
            SubscriptionPayment::CANCELED => __('canceled'),
            default => $status,
        };
    }

    public function isAdminChat(string $chatId): bool
    {
        return $chatId !== '' && $chatId === $this->adminChatId();
    }

    private function adminChatId(): string
    {
        return (string) config('fitnessos.telegram.admin_chat_id');
    }
}
