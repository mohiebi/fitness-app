<?php

namespace App\Services\Telegram;

use App\Support\LocalFormat;
use Carbon\CarbonInterface;

/**
 * Small helpers for writing Telegram messages: HTML-safe text, buttons
 * and dashboard links.
 */
final class Tg
{
    /** Telegram shows at most 4096 characters per message. */
    public const MAX_TEXT = 3800;

    /**
     * Make user-written text safe inside a message (parse mode HTML).
     */
    public static function esc(?string $text): string
    {
        return htmlspecialchars((string) $text, ENT_NOQUOTES, 'UTF-8');
    }

    /**
     * Shorten text to at most $max characters. Clip before escaping, so a
     * cut never lands in the middle of an HTML entity.
     */
    public static function clip(?string $text, int $max): string
    {
        $text = trim((string) $text);

        return mb_strlen($text) > $max ? rtrim(mb_substr($text, 0, $max - 1)).'…' : $text;
    }

    /**
     * Clipped, escaped user text, ready to drop into a message.
     */
    public static function say(?string $text, int $max = 500): string
    {
        return self::esc(self::clip($text, $max));
    }

    /**
     * A quoted block, used to show what a trainee or the AI wrote.
     */
    public static function quote(?string $text, int $max = 700): string
    {
        return '<blockquote>'.self::say($text, $max).'</blockquote>';
    }

    public static function ago(?CarbonInterface $at): string
    {
        return $at === null ? '' : LocalFormat::digits($at->copy()->locale(app()->getLocale())->diffForHumans());
    }

    /**
     * @return array{text: string, callback_data: string}
     */
    public static function button(string $text, string $data): array
    {
        return ['text' => $text, 'callback_data' => $data];
    }

    /**
     * A button that opens a dashboard page. Telegram refuses non-HTTPS
     * links, so there is none on a local development site.
     *
     * @return array{text: string, url: string}|null
     */
    public static function dashboard(string $text, string $path): ?array
    {
        $url = url($path);

        return str_starts_with($url, 'https://') ? ['text' => $text, 'url' => $url] : null;
    }

    /**
     * One row of buttons; missing buttons (null) are left out.
     *
     * @param  array<int, array<string, string>|null>  $buttons
     * @return list<array<string, string>>
     */
    public static function row(array $buttons): array
    {
        return array_values(array_filter($buttons));
    }

    /**
     * Keyboard rows without the empty ones.
     *
     * @param  array<int, list<array<string, string>>>  $rows
     * @return list<list<array<string, string>>>
     */
    public static function keyboard(array $rows): array
    {
        return array_values(array_filter($rows, fn (array $row) => $row !== []));
    }
}
