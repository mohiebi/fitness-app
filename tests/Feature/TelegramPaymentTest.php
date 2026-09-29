<?php

use App\Models\SubscriptionPayment;
use App\Models\User;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Testing\TestResponse;

beforeEach(function () {
    app()->setLocale('en');
    config([
        'fitnessos.telegram.bot_token' => 'test-token',
        'fitnessos.telegram.bot_username' => 'FitnessOSPayBot',
        'fitnessos.telegram.webhook_secret' => 'hook-secret',
        'fitnessos.telegram.admin_chat_id' => '-1001',
        'fitnessos.payment_card.number' => '6037-9911-1111-2222',
        'fitnessos.payment_card.holder' => 'FitnessOS',
        'fitnessos.plans.starter.price' => 490000,
    ]);
    Http::fake(['api.telegram.org/*' => Http::response(['ok' => true, 'result' => true])]);

    $this->coach = User::factory()->publishedCoach()->create(['name' => 'Sara', 'email' => 'sara@example.com']);
});

function telegramUpdate(array $update): TestResponse
{
    return test()->withHeader('X-Telegram-Bot-Api-Secret-Token', 'hook-secret')->postJson('/telegram/webhook', $update);
}

function startPayment(User $coach, string $plan = 'starter'): array
{
    return test()->actingAs($coach)->postJson('/fitnessos/billing/payments', ['plan' => $plan])->assertCreated()->json();
}

test('a coach starts a Telegram payment and gets a deep link; the open payment is reused', function () {
    $this->actingAs($this->coach)->getJson('/fitnessos/billing')->assertOk()
        ->assertJsonPath('subscription.on_trial', true)
        ->assertJsonPath('telegram_enabled', true)
        ->assertJsonPath('open_payment', null);

    $payment = startPayment($this->coach);
    expect($payment['amount'])->toBe(490000);
    expect($payment['telegram_url'])->toBe('https://t.me/FitnessOSPayBot?start=pay_'.$payment['reference']);

    expect(startPayment($this->coach)['id'])->toBe($payment['id']);
    $this->actingAs($this->coach)->getJson('/fitnessos/billing')->assertJsonPath('open_payment.reference', $payment['reference']);
});

test('the webhook rejects requests without the secret token', function () {
    $this->postJson('/telegram/webhook', ['update_id' => 1])->assertForbidden();
    $this->withHeader('X-Telegram-Bot-Api-Secret-Token', 'wrong')->postJson('/telegram/webhook', ['update_id' => 1])->assertForbidden();
});

test('full flow: start, receipt, admin approval extends the subscription once', function () {
    $payment = startPayment($this->coach);

    telegramUpdate(['update_id' => 1, 'message' => ['chat' => ['id' => 555], 'text' => '/start pay_'.$payment['reference']]])->assertOk();
    Http::assertSent(fn (Request $request) => str_ends_with($request->url(), '/sendMessage')
        && $request['chat_id'] === '555'
        && str_contains($request['text'], '490,000')
        && str_contains($request['text'], '6037-9911-1111-2222'));

    telegramUpdate(['update_id' => 2, 'message' => ['chat' => ['id' => 555], 'photo' => [
        ['file_id' => 'small', 'width' => 90], ['file_id' => 'big', 'width' => 1280],
    ]]])->assertOk();

    $stored = SubscriptionPayment::query()->firstOrFail();
    expect($stored->status)->toBe(SubscriptionPayment::SUBMITTED);
    expect($stored->receipt_file_id)->toBe('photo:big');
    Http::assertSent(fn (Request $request) => str_ends_with($request->url(), '/sendPhoto')
        && $request['chat_id'] === '-1001'
        && $request['photo'] === 'big'
        && $request['reply_markup']['inline_keyboard'][0][0]['callback_data'] === 'pay:approve:'.$stored->id);

    // Someone outside the admin chat can't approve.
    telegramUpdate(['update_id' => 3, 'callback_query' => ['id' => 'cb1', 'data' => 'pay:approve:'.$stored->id, 'from' => ['id' => 555], 'message' => ['message_id' => 9, 'chat' => ['id' => 555]]]]);
    expect($stored->fresh()->status)->toBe(SubscriptionPayment::SUBMITTED);

    telegramUpdate(['update_id' => 4, 'callback_query' => ['id' => 'cb2', 'data' => 'pay:approve:'.$stored->id, 'from' => ['id' => 1, 'username' => 'boss'], 'message' => ['message_id' => 10, 'chat' => ['id' => -1001]]]]);
    $subscription = $this->coach->subscription()->first();
    expect($stored->fresh()->status)->toBe(SubscriptionPayment::PAID);
    expect($stored->fresh()->reviewed_by)->toBe('telegram:boss');
    expect($subscription->plan)->toBe('starter');
    expect($subscription->onTrial())->toBeFalse();
    $paidUntil = $subscription->paid_until;
    Http::assertSent(fn (Request $request) => str_ends_with($request->url(), '/sendMessage') && $request['chat_id'] === '555' && str_contains($request['text'], $paidUntil->toDateString()));

    // A second tap doesn't pay twice.
    telegramUpdate(['update_id' => 5, 'callback_query' => ['id' => 'cb3', 'data' => 'pay:approve:'.$stored->id, 'from' => ['id' => 1], 'message' => ['message_id' => 10, 'chat' => ['id' => -1001]]]]);
    expect($this->coach->subscription()->first()->paid_until->equalTo($paidUntil))->toBeTrue();
});

test('rejected receipts do not extend the subscription', function () {
    $payment = startPayment($this->coach);
    telegramUpdate(['update_id' => 1, 'message' => ['chat' => ['id' => 777], 'text' => '/start pay_'.$payment['reference']]]);
    telegramUpdate(['update_id' => 2, 'message' => ['chat' => ['id' => 777], 'document' => ['file_id' => 'pdf1', 'mime_type' => 'application/pdf']]]);
    Http::assertSent(fn (Request $request) => str_ends_with($request->url(), '/sendDocument') && $request['document'] === 'pdf1');

    telegramUpdate(['update_id' => 3, 'callback_query' => ['id' => 'cb', 'data' => 'pay:reject:'.$payment['id'], 'from' => ['id' => 1], 'message' => ['message_id' => 3, 'chat' => ['id' => -1001]]]]);

    expect(SubscriptionPayment::query()->value('status'))->toBe(SubscriptionPayment::REJECTED);
    expect($this->coach->subscription()->first()->onTrial())->toBeTrue();
});

test('receipts without an open payment and unknown references get guidance', function () {
    telegramUpdate(['update_id' => 1, 'message' => ['chat' => ['id' => 999], 'text' => '/start pay_NOPE']])->assertOk();
    telegramUpdate(['update_id' => 2, 'message' => ['chat' => ['id' => 999], 'photo' => [['file_id' => 'x']]]])->assertOk();

    expect(SubscriptionPayment::count())->toBe(0);
    Http::assertNotSent(fn (Request $request) => str_ends_with($request->url(), '/sendPhoto'));
    Http::assertSentCount(2);
});

test('payments can be confirmed or granted from the command line', function () {
    $payment = startPayment($this->coach);

    $this->artisan('fitnessos:payments:confirm', ['reference' => $payment['reference']])->assertSuccessful();
    $this->artisan('fitnessos:payments:confirm', ['reference' => $payment['reference']])->assertFailed();
    $this->artisan('fitnessos:subscription:grant', ['email' => 'sara@example.com', 'plan' => 'pro', '--days' => 90])->assertSuccessful();
    $this->artisan('fitnessos:subscription:grant', ['email' => 'sara@example.com', 'plan' => 'gold'])->assertFailed();

    $subscription = $this->coach->subscription()->first();
    expect($subscription->plan)->toBe('pro');
    expect((int) round(now()->diffInDays($subscription->paid_until)))->toBe(120);
});

test('without the bot configured, coaches are told to contact support', function () {
    config(['fitnessos.telegram.bot_token' => null]);

    $this->actingAs($this->coach)->getJson('/fitnessos/billing')->assertJsonPath('telegram_enabled', false);
    $this->actingAs($this->coach)->postJson('/fitnessos/billing/payments', ['plan' => 'starter'])->assertStatus(503);

    $trainee = User::factory()->trainee()->create();
    $this->actingAs($trainee)->getJson('/fitnessos/billing')->assertForbidden();
});

test('Persian bot messages use Persian digits and the Jalali calendar', function () {
    if (! extension_loaded('intl')) {
        $this->markTestSkipped('intl extension not installed');
    }
    app()->setLocale('fa');
    $payment = startPayment($this->coach);

    telegramUpdate(['update_id' => 1, 'message' => ['chat' => ['id' => 42], 'text' => '/start pay_'.$payment['reference']]]);

    Http::assertSent(fn (Request $request) => str_ends_with($request->url(), '/sendMessage')
        && str_contains($request['text'], '۴۹۰٬۰۰۰')
        && str_contains($request['text'], '۳۰'));
});

test('an update Telegram delivers twice is only handled once', function () {
    $payment = startPayment($this->coach);
    $update = ['update_id' => 77, 'message' => ['chat' => ['id' => 555], 'text' => '/start pay_'.$payment['reference']]];

    telegramUpdate($update)->assertOk();
    telegramUpdate($update)->assertOk();

    Http::assertSentCount(1);
});
