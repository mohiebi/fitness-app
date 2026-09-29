<?php

namespace App\Support;

use DateTimeInterface;
use IntlDateFormatter;
use NumberFormatter;

/**
 * Numbers and dates in the app language for text sent outside the web UI
 * (Telegram, email, notifications). Persian gets Persian digits and the
 * Jalali calendar when the intl extension is available.
 */
class LocalFormat
{
    public static function number(int|float $value): string
    {
        if (self::persian()) {
            $formatted = (new NumberFormatter('fa_IR', NumberFormatter::DECIMAL))->format($value);
            if ($formatted !== false) {
                return $formatted;
            }
        }

        return number_format($value, is_float($value) && floor($value) !== $value ? 1 : 0);
    }

    public static function date(?DateTimeInterface $date): string
    {
        if ($date === null) {
            return '';
        }

        if (self::persian()) {
            $formatter = new IntlDateFormatter(
                'fa_IR@calendar=persian',
                IntlDateFormatter::LONG,
                IntlDateFormatter::NONE,
                config('app.timezone'),
                IntlDateFormatter::TRADITIONAL,
            );
            $formatted = $formatter->format($date);
            if ($formatted !== false) {
                return $formatted;
            }
        }

        return $date->format('Y-m-d');
    }

    /**
     * Swap Western digits in ready-made text (like "3 days ago") for
     * Persian digits when the app language is Persian.
     */
    public static function digits(string $text): string
    {
        return self::persian() ? strtr($text, ['0' => '۰', '1' => '۱', '2' => '۲', '3' => '۳', '4' => '۴', '5' => '۵', '6' => '۶', '7' => '۷', '8' => '۸', '9' => '۹']) : $text;
    }

    private static function persian(): bool
    {
        return app()->getLocale() === 'fa' && extension_loaded('intl');
    }
}
