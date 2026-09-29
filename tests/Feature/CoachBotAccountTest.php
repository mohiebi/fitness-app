<?php

use App\Models\SubscriptionPayment;
use App\Models\TelegramAccount;
use App\Models\User;
use App\Services\CoachingLifecycle;

beforeEach(function () {
    fakeTelegram();
    config(['fitnessos.plans.starter.price' => 490000, 'fitnessos.plans.pro.price' => 990000]);
    $this->coach = linkedCoach('4242');
});

test('the subscription screen shows the plan, the trainee count and renew options', function () {
    app(CoachingLifecycle::class)->startDirect($this->coach, User::factory()->trainee()->create());

    chatText('4242', '💳 Subscription');

    $text = telegramTexts('4242')[0];
    expect($text)->toContain('Free trial')->toContain('Pro plan')->toContain('Trainees: 1 of unlimited');
    expect(lastButtons('4242'))->toBe(['bill:pay:starter', 'bill:pay:pro']);
    expect(collect(telegramCalls())->last()[1]['reply_markup']['inline_keyboard'][0][0]['text'])->toContain('490,000');
});

test('a coach renews from Telegram and an admin approves the receipt', function () {
    chatTap('4242', 'bill:pay:starter', 61);

    $payment = SubscriptionPayment::query()->firstOrFail();
    expect($payment->plan)->toBe('starter')->and($payment->amount)->toBe(490000)->and($payment->telegram_chat_id)->toBe('4242');
    $texts = telegramTexts('4242');
    expect($texts[0])->toContain('490,000')->toContain('6037-9911-1111-2222')->toContain($payment->reference);
    expect(end($texts))->toContain('Waiting for your receipt');

    telegramUpdate(['message' => ['chat' => ['id' => 4242, 'type' => 'private'], 'photo' => [['file_id' => 'receipt-1']]]]);
    expect($payment->fresh()->status)->toBe(SubscriptionPayment::SUBMITTED);

    chatTap('-1001', 'pay:approve:'.$payment->id);
    expect($payment->fresh()->status)->toBe(SubscriptionPayment::PAID);
    expect($this->coach->subscription()->first()->plan)->toBe('starter');

    chatText('4242', '/billing');
    expect(collect(telegramTexts('4242'))->last())->toContain('Starter plan until');
});

test('renewing twice reuses the open payment and it can be canceled', function () {
    chatTap('4242', 'bill:pay:pro');
    chatTap('4242', 'bill:pay:pro');
    expect(SubscriptionPayment::count())->toBe(1);

    $payment = SubscriptionPayment::query()->firstOrFail();
    chatTap('4242', 'bill:cancel:'.$payment->id);

    expect($payment->fresh()->status)->toBe(SubscriptionPayment::CANCELED);
    expect(lastButtons('4242'))->toContain('bill:pay:starter');
});

test("a coach cannot cancel another coach's payment or pay for an unknown plan", function () {
    $other = User::factory()->publishedCoach()->create();
    $theirs = SubscriptionPayment::create(['coach_id' => $other->id, 'plan' => 'pro', 'amount' => 990000, 'period_days' => 30, 'status' => 'pending', 'method' => 'telegram', 'reference' => 'FOSOTHER1']);

    chatTap('4242', 'bill:cancel:'.$theirs->id);
    chatTap('4242', 'bill:pay:gold');

    expect($theirs->fresh()->status)->toBe('pending');
    expect(SubscriptionPayment::count())->toBe(1);
});

test('without a payment card the bot sends coaches to support', function () {
    config(['fitnessos.payment_card.number' => null]);

    chatText('4242', '/billing');

    expect(telegramTexts('4242')[0])->toContain('not available yet');
    expect(lastButtons('4242'))->not->toContain('bill:pay:starter');
});

test('a lapsed subscription is explained', function () {
    $this->coach->subscription()->update(['trial_ends_at' => now()->subDay()]);

    chatText('4242', '/billing');

    expect(telegramTexts('4242')[0])->toContain('subscription has ended');
});

test('settings toggle notification kinds and pick the summary hour', function () {
    chatText('4242', '⚙️ Settings');
    expect(lastButtons('4242'))->toContain('set:tgl:messages', 'set:hour:8');

    chatTap('4242', 'set:tgl:messages');
    chatTap('4242', 'set:tgl:bogus');
    chatTap('4242', 'set:hour:10');
    chatTap('4242', 'set:hour:11');

    $account = TelegramAccount::query()->firstOrFail();
    expect($account->wants('messages'))->toBeFalse()->and($account->wants('requests'))->toBeTrue()->and($account->digestHour())->toBe(10);

    chatTap('4242', 'set:tgl:digest');
    expect(lastButtons('4242'))->not->toContain('set:hour:8');
});

test('disconnecting from settings asks first', function () {
    chatTap('4242', 'set:ask');
    expect(TelegramAccount::query()->value('chat_id'))->toBe('4242');
    expect(lastButtons('4242'))->toBe(['set:unlink', 'set:show']);

    chatTap('4242', 'set:unlink');
    expect(TelegramAccount::query()->value('chat_id'))->toBeNull();

    chatText('4242', '/today');
    expect(collect(telegramTexts('4242'))->last())->toContain('Connect Telegram');
});
