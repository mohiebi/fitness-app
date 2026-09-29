<?php

use App\Models\TelegramAccount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "pest()" function to bind different classes or traits.
|
*/

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| When you're writing tests, you often need to check that values meet certain conditions. The
| "expect()" function gives you access to a set of "expectations" methods that you can use
| to assert different things. Of course, you may extend the Expectation API at any time.
|
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| While Pest is very powerful out-of-the-box, you may have some testing code specific to your
| project that you don't want to repeat in every file. Here you can also expose helpers as
| global functions to help you to reduce the number of lines of code in your test files.
|
*/

/**
 * Turn the Telegram bot on with fake credentials and a fake Bot API.
 */
function fakeTelegram(): void
{
    app()->setLocale('en');
    config([
        'fitnessos.telegram.bot_token' => 'test-token',
        'fitnessos.telegram.bot_username' => 'FitnessOSBot',
        'fitnessos.telegram.webhook_secret' => 'hook-secret',
        'fitnessos.telegram.admin_chat_id' => '-1001',
        'fitnessos.payment_card.number' => '6037-9911-1111-2222',
        'fitnessos.payment_card.holder' => 'FitnessOS',
    ]);
    Http::fake(['api.telegram.org/*' => Http::response(['ok' => true, 'result' => ['message_id' => 900]])]);
}

/**
 * Deliver an update to the webhook the way Telegram does.
 *
 * @param  array<string, mixed>  $update
 */
function telegramUpdate(array $update): TestResponse
{
    static $next = 1000;
    $update += ['update_id' => $next++];

    return test()->withHeader('X-Telegram-Bot-Api-Secret-Token', 'hook-secret')->postJson('/telegram/webhook', $update);
}

/**
 * A coach who has connected the given Telegram chat.
 */
function linkedCoach(string $chatId = '4242', string $name = 'Sara Ahmadi'): User
{
    $coach = User::factory()->publishedCoach()->create(['name' => $name]);
    TelegramAccount::create(['user_id' => $coach->id, 'chat_id' => $chatId, 'username' => 'sara', 'linked_at' => now()]);

    return $coach;
}

/** A plain text message from a chat. */
function chatText(string $chatId, string $text): TestResponse
{
    return telegramUpdate(['message' => ['chat' => ['id' => (int) $chatId, 'type' => 'private'], 'from' => ['id' => (int) $chatId], 'text' => $text]]);
}

/** A button tap in a chat. */
function chatTap(string $chatId, string $data, int $messageId = 50): TestResponse
{
    return telegramUpdate(['callback_query' => ['id' => 'cb-'.uniqid(), 'data' => $data, 'from' => ['id' => (int) $chatId], 'message' => ['message_id' => $messageId, 'chat' => ['id' => (int) $chatId, 'type' => 'private']]]]);
}

/**
 * Every Bot API call made so far, as [method, payload] pairs.
 *
 * @return list<array{0: string, 1: array<string, mixed>}>
 */
function telegramCalls(): array
{
    return Http::recorded()
        ->map(fn (array $pair) => [basename((string) parse_url($pair[0]->url(), PHP_URL_PATH)), $pair[0]->data()])
        ->values()
        ->all();
}

/**
 * The text of every message sent to a chat (sends and edits), oldest first.
 *
 * @return list<string>
 */
function telegramTexts(string $chatId): array
{
    return collect(telegramCalls())
        ->filter(fn (array $call) => in_array($call[0], ['sendMessage', 'editMessageText'], true) && (string) ($call[1]['chat_id'] ?? '') === $chatId)
        ->map(fn (array $call) => (string) $call[1]['text'])
        ->values()
        ->all();
}

/**
 * The buttons (callback data or URL) under the last message sent to a chat.
 *
 * @return list<string>
 */
function lastButtons(string $chatId): array
{
    $last = collect(telegramCalls())
        ->filter(fn (array $call) => in_array($call[0], ['sendMessage', 'editMessageText'], true) && (string) ($call[1]['chat_id'] ?? '') === $chatId)
        ->last();

    return collect($last[1]['reply_markup']['inline_keyboard'] ?? [])->flatten(1)
        ->map(fn (array $button) => (string) ($button['callback_data'] ?? $button['url'] ?? ''))
        ->values()
        ->all();
}
