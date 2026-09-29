<?php

namespace App\Services\Telegram;

use App\Models\TelegramAccount;
use Illuminate\Support\Facades\Cache;

/**
 * Entry point for everything Telegram sends to the webhook. It drops
 * repeated deliveries, then hands each update to the part of the bot that
 * owns it (payments, or the coach assistant).
 */
class TelegramBot
{
    public function __construct(
        private PaymentBot $payments,
        private CoachBot $coach,
        private TelegramLinks $links,
    ) {}

    /**
     * @param  array<string, mixed>  $update  a Telegram Update object
     */
    public function handle(array $update): void
    {
        if ($this->alreadySeen($update)) {
            return;
        }

        if (isset($update['callback_query']) && is_array($update['callback_query'])) {
            $this->callback($update['callback_query']);

            return;
        }

        $message = $update['message'] ?? null;
        if (! is_array($message) || ! isset($message['chat']['id'])) {
            return;
        }

        $chatId = (string) $message['chat']['id'];
        if (($message['chat']['type'] ?? 'private') !== 'private') {
            return; // Coaches use the bot in a private chat only.
        }

        $account = $this->links->coachForChat($chatId);
        if ($account === null && $this->payments->isAdminChat($chatId)) {
            return; // The admin chat only receives receipts and buttons.
        }

        $text = trim((string) ($message['text'] ?? ''));
        if (str_starts_with($text, '/start')) {
            $this->start($chatId, trim(substr($text, 6)), $message, $account);

            return;
        }

        if ($account === null) {
            if (! $this->payments->receipt($chatId, $message)) {
                $this->coach->introduce($chatId);
            }

            return;
        }

        if ($this->payments->receipt($chatId, $message)) {
            return;
        }

        $this->coach->message($account, $message);
    }

    /**
     * @param  array<string, mixed>  $message
     */
    private function start(string $chatId, string $payload, array $message, ?TelegramAccount $account): void
    {
        if (str_starts_with($payload, 'link_')) {
            $this->coach->link($chatId, substr($payload, 5), isset($message['from']['username']) ? (string) $message['from']['username'] : null);
        } elseif (str_starts_with($payload, 'pay_')) {
            $this->payments->start($chatId, $payload);
        } elseif ($account !== null) {
            $this->coach->welcome($chatId, $account->user);
        } else {
            $this->coach->introduce($chatId);
        }
    }

    /**
     * @param  array<string, mixed>  $callback
     */
    private function callback(array $callback): void
    {
        if (str_starts_with((string) ($callback['data'] ?? ''), 'pay:')) {
            $this->payments->callback($callback);

            return;
        }

        $this->coach->callback($callback);
    }

    /**
     * Telegram re-sends an update if it thinks the first delivery failed.
     * Acting on one twice could send a message or pay a bill twice.
     *
     * @param  array<string, mixed>  $update
     */
    private function alreadySeen(array $update): bool
    {
        $id = $update['update_id'] ?? null;
        if (! is_int($id)) {
            return false;
        }

        return ! Cache::add('telegram:update:'.$id, true, now()->addDay());
    }
}
