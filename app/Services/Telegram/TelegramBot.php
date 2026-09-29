<?php

namespace App\Services\Telegram;

use Illuminate\Support\Facades\Cache;

/**
 * Entry point for everything Telegram sends to the webhook. It drops
 * repeated deliveries, then hands each update to the part of the bot that
 * owns it (payments, or the coach assistant).
 */
class TelegramBot
{
    public function __construct(
        private TelegramClient $telegram,
        private PaymentBot $payments,
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

        if ($this->payments->isAdminChat($chatId)) {
            return; // The admin chat only receives receipts and buttons.
        }

        $text = trim((string) ($message['text'] ?? ''));
        if (str_starts_with($text, '/start')) {
            $this->payments->start($chatId, trim(substr($text, 6)));

            return;
        }

        if ($this->payments->receipt($chatId, $message)) {
            return;
        }

        $this->telegram->sendMessage($chatId, __('To pay for FitnessOS, open Billing in your coach dashboard and tap Pay with Telegram. Then send the transfer receipt here.'));
    }

    /**
     * @param  array<string, mixed>  $callback
     */
    private function callback(array $callback): void
    {
        $this->payments->callback($callback);
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
