<?php

namespace App\Services\Telegram;

use App\Support\Trans;

/**
 * The coach bot's menu: the buttons under the chat box and the slash
 * commands Telegram lists, both mapped to the same screens.
 */
final class Menu
{
    /** Screen command => menu label (the English text is the translation key). */
    private const ITEMS = [
        'today' => '📊 Today',
        'requests' => '📥 Requests',
        'messages' => '💬 Messages',
        'trainees' => '👥 Trainees',
        'checkins' => '✅ Check-ins',
        'drafts' => '🤖 AI drafts',
        'billing' => '💳 Subscription',
        'settings' => '⚙️ Settings',
    ];

    /**
     * The keyboard pinned under the chat box, two buttons a row.
     *
     * @return list<list<string>>
     */
    public static function rows(): array
    {
        return array_chunk(array_values(array_map(fn (string $label) => Trans::text($label), self::ITEMS)), 2);
    }

    /**
     * Which screen a message asks for, whether it is a menu button label or
     * a slash command (with or without @BotName).
     */
    public static function screenFor(string $text): ?string
    {
        $text = trim($text);

        if (str_starts_with($text, '/')) {
            $command = strtolower(explode('@', substr($text, 1))[0]);

            return array_key_exists($command, self::ITEMS) ? $command : null;
        }

        foreach (self::ITEMS as $command => $label) {
            if ($text === Trans::text($label)) {
                return $command;
            }
        }

        return null;
    }

    /**
     * The command list Telegram shows when a coach types "/".
     *
     * @return list<array{command: string, description: string}>
     */
    public static function commands(): array
    {
        $commands = [];
        foreach (self::ITEMS as $command => $label) {
            // Drop the emoji: the command list has its own styling.
            $commands[] = ['command' => $command, 'description' => trim((string) preg_replace('/^[^\p{L}\p{N}]+/u', '', Trans::text($label)))];
        }

        return [
            ...$commands,
            ['command' => 'menu', 'description' => __('Show the menu')],
            ['command' => 'cancel', 'description' => __('Cancel what I was doing')],
            ['command' => 'help', 'description' => __('What can this bot do?')],
            ['command' => 'unlink', 'description' => __('Disconnect Telegram')],
        ];
    }
}
