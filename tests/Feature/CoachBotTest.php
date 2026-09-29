<?php

use App\Models\Coaching;
use App\Models\Exercise;
use App\Models\User;
use App\Models\WorkoutPlan;
use App\Services\CoachingLifecycle;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    fakeTelegram();
    $this->coach = linkedCoach('4242');
    $this->trainee = User::factory()->trainee()->create(['name' => 'Nima Rezaei']);
    $this->trainee->traineeProfile()->create(['goal' => 'fat-loss', 'experience' => 'beginner', 'limitations' => 'Right knee pain']);
});

function requestCoaching(User $trainee, User $coach, ?string $message = 'I want to lose fat'): Coaching
{
    return app(CoachingLifecycle::class)->request($trainee, $coach->coachProfile, $message);
}

/** The pop-up text shown for the last button tap. */
function lastToast(): ?string
{
    return collect(telegramCalls())->filter(fn ($call) => $call[0] === 'answerCallbackQuery')->last()[1]['text'] ?? null;
}

test('a linked coach gets the menu keyboard when they open the bot', function () {
    chatText('4242', '/start')->assertOk();

    [$method, $payload] = telegramCalls()[0];
    expect($method)->toBe('sendMessage');
    expect($payload['text'])->toContain('Sara Ahmadi');
    expect(collect($payload['reply_markup']['keyboard'])->flatten(1)->pluck('text')->all())
        ->toContain('📥 Requests', '💬 Messages', '👥 Trainees', '✅ Check-ins', '🤖 AI drafts', '💳 Subscription');
});

test('the bot only answers a coach in a private linked chat and points strangers to the dashboard', function () {
    chatText('999', '📥 Requests')->assertOk();
    chatTap('999', 'req:list')->assertOk();

    expect(telegramTexts('999')[0])->toContain('Connect Telegram');
    expect(lastToast())->toContain('Connect your coach account');
});

test('today lists what needs the coach, with buttons that open each list', function () {
    requestCoaching($this->trainee, $this->coach);

    chatText('4242', '/today');

    $text = telegramTexts('4242')[0];
    expect($text)->toContain('Coaching requests: 1');
    expect(lastButtons('4242'))->toContain('req:list');
});

test('today says all is well when nothing is waiting', function () {
    chatText('4242', '📊 Today');

    expect(telegramTexts('4242')[0])->toContain('All caught up');
});

test('today warns about a subscription that is ending', function () {
    $this->coach->subscription()->update(['trial_ends_at' => now()->addDays(2)]);

    chatText('4242', '/today');

    expect(telegramTexts('4242')[0])->toContain('subscription ends in 2 days');
    expect(lastButtons('4242'))->toContain('bill:show');
});

test('today flags trainees on a plan who have not trained for a week', function () {
    app(CoachingLifecycle::class)->startDirect($this->coach, $this->trainee);
    WorkoutPlan::create(['coach_id' => $this->coach->id, 'trainee_id' => $this->trainee->id, 'title' => 'Push Pull', 'status' => WorkoutPlan::ACTIVE, 'activated_at' => now()->subDays(20)]);

    chatText('4242', '/today');

    expect(telegramTexts('4242')[0])->toContain('No workout in 7 days')->toContain('Nima');
});

test('requests show the trainee intake and can be accepted from the message', function () {
    $coaching = requestCoaching($this->trainee, $this->coach);

    chatText('4242', '📥 Requests');
    $texts = telegramTexts('4242');
    expect($texts[1])->toContain('Nima Rezaei')->toContain('Lose fat')->toContain('Beginner')->toContain('Right knee pain')->toContain('I want to lose fat');
    expect(lastButtons('4242'))->toBe(['req:acc:'.$coaching->id, 'req:dec:'.$coaching->id]);

    chatTap('4242', 'req:acc:'.$coaching->id, 77)->assertOk();

    expect($coaching->fresh()->status)->toBe(Coaching::ACTIVE);
    expect($this->trainee->fresh()->coach_id)->toBe($this->coach->id);
    expect(collect(telegramCalls())->last(fn ($call) => $call[0] === 'editMessageText')[1])
        ->toMatchArray(['message_id' => 77])
        ->and(telegramTexts('4242'))->toContain('✅ You accepted <b>Nima Rezaei</b>.');
    expect($this->trainee->notifications()->where('data->kind', 'coaching_accepted')->exists())->toBeTrue();
});

test('requests can be declined', function () {
    $coaching = requestCoaching($this->trainee, $this->coach);

    chatTap('4242', 'req:dec:'.$coaching->id);

    expect($coaching->fresh()->status)->toBe(Coaching::DECLINED);
    expect($this->trainee->fresh()->coach_id)->toBeNull();
});

test('answering a request twice or with a lapsed subscription explains why', function () {
    $coaching = requestCoaching($this->trainee, $this->coach);

    $this->coach->subscription()->update(['trial_ends_at' => now()->subDay()]);
    chatTap('4242', 'req:acc:'.$coaching->id);
    expect(lastToast())->toContain('subscription has ended');
    expect($coaching->fresh()->status)->toBe(Coaching::REQUESTED);

    $this->coach->subscription()->update(['trial_ends_at' => now()->addDays(10)]);
    chatTap('4242', 'req:acc:'.$coaching->id);
    chatTap('4242', 'req:acc:'.$coaching->id);
    expect(lastToast())->toContain('no longer pending');
});

test('a coach cannot answer or open anything that belongs to another coach', function () {
    $other = User::factory()->publishedCoach()->create();
    $coaching = requestCoaching($this->trainee, $other);
    app(CoachingLifecycle::class)->startDirect($other, $stranger = User::factory()->trainee()->create(['name' => 'Someone Else']));

    chatTap('4242', 'req:acc:'.$coaching->id);
    expect($coaching->fresh()->status)->toBe(Coaching::REQUESTED);
    expect(lastToast())->toContain('not found');

    chatTap('4242', 'trn:open:'.$stranger->id);
    chatTap('4242', 'trn:plan:'.$stranger->id);
    expect(telegramTexts('4242'))->not->toContain('Someone Else');
    expect(lastToast())->toContain('not found');
});

test('trainees are listed, paged and opened as a card', function () {
    app(CoachingLifecycle::class)->startDirect($this->coach, $this->trainee);
    foreach (range(1, 9) as $number) {
        app(CoachingLifecycle::class)->startDirect($this->coach, User::factory()->trainee()->create(['name' => 'Trainee '.$number]));
    }

    chatText('4242', '👥 Trainees');
    expect(telegramTexts('4242')[0])->toContain('Your trainees: 10');
    expect(lastButtons('4242'))->toContain('trn:list:1')->not->toContain('trn:list:-1');

    chatTap('4242', 'trn:list:1');
    expect(lastButtons('4242'))->toContain('trn:list:0');

    DB::table('fitnessos_messages')->insert(['coach_id' => $this->coach->id, 'client_id' => $this->trainee->id, 'sender_id' => $this->trainee->id, 'body' => 'Can I train sore?', 'created_at' => now(), 'updated_at' => now()]);
    chatTap('4242', 'trn:open:'.$this->trainee->id);
    $card = collect(telegramTexts('4242'))->last();
    expect($card)->toContain('Nima Rezaei')->toContain('Lose fat')->toContain('No active plan')->toContain('Can I train sore?')->toContain('They wrote');
});

test('the active plan is shown day by day', function () {
    app(CoachingLifecycle::class)->startDirect($this->coach, $this->trainee);
    $exercise = Exercise::query()->whereNull('coach_id')->firstOrFail();
    $plan = WorkoutPlan::create(['coach_id' => $this->coach->id, 'trainee_id' => $this->trainee->id, 'title' => 'Push Pull', 'status' => WorkoutPlan::ACTIVE, 'activated_at' => now()]);
    $day = $plan->days()->create(['position' => 0, 'title' => 'Day A']);
    $day->exercises()->create(['exercise_id' => $exercise->id, 'position' => 0, 'sets' => 4, 'reps' => '8-10', 'target_weight_kg' => 60]);

    chatTap('4242', 'trn:plan:'.$this->trainee->id);

    $text = collect(telegramTexts('4242'))->last();
    expect($text)->toContain('Push Pull')->toContain('Day A')->toContain($exercise->name)->toContain('4×8-10')->toContain('60 kg');
});

test('unexpected text and cancel are handled gracefully', function () {
    chatText('4242', 'blah');
    chatText('4242', '/cancel');

    expect(telegramTexts('4242'))->toBe(['Use the menu below, or type /help.', 'Canceled.']);
});

test('Persian menu labels open the same screens', function () {
    if (! extension_loaded('intl')) {
        $this->markTestSkipped('intl extension not installed');
    }
    app()->setLocale('fa');
    requestCoaching($this->trainee, $this->coach);

    chatText('4242', '📥 درخواست‌ها');

    expect(telegramTexts('4242')[0])->toContain('۱');
});

test('messages waiting for a reply are listed and a typed reply goes to the trainee', function () {
    app(CoachingLifecycle::class)->startDirect($this->coach, $this->trainee);
    DB::table('fitnessos_messages')->insert([
        ['coach_id' => $this->coach->id, 'client_id' => $this->trainee->id, 'sender_id' => $this->coach->id, 'body' => 'How was leg day?', 'created_at' => now()->subHour(), 'updated_at' => now()->subHour()],
        ['coach_id' => $this->coach->id, 'client_id' => $this->trainee->id, 'sender_id' => $this->trainee->id, 'body' => 'Knee hurts a bit', 'created_at' => now(), 'updated_at' => now()],
    ]);

    chatText('4242', '💬 Messages');
    expect(lastButtons('4242'))->toBe(['inb:open:'.$this->trainee->id]);

    chatTap('4242', 'inb:open:'.$this->trainee->id);
    expect(collect(telegramTexts('4242'))->last())->toContain('How was leg day?')->toContain('Knee hurts a bit');
    expect(lastButtons('4242'))->toContain('inb:reply:'.$this->trainee->id);

    chatTap('4242', 'inb:reply:'.$this->trainee->id);
    expect(collect(telegramTexts('4242'))->last())->toContain('Type your reply');

    chatText('4242', 'Rest today and send me a photo of the knee.');

    $sent = DB::table('fitnessos_messages')->latest('id')->first();
    expect($sent->sender_id)->toBe($this->coach->id);
    expect($sent->client_id)->toBe($this->trainee->id);
    expect($sent->body)->toBe('Rest today and send me a photo of the knee.');
    expect(collect(telegramTexts('4242'))->last())->toContain('Sent to');
    expect($this->trainee->notifications()->where('data->kind', 'message')->exists())->toBeTrue();

    // The next message is not treated as another reply.
    chatText('4242', 'random');
    expect(DB::table('fitnessos_messages')->count())->toBe(3);
});

test('a pending reply is dropped by cancel, by another command and after a while', function () {
    app(CoachingLifecycle::class)->startDirect($this->coach, $this->trainee);

    chatTap('4242', 'inb:reply:'.$this->trainee->id);
    chatText('4242', '/cancel');
    chatText('4242', 'oops');
    expect(DB::table('fitnessos_messages')->count())->toBe(0);

    chatTap('4242', 'inb:reply:'.$this->trainee->id);
    chatText('4242', '📥 Requests');
    chatText('4242', 'oops');
    expect(DB::table('fitnessos_messages')->count())->toBe(0);

    chatTap('4242', 'inb:reply:'.$this->trainee->id);
    $this->travel(31)->minutes();
    chatText('4242', 'oops');
    expect(DB::table('fitnessos_messages')->count())->toBe(0);
});

test('a reply cannot be sent to a trainee who left the coach', function () {
    $coaching = app(CoachingLifecycle::class)->startDirect($this->coach, $this->trainee);

    chatTap('4242', 'inb:reply:'.$this->trainee->id);
    app(CoachingLifecycle::class)->end($coaching, $this->coach);
    chatText('4242', 'hello?');

    expect(DB::table('fitnessos_messages')->count())->toBe(0);
    expect(collect(telegramTexts('4242'))->last())->toContain('not found');
});

test('check-ins are listed, read and answered with typed feedback', function () {
    app(CoachingLifecycle::class)->startDirect($this->coach, $this->trainee);
    $id = DB::table('fitnessos_checkins')->insertGetId([
        'client_id' => $this->trainee->id, 'coach_id' => $this->coach->id, 'weight_kg' => 81.5, 'sleep_hours' => 6.5, 'energy' => 7,
        'reflection' => 'Good week, missed one session', 'adjustments' => 'More cardio', 'status' => 'Pending', 'created_at' => now(), 'updated_at' => now(),
    ]);

    chatText('4242', '✅ Check-ins');
    expect(lastButtons('4242'))->toBe(['chk:open:'.$id]);

    chatTap('4242', 'chk:open:'.$id);
    expect(collect(telegramTexts('4242'))->last())->toContain('81.5 kg')->toContain('Energy: 7/10')->toContain('missed one session')->toContain('More cardio');
    expect(lastButtons('4242'))->toContain('chk:fb:'.$id);

    chatTap('4242', 'chk:fb:'.$id);
    chatText('4242', 'Nice work. Add two cardio sessions next week.');

    expect(DB::table('fitnessos_checkins')->where('id', $id)->value('status'))->toBe('Reviewed');
    expect(DB::table('fitnessos_messages')->latest('id')->value('body'))->toBe('Nice work. Add two cardio sessions next week.');
    expect($this->trainee->notifications()->where('data->kind', 'checkin_reviewed')->exists())->toBeTrue();

    chatTap('4242', 'chk:open:'.$id);
    expect(lastButtons('4242'))->not->toContain('chk:fb:'.$id);
});

test('check-ins of another coach are not reachable', function () {
    $other = User::factory()->publishedCoach()->create();
    app(CoachingLifecycle::class)->startDirect($other, $this->trainee);
    $id = DB::table('fitnessos_checkins')->insertGetId(['client_id' => $this->trainee->id, 'coach_id' => $other->id, 'status' => 'Pending', 'created_at' => now(), 'updated_at' => now()]);

    chatTap('4242', 'chk:open:'.$id);
    chatTap('4242', 'chk:fb:'.$id);

    expect(lastToast())->toContain('not found');
    expect(DB::table('fitnessos_checkins')->where('id', $id)->value('status'))->toBe('Pending');
});
