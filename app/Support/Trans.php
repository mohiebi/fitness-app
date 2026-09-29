<?php

namespace App\Support;

/**
 * Translation for places that need a string back (`__()` is typed as
 * string|array because a key can point at a group of lines).
 */
final class Trans
{
    /**
     * @param  array<string, string|int|float>  $replace
     */
    public static function text(string $key, array $replace = []): string
    {
        $translated = __($key, $replace);

        return is_string($translated) ? $translated : $key;
    }
}
