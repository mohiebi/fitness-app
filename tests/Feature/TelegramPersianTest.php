<?php

use App\Models\SubscriptionPayment;
use App\Models\User;
use App\Services\CoachingLifecycle;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    fakeTelegram();
    // The website is in English; the bot must still speak Persian.
    config(['fitnessos.telegram.locale' => 'fa']);
    app()->setLocale('en');
    $this->coach = linkedCoach('4242');
});

/** Whether the text has Persian letters and no plain English sentence. */
function isPersian(string $text): bool
{
    return preg_match('/\p{Arabic}/u', $text) === 1;
}

test('the coach bot speaks Persian whatever language the website uses', function () {
    chatText('4242', '/start');

    [, $payload] = telegramCalls()[0];
    expect(isPersian($payload['text']))->toBeTrue();
    expect(collect($payload['reply_markup']['keyboard'])->flatten(1)->pluck('text')->all())
        ->toContain('📥 درخواست‌ها', '💬 پیام‌ها', '👥 شاگردان', '💳 اشتراک');

    forgetTelegramCalls();
    chatText('4242', '📊 امروز');
    chatText('4242', '/help');
    chatText('4242', 'hello');
    chatText('4242', '⚙️ تنظیمات');

    foreach (telegramTexts('4242') as $text) {
        expect(isPersian($text))->toBeTrue();
    }
    expect(implode(' ', telegramTexts('4242')))->not->toContain('What I can do')->not->toContain('Settings');
});

test('a stranger is answered in Persian too', function () {
    chatText('31337', '/start');

    expect(isPersian(telegramTexts('31337')[0]))->toBeTrue();
});

test('buttons and pop-ups are Persian, including the admin payment approval', function () {
    $payment = test()->actingAs($this->coach)->postJson('/fitnessos/billing/payments', ['plan' => 'starter'])->assertCreated()->json();
    chatText('4242', '/start pay_'.$payment['reference']);
    telegramUpdate(['message' => ['chat' => ['id' => 4242, 'type' => 'private'], 'photo' => [['file_id' => 'receipt']]]]);

    $forward = collect(telegramCalls())->first(fn ($call) => $call[0] === 'sendPhoto');
    $caption = $forward[1]['caption'];
    expect(isPersian($caption))->toBeTrue()->and($caption)->not->toContain('Plan:')->not->toContain('Amount:')->not->toContain('toman');
    $buttons = collect($forward[1]['reply_markup']['inline_keyboard'])->flatten(1)->pluck('text')->all();
    expect($buttons)->toBe(['✅ تأیید', '❌ رد']);

    chatTap('-1001', 'pay:approve:'.SubscriptionPayment::query()->value('id'));
    $answer = collect(telegramCalls())->last(fn ($call) => $call[0] === 'answerCallbackQuery');
    expect($answer[1]['text'])->toBe('پرداخت تأیید شد.');

    chatTap('-1001', 'pay:approve:'.SubscriptionPayment::query()->value('id'));
    $again = collect(telegramCalls())->last(fn ($call) => $call[0] === 'answerCallbackQuery');
    expect(isPersian($again[1]['text']))->toBeTrue();

    chatTap('999', 'pay:approve:1');
    $denied = collect(telegramCalls())->last(fn ($call) => $call[0] === 'answerCallbackQuery');
    expect($denied[1]['text'])->toBe('اجازه‌ی این کار را نداری.');
});

test('the morning summary is written in Persian', function () {
    config(['fitnessos.telegram.timezone' => 'UTC']);
    $trainee = User::factory()->trainee()->create();
    app(CoachingLifecycle::class)->request($trainee, $this->coach->coachProfile, 'hi');
    forgetTelegramCalls();

    $this->artisan('fitnessos:telegram:digest', ['--force' => true])->assertSuccessful();

    expect(isPersian(telegramTexts('4242')[0]))->toBeTrue();
    expect(telegramTexts('4242')[0])->not->toContain('Good morning');
    expect(DB::table('users')->count())->toBeGreaterThan(1);
});

test('the webhook only answers for the registered bot', function () {
    $this->withHeader('X-Telegram-Bot-Api-Secret-Token', 'hook-secret')->postJson('/telegraph/another-token/webhook', ['update_id' => 1])->assertNotFound();
});
