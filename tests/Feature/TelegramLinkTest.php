<?php

use App\Models\TelegramAccount;
use App\Models\User;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    fakeTelegram();
    $this->coach = User::factory()->publishedCoach()->create(['name' => 'Sara Ahmadi']);
});

function startTelegramLink(User $coach): string
{
    $url = test()->actingAs($coach)->postJson('/fitnessos/telegram/link')->assertCreated()->json('url');
    expect($url)->toStartWith('https://t.me/FitnessOSBot?start=link_');

    return substr($url, strlen('https://t.me/FitnessOSBot?start='));
}

test('a coach connects Telegram with a one-time link', function () {
    $this->actingAs($this->coach)->getJson('/fitnessos/telegram')->assertOk()
        ->assertJsonPath('available', true)
        ->assertJsonPath('linked', false)
        ->assertJsonPath('bot_username', 'FitnessOSBot');

    $payload = startTelegramLink($this->coach);
    expect(TelegramAccount::query()->value('link_token_hash'))->not->toContain(substr($payload, 5));

    telegramUpdate(['message' => ['chat' => ['id' => 4242, 'type' => 'private'], 'from' => ['username' => 'sara_fit'], 'text' => '/start '.$payload]])->assertOk();

    $account = $this->coach->telegramAccount()->first();
    expect($account->chat_id)->toBe('4242');
    expect($account->username)->toBe('sara_fit');
    expect($account->link_token_hash)->toBeNull();
    expect(telegramTexts('4242')[0])->toContain('connected')->toContain('Sara Ahmadi');

    $this->actingAs($this->coach)->getJson('/fitnessos/telegram')->assertJsonPath('linked', true)->assertJsonPath('username', 'sara_fit');
});

test('a link works once and expires', function () {
    $payload = startTelegramLink($this->coach);
    telegramUpdate(['message' => ['chat' => ['id' => 1, 'type' => 'private'], 'text' => '/start '.$payload]]);

    // The same token can't connect another chat.
    telegramUpdate(['message' => ['chat' => ['id' => 2, 'type' => 'private'], 'text' => '/start '.$payload]]);
    expect(telegramTexts('2')[0])->toContain('expired');
    expect($this->coach->telegramAccount()->value('chat_id'))->toBe('1');

    $other = User::factory()->publishedCoach()->create();
    $late = startTelegramLink($other);
    $this->travel(20)->minutes();
    telegramUpdate(['message' => ['chat' => ['id' => 3, 'type' => 'private'], 'text' => '/start '.$late]]);
    expect(telegramTexts('3')[0])->toContain('expired');
    expect($other->telegramAccount()->value('chat_id'))->toBeNull();
});

test('asking for a new link cancels the previous one', function () {
    $first = startTelegramLink($this->coach);
    $second = startTelegramLink($this->coach);

    telegramUpdate(['message' => ['chat' => ['id' => 5, 'type' => 'private'], 'text' => '/start '.$first]]);
    expect($this->coach->telegramAccount()->value('chat_id'))->toBeNull();

    telegramUpdate(['message' => ['chat' => ['id' => 5, 'type' => 'private'], 'text' => '/start '.$second]]);
    expect($this->coach->telegramAccount()->value('chat_id'))->toBe('5');
});

test('connecting a chat to a new account releases it from the old one', function () {
    $old = linkedCoach('777', 'Old Coach');
    $payload = startTelegramLink($this->coach);

    telegramUpdate(['message' => ['chat' => ['id' => 777, 'type' => 'private'], 'text' => '/start '.$payload]]);

    expect($this->coach->telegramAccount()->value('chat_id'))->toBe('777');
    expect($old->telegramAccount()->value('chat_id'))->toBeNull();
});

test('only coaches can connect, and only when the bot is set up', function () {
    $trainee = User::factory()->trainee()->create();
    $this->actingAs($trainee)->postJson('/fitnessos/telegram/link')->assertForbidden();
    $this->actingAs($trainee)->getJson('/fitnessos/telegram')->assertForbidden();

    config(['fitnessos.telegram.bot_username' => null]);
    $this->actingAs($this->coach)->getJson('/fitnessos/telegram')->assertJsonPath('available', false)->assertJsonPath('bot_username', null);
    $this->actingAs($this->coach)->postJson('/fitnessos/telegram/link')->assertStatus(503);
});

test('a stranger in the bot is told how to connect', function () {
    chatText('31337', 'hello')->assertOk();
    chatText('31337', '/start')->assertOk();

    expect(telegramTexts('31337'))->toHaveCount(2)->each->toContain('Connect Telegram');
});

test('the bot ignores group chats', function () {
    telegramUpdate(['message' => ['chat' => ['id' => -555, 'type' => 'group'], 'text' => '/start']])->assertOk();

    Http::assertNothingSent();
});

test('a coach disconnects from the bot or from the dashboard', function () {
    $coach = linkedCoach('900');

    chatText('900', '/unlink')->assertOk();
    expect($coach->telegramAccount()->value('chat_id'))->toBeNull();
    expect(telegramTexts('900')[0])->toContain('disconnected');

    TelegramAccount::query()->where('user_id', $coach->id)->update(['chat_id' => '900', 'linked_at' => now()]);
    $this->actingAs($coach)->deleteJson('/fitnessos/telegram')->assertOk()->assertJsonPath('linked', false);
    expect($coach->telegramAccount()->value('chat_id'))->toBeNull();
});

test('notification preferences are saved and validated', function () {
    $this->actingAs($this->coach)->putJson('/fitnessos/telegram', ['messages' => false, 'digest_hour' => 7])->assertOk()
        ->assertJsonPath('preferences.messages', false)
        ->assertJsonPath('preferences.requests', true)
        ->assertJsonPath('preferences.digest_hour', 7);

    $this->actingAs($this->coach)->putJson('/fitnessos/telegram', ['digest_hour' => 30])->assertUnprocessable();
    $this->actingAs($this->coach)->putJson('/fitnessos/telegram', ['digest' => 'maybe'])->assertUnprocessable();
});
