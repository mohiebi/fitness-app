<?php

namespace App\Services\Telegram;

use App\Models\TelegramAccount;
use App\Models\User;

/**
 * One conversation with a linked coach while an update is handled: who
 * they are, where to reply, and which message a button tap came from.
 */
final class BotChat
{
    /** A short pop-up shown on the tapped button. */
    public ?string $toast = null;

    public function __construct(
        private TelegramClient $telegram,
        public readonly TelegramAccount $account,
        public readonly ?int $messageId = null,
    ) {}

    public function coach(): User
    {
        return $this->account->user;
    }

    public function id(): string
    {
        return (string) $this->account->chat_id;
    }

    /**
     * @param  list<list<array<string, string>>>|null  $keyboard
     */
    public function send(string $text, ?array $keyboard = null): ?int
    {
        return $this->telegram->sendMessage($this->id(), $text, $keyboard);
    }

    /**
     * Update the message a button was tapped on, or send a new one when the
     * screen was opened from the menu.
     *
     * @param  list<list<array<string, string>>>|null  $keyboard
     */
    public function show(string $text, ?array $keyboard = null): void
    {
        if ($this->messageId === null) {
            $this->send($text, $keyboard);

            return;
        }

        $this->telegram->editMessage($this->id(), $this->messageId, $text, $keyboard);
    }

    /**
     * @param  list<list<array<string, string>>>|null  $keyboard
     */
    public function edit(int $messageId, string $text, ?array $keyboard = null): void
    {
        $this->telegram->editMessage($this->id(), $messageId, $text, $keyboard);
    }

    /**
     * Fill in a message sent earlier ("Drafting…"), or send a new one when
     * that message could not be sent.
     *
     * @param  list<list<array<string, string>>>|null  $keyboard
     */
    public function replace(?int $messageId, string $text, ?array $keyboard = null): void
    {
        if ($messageId === null) {
            $this->send($text, $keyboard);

            return;
        }

        $this->edit($messageId, $text, $keyboard);
    }

    public function typing(): void
    {
        $this->telegram->typing($this->id());
    }

    /**
     * Wait for the coach's next plain message and treat it as $type
     * (a reply, feedback, an edit...) about the record with $id.
     */
    public function expect(string $type, int $id): void
    {
        $this->account->expect($type, $id);
    }

    public function forget(): void
    {
        $this->account->clearExpectation();
    }
}
