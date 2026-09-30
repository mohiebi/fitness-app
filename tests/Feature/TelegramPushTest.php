<?php

use App\Models\Coaching;
use App\Models\TelegramAccount;
use App\Models\User;
use App\Services\CoachingLifecycle;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Factory;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    fakeTelegram();
    $this->coach = linkedCoach('4242');
    $this->trainee = User::factory()->trainee()->create(['name' => 'Nima Rezaei']);
});

test('a new coaching request reaches the coach in Telegram and can be accepted from it', function () {
    $coaching = app(CoachingLifecycle::class)->request($this->trainee, $this->coach->coachProfile, 'I want to lose fat');

    $text = telegramTexts('4242')[0];
    expect($text)->toContain('New coaching request')->toContain('Nima Rezaei asked to train with you')->toContain('I want to lose fat');
    expect(lastButtons('4242'))->toBe(['req:acc:'.$coaching->id, 'req:dec:'.$coaching->id]);
    expect($this->coach->notifications()->where('data->kind', 'coaching_requested')->exists())->toBeTrue();

    chatTap('4242', 'req:acc:'.$coaching->id);
    expect($coaching->fresh()->status)->toBe(Coaching::ACTIVE);
});

test('every trainee message is pushed, while the app keeps a single unread notice', function () {
    app(CoachingLifecycle::class)->startDirect($this->coach, $this->trainee);

    $this->actingAs($this->trainee)->postJson('/fitnessos/messages', ['body' => 'Can I train sore?'])->assertCreated();
    $this->actingAs($this->trainee)->postJson('/fitnessos/messages', ['body' => 'Also my knee hurts'])->assertCreated();

    $texts = telegramTexts('4242');
    expect($texts)->toHaveCount(2);
    expect($texts[0])->toContain('New message from Nima Rezaei')->toContain('Can I train sore?');
    expect($texts[1])->toContain('Also my knee hurts');
    expect(lastButtons('4242'))->toBe(['inb:reply:'.$this->trainee->id, 'ai:reply:'.$this->trainee->id]);
    expect($this->coach->notifications()->where('data->kind', 'message')->count())->toBe(1);
    expect(json_encode($this->coach->notifications()->first()->data))->not->toContain('Can I train sore?');
});

test('a submitted check-in comes with buttons to read it or draft feedback', function () {
    app(CoachingLifecycle::class)->startDirect($this->coach, $this->trainee);

    $id = $this->actingAs($this->trainee)->postJson('/fitnessos/checkins', ['reflection' => 'Strong week', 'weight_kg' => 80])->assertCreated()->json('id');

    expect(telegramTexts('4242')[0])->toContain('Nima Rezaei sent a check-in')->toContain('Strong week');
    expect(lastButtons('4242'))->toBe(['chk:open:'.$id, 'ai:fb:'.$id]);
});

test('kinds a coach switched off are not pushed but still show in the app', function () {
    app(CoachingLifecycle::class)->startDirect($this->coach, $this->trainee);
    $this->coach->telegramAccount->update(['preferences' => ['messages' => false]]);

    $this->actingAs($this->trainee)->postJson('/fitnessos/messages', ['body' => 'Hello coach'])->assertCreated();
    app(CoachingLifecycle::class)->request(User::factory()->trainee()->create(), $this->coach->coachProfile);

    expect(telegramTexts('4242'))->toHaveCount(1)->and(telegramTexts('4242')[0])->toContain('New coaching request');
    expect($this->coach->notifications()->where('data->kind', 'message')->exists())->toBeTrue();
});

test('a coach without Telegram, and every trainee, get no Telegram messages', function () {
    $plain = User::factory()->publishedCoach()->create();
    app(CoachingLifecycle::class)->request($this->trainee, $plain->coachProfile, 'hi');
    expect($plain->notifications()->count())->toBe(1);

    $coaching = Coaching::query()->firstOrFail();
    app(CoachingLifecycle::class)->accept($coaching, $plain);
    app(CoachingLifecycle::class)->end($coaching->fresh(), $plain);

    Http::assertNothingSent();
});

test('payment and subscription notices offer the subscription screen', function () {
    $this->coach->subscription()->update(['trial_ends_at' => now()->addDays(2)]);

    $this->artisan('fitnessos:subscriptions:remind')->assertSuccessful();

    expect(telegramTexts('4242')[0])->toContain('Your subscription ends in 2 days');
    expect(lastButtons('4242'))->toBe(['bill:show']);

    forgetTelegramCalls();
    $this->artisan('fitnessos:subscription:grant', ['email' => $this->coach->email, 'plan' => 'starter'])->assertSuccessful();
    expect(telegramTexts('4242')[0])->toContain('Payment confirmed');
});

test('the app keeps working when Telegram is unreachable', function () {
    app(CoachingLifecycle::class)->startDirect($this->coach, $this->trainee);
    Http::swap(new Factory);
    Http::fake(fn () => throw new ConnectionException('down'));

    $this->actingAs($this->trainee)->postJson('/fitnessos/messages', ['body' => 'Anyone there?'])->assertCreated();

    expect(DB::table('fitnessos_messages')->count())->toBe(1);
    expect($this->coach->notifications()->count())->toBe(1);
});

test('the morning summary goes out once a day at the chosen hour', function () {
    config(['fitnessos.telegram.timezone' => 'UTC']);
    app(CoachingLifecycle::class)->request($this->trainee, $this->coach->coachProfile, 'hi');
    forgetTelegramCalls();

    Carbon::setTestNow('2026-10-01 07:00:00');
    $this->artisan('fitnessos:telegram:digest')->assertSuccessful();
    expect(telegramTexts('4242'))->toBe([]);

    Carbon::setTestNow('2026-10-01 08:05:00');
    $this->artisan('fitnessos:telegram:digest')->assertSuccessful();
    expect(telegramTexts('4242'))->toHaveCount(1);
    expect(telegramTexts('4242')[0])->toContain('Good morning, <b>Sara</b>')->toContain('Coaching requests: 1');
    expect(lastButtons('4242'))->toContain('req:list');

    $this->artisan('fitnessos:telegram:digest');
    expect(telegramTexts('4242'))->toHaveCount(1);

    Carbon::setTestNow('2026-10-02 08:00:00');
    $this->artisan('fitnessos:telegram:digest');
    expect(telegramTexts('4242'))->toHaveCount(2);
});

test('the morning summary respects the chosen hour, the switch and an empty desk', function () {
    config(['fitnessos.telegram.timezone' => 'UTC']);
    Carbon::setTestNow('2026-10-01 08:00:00');

    // Nothing needs the coach: no message.
    $this->artisan('fitnessos:telegram:digest');
    expect(telegramTexts('4242'))->toBe([]);

    app(CoachingLifecycle::class)->request($this->trainee, $this->coach->coachProfile, 'hi');
    forgetTelegramCalls();

    $this->coach->telegramAccount->update(['preferences' => ['digest' => false]]);
    $this->artisan('fitnessos:telegram:digest');
    expect(telegramTexts('4242'))->toBe([]);

    $this->coach->telegramAccount->update(['preferences' => ['digest' => true, 'digest_hour' => 9], 'last_digest_on' => null]);
    $this->artisan('fitnessos:telegram:digest');
    expect(telegramTexts('4242'))->toBe([]);

    $this->artisan('fitnessos:telegram:digest', ['--force' => true]);
    expect(telegramTexts('4242'))->toHaveCount(1);
});

test('the morning summary follows the coach local clock', function () {
    config(['fitnessos.telegram.timezone' => 'Asia/Tehran']);
    app(CoachingLifecycle::class)->request($this->trainee, $this->coach->coachProfile, 'hi');
    forgetTelegramCalls();

    // 04:30 UTC is 08:00 in Tehran (UTC+3:30).
    Carbon::setTestNow('2026-10-01 04:30:00');
    $this->artisan('fitnessos:telegram:digest');

    expect(telegramTexts('4242'))->toHaveCount(1);
});

test('setting up the bot registers the webhook and the command list', function () {
    $this->artisan('fitnessos:telegram:webhook', ['domain' => 'https://example.com'])->assertSuccessful();

    $calls = collect(telegramCalls());
    expect($calls->pluck(0)->all())->toBe(['setWebhook', 'setMyCommands']);
    expect($calls[0][1])->toMatchArray(['url' => 'https://example.com/telegraph/test-token/webhook', 'secret_token' => 'hook-secret', 'allowed_updates' => ['message', 'callback_query']]);
    expect(collect($calls[1][1]['commands'])->pluck('command')->all())->toContain('today', 'requests', 'messages', 'checkins', 'drafts', 'billing', 'settings', 'menu', 'help', 'cancel', 'unlink');
    expect(TelegramAccount::count())->toBe(1);
});

afterEach(fn () => Carbon::setTestNow());
