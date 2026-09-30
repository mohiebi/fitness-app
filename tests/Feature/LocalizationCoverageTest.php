<?php

use App\Models\User;
use Illuminate\Support\Facades\File;

/**
 * The site is Persian-first: every piece of text a person can read must have
 * a Persian version. These tests read the source and fail, naming the text,
 * when a new string is added without one.
 */

/** Unescape a PHP or TypeScript string literal body. */
function unquote(string $body, string $quote): string
{
    return str_replace(['\\'.$quote, '\\\\'], [$quote, '\\'], $body);
}

/**
 * Literal strings passed to the given functions in the files under $paths.
 *
 * @param  list<string>  $paths
 * @return array<string, list<string>> text => files it appears in
 */
function literalsIn(array $paths, string $pattern, array $extensions): array
{
    $found = [];

    foreach ($paths as $path) {
        $files = is_file($path) ? [new SplFileInfo($path)] : File::allFiles($path);

        foreach ($files as $file) {
            if (! in_array($file->getExtension(), $extensions, true)) {
                continue;
            }

            preg_match_all($pattern, File::get($file->getPathname()), $matches, PREG_SET_ORDER);
            foreach ($matches as $match) {
                $text = unquote($match[2], $match[1]);
                $found[$text][] = str_replace(base_path().DIRECTORY_SEPARATOR, '', $file->getPathname());
            }
        }
    }

    return $found;
}

test('every server-side string has a Persian translation', function () {
    $translations = json_decode(File::get(lang_path('fa.json')), true, flags: JSON_THROW_ON_ERROR);

    $strings = literalsIn(
        [app_path(), base_path('routes'), resource_path('views')],
        '/(?:__|Trans::text|trans)\(\s*([\'"])((?:\\\\.|(?!\1).)*)\1/s',
        ['php'],
    );

    $missing = collect($strings)
        ->reject(fn (array $files, string $text) => $text === ''
            || str_contains($text, '::')          // a package's own translations
            || preg_match('/^[a-z_]+(\.[a-z_]+)+$/', $text) === 1   // a lang file key like validation.required
            || array_key_exists($text, $translations))
        ->map(fn (array $files, string $text) => $text.'  ['.implode(', ', array_unique($files)).']')
        ->values()
        ->all();

    expect($missing)->toBe([], "Add these to lang/fa.json:\n".implode("\n", $missing));
});

test('every front-end t() string has a Persian translation', function () {
    $source = File::get(resource_path('js/fitnessos/locales/fa.ts'));
    preg_match_all('/^    (?:\'((?:[^\'\\\\]|\\\\.)*)\'|"((?:[^"\\\\]|\\\\.)*)"|([A-Za-z_]\w*)):/m', $source, $keys, PREG_SET_ORDER);
    $translated = collect($keys)->map(fn (array $m) => str_replace("\\'", "'", $m[1] ?: ($m[2] ?: $m[3])))->flip();

    $strings = literalsIn(
        [resource_path('js')],
        '/\bt\(\s*([\'"])((?:\\\\.|(?!\1).)*)\1/s',
        ['ts', 'tsx'],
    );

    $missing = collect($strings)
        ->reject(fn (array $files, string $text) => $text === '' || $text === 'Hi :name' || $translated->has($text))
        ->map(fn (array $files, string $text) => $text.'  ['.implode(', ', array_unique($files)).']')
        ->values()
        ->all();

    expect($missing)->toBe([], "Add these to resources/js/fitnessos/locales/fa.ts:\n".implode("\n", $missing));
});

test('the Persian files are valid and have no duplicate keys', function () {
    $raw = File::get(lang_path('fa.json'));
    json_decode($raw, true, flags: JSON_THROW_ON_ERROR);

    preg_match_all('/^    "((?:[^"\\\\]|\\\\.)*)":/m', $raw, $keys);
    $duplicates = collect($keys[1])->duplicates()->values()->all();

    expect($duplicates)->toBe([]);
});

test('error pages are Persian and right to left', function () {
    app()->setLocale('fa');

    $this->get('/this-page-does-not-exist')
        ->assertNotFound()
        ->assertSee('dir="rtl"', false)
        ->assertSee('lang="fa"', false)
        ->assertSee('صفحه پیدا نشد')
        ->assertDontSee('Not Found');

    $trainee = User::factory()->trainee()->create();
    $this->actingAs($trainee)->get('/dashboard')->assertForbidden()->assertSee('دسترسی مجاز نیست');
});
