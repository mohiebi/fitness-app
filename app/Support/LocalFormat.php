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

    private static function persian(): bool
    {
        return app()->getLocale() === 'fa' && extension_loaded('intl');
    }
}
