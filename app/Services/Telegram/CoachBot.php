<?php

namespace App\Services\Telegram;

use App\Models\TelegramAccount;
use App\Models\User;

/**
 * The bot a coach talks to once their Telegram is connected: the same
 * work as the dashboard, from a phone.
 */
class CoachBot
{
    public function __construct(
        private TelegramClient $telegram,
        private TelegramLinks $links,
    ) {}

    /**
     * /start link_<token>: finish connecting a chat to a coach account.
     */
    public function link(string $chatId, string $token, ?string $username): void
    {
        $coach = $this->links->complete($token, $chatId, $username);

        if ($coach === null) {
            $this->telegram->sendMessage($chatId, __('This connection link has expired. Open your FitnessOS dashboard and tap Connect Telegram again.'));

            return;
        }

        $this->welcome($chatId, $coach);
    }

    public function welcome(string $chatId, User $coach): void
    {
        $this->telegram->sendMessage($chatId, implode("\n", [
            __('Hi :name, your Telegram is connected to FitnessOS. 🎉', ['name' => '<b>'.e($coach->name).'</b>']),
            __('You will get requests, messages and check-ins here.'),
        ]));
    }

    /**
     * Anyone who has not connected a coach account gets pointed at the dashboard.
     */
    public function introduce(string $chatId): void
    {
        $this->telegram->sendMessage($chatId, implode("\n", [
            __('This is the FitnessOS coach bot.'),
            __('To connect it, open Settings → Integrations in your coach dashboard and tap Connect Telegram.'),
            __('To pay for FitnessOS, open Billing in your coach dashboard and tap Pay with Telegram. Then send the transfer receipt here.'),
        ]));
    }

    /**
     * A message from a chat that is linked to a coach.
     *
     * @param  array<string, mixed>  $message
     */
    public function message(TelegramAccount $account, array $message): void
    {
        $chatId = (string) $account->chat_id;
        $text = trim((string) ($message['text'] ?? ''));

        if ($text === '/unlink') {
            $this->links->unlink($account->user);
            $this->telegram->sendMessage($chatId, __('Telegram is disconnected from your FitnessOS account.'));

            return;
        }

        $this->welcome($chatId, $account->user);
    }
}
