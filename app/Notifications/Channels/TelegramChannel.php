<?php

namespace App\Notifications\Channels;

use App\Models\User;
use App\Notifications\AppNotice;
use App\Services\Telegram\TelegramClient;
use App\Services\Telegram\TelegramPush;

/**
 * Sends a notice to the coach's Telegram chat, with buttons to act on it.
 * The Bot API call runs after the response, so a slow Telegram never
 * slows the request that caused the notice.
 */
class TelegramChannel
{
    public function __construct(private TelegramClient $telegram) {}

    public function send(User $notifiable, AppNotice $notice): void
    {
        $chatId = $notifiable->telegramAccount?->chat_id;
        if ($chatId === null) {
            return;
        }

        $text = TelegramPush::text($notice);
        $keyboard = TelegramPush::keyboard($notice);

        defer(fn () => $this->telegram->sendMessage($chatId, $text, $keyboard), always: true);
    }
}
