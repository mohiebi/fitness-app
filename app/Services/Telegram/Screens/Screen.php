<?php

namespace App\Services\Telegram\Screens;

use App\Services\Telegram\BotChat;

/**
 * One part of the coach bot (requests, inbox, ...). CoachBot sends menu
 * taps to show(), button taps to tap(), and the coach's typed text to
 * typed() when the screen asked for it with BotChat::expect().
 */
abstract class Screen
{
    /**
     * Open the screen from the menu or a slash command.
     */
    abstract public function show(BotChat $chat): void;

    /**
     * A button on this screen was tapped.
     *
     * @param  list<string>  $args  the parts of the button's data after the action
     */
    public function tap(BotChat $chat, string $action, array $args): void
    {
        $this->show($chat);
    }

    /**
     * The coach typed the text this screen was waiting for.
     */
    public function typed(BotChat $chat, string $type, int $id, string $text): void
    {
        $chat->forget();
    }
}
