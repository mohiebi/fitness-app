<?php

use App\Models\AiDraft;
use App\Models\Exercise;
use App\Models\User;
use App\Models\WorkoutPlan;
use App\Services\Ai\AssistantUnavailable;
use App\Services\CoachingLifecycle;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    fakeTelegram();
    $this->coach = linkedCoach('4242');
    $this->trainee = User::factory()->trainee()->create(['name' => 'Nima Rezaei']);
    $this->trainee->traineeProfile()->create(['goal' => 'fat-loss', 'experience' => 'beginner']);
    app(CoachingLifecycle::class)->startDirect($this->coach, $this->trainee);
});

test('the assistant drafts a reply and nothing is sent until the coach taps Send', function () {
    $fake = fakeDraftModel(['message' => 'Rest today, Nima. Send me a photo of the knee.']);

    chatTap('4242', 'ai:reply:'.$this->trainee->id)->assertOk();

    $draft = AiDraft::query()->firstOrFail();
    expect($draft->status)->toBe(AiDraft::PENDING);
    expect($draft->content)->toBe('Rest today, Nima. Send me a photo of the knee.');
    expect(count($fake->calls))->toBe(1);
    expect(DB::table('fitnessos_messages')->count())->toBe(0);

    $texts = telegramTexts('4242');
    expect($texts[0])->toContain('Drafting');
    expect(collect(telegramCalls())->last(fn ($call) => $call[0] === 'editMessageText')[1])->toMatchArray(['message_id' => 900]);
    expect(end($texts))->toContain('Rest today, Nima')->toContain('Nothing is sent until you approve');
    expect(lastButtons('4242'))->toBe(['ai:send:'.$draft->id, 'ai:edit:'.$draft->id, 'ai:redo:'.$draft->id, 'ai:drop:'.$draft->id]);

    chatTap('4242', 'ai:send:'.$draft->id);

    $sent = DB::table('fitnessos_messages')->first();
    expect($sent->body)->toBe('Rest today, Nima. Send me a photo of the knee.');
    expect($sent->sender_id)->toBe($this->coach->id);
    expect($draft->fresh()->status)->toBe(AiDraft::APPROVED);

    // Tapping Send again does nothing more.
    chatTap('4242', 'ai:send:'.$draft->id);
    expect(DB::table('fitnessos_messages')->count())->toBe(1);
});

test('the coach can rewrite a draft before it is sent', function () {
    fakeDraftModel(['message' => 'First version']);
    chatTap('4242', 'ai:reply:'.$this->trainee->id);
    $draft = AiDraft::query()->firstOrFail();

    chatTap('4242', 'ai:edit:'.$draft->id);
    chatText('4242', 'My own wording instead.');

    expect(DB::table('fitnessos_messages')->count())->toBe(0);
    expect($draft->fresh()->content)->toBe('My own wording instead.');
    expect(collect(telegramTexts('4242'))->last())->toContain('My own wording instead.');

    chatTap('4242', 'ai:send:'.$draft->id);
    expect(DB::table('fitnessos_messages')->value('body'))->toBe('My own wording instead.');
});

test('redo with a note replaces the draft using the coach instruction', function () {
    $fake = fakeDraftModel(['message' => 'Long version']);
    chatTap('4242', 'ai:reply:'.$this->trainee->id);
    $first = AiDraft::query()->firstOrFail();

    $fake->data = ['message' => 'Short one'];
    chatTap('4242', 'ai:redo:'.$first->id);
    chatText('4242', 'make it shorter');

    expect($fake->calls[1]['prompt'])->toContain('make it shorter');
    expect($first->fresh()->status)->toBe(AiDraft::DISCARDED);
    $second = AiDraft::query()->where('status', AiDraft::PENDING)->firstOrFail();
    expect($second->content)->toBe('Short one');
    expect($second->instruction)->toBe('make it shorter');
    expect(DB::table('fitnessos_messages')->count())->toBe(0);
});

test('a draft can be discarded', function () {
    fakeDraftModel();
    chatTap('4242', 'ai:reply:'.$this->trainee->id);
    $draft = AiDraft::query()->firstOrFail();

    chatTap('4242', 'ai:drop:'.$draft->id);

    expect($draft->fresh()->status)->toBe(AiDraft::DISCARDED);
    expect(DB::table('fitnessos_messages')->count())->toBe(0);
});

test('feedback drafts answer a check-in and mark it reviewed on approval', function () {
    $checkin = DB::table('fitnessos_checkins')->insertGetId(['client_id' => $this->trainee->id, 'coach_id' => $this->coach->id, 'status' => 'Pending', 'reflection' => 'Tired week', 'created_at' => now(), 'updated_at' => now()]);
    $fake = fakeDraftModel(['message' => 'Sleep more this week.']);

    chatTap('4242', 'ai:fb:'.$checkin);

    expect($fake->calls[0]['prompt'])->toContain('Tired week');
    $draft = AiDraft::query()->firstOrFail();
    expect($draft->kind)->toBe(AiDraft::CHECKIN_FEEDBACK)->and($draft->source_id)->toBe($checkin);
    expect(DB::table('fitnessos_checkins')->value('status'))->toBe('Pending');

    chatTap('4242', 'ai:send:'.$draft->id);
    expect(DB::table('fitnessos_checkins')->value('status'))->toBe('Reviewed');
    expect(DB::table('fitnessos_messages')->value('body'))->toBe('Sleep more this week.');
});

test('a drafted plan is saved as a draft or activated only when the coach chooses', function () {
    $exercise = Exercise::query()->whereNull('coach_id')->firstOrFail();
    fakeDraftModel(['title' => 'Month one', 'notes' => 'Warm up first.', 'days' => [
        ['title' => 'Day A', 'exercises' => [['exercise_id' => $exercise->id, 'sets' => 3, 'reps' => '10', 'rest_seconds' => 60, 'target_weight_kg' => 20, 'notes' => '']]],
    ]]);

    chatTap('4242', 'ai:plan:'.$this->trainee->id);
    $draft = AiDraft::query()->firstOrFail();
    expect(collect(telegramTexts('4242'))->last())->toContain('Month one')->toContain($exercise->name)->toContain('3×10')->toContain('20 kg');
    expect(lastButtons('4242'))->toContain('ai:save:'.$draft->id, 'ai:go:'.$draft->id);
    expect(WorkoutPlan::count())->toBe(0);

    chatTap('4242', 'ai:save:'.$draft->id);
    expect(WorkoutPlan::query()->value('status'))->toBe(WorkoutPlan::DRAFT);
    expect($this->trainee->notifications()->where('data->kind', 'plan_activated')->exists())->toBeFalse();

    chatTap('4242', 'ai:plan:'.$this->trainee->id);
    $second = AiDraft::query()->where('status', AiDraft::PENDING)->firstOrFail();
    chatTap('4242', 'ai:go:'.$second->id);

    $active = WorkoutPlan::query()->where('status', WorkoutPlan::ACTIVE)->firstOrFail();
    expect($active->trainee_id)->toBe($this->trainee->id);
    expect($this->trainee->notifications()->where('data->kind', 'plan_activated')->exists())->toBeTrue();
});

test('pending drafts, including ones made on the website, are listed for approval', function () {
    fakeDraftModel();
    chatTap('4242', 'ai:reply:'.$this->trainee->id);
    $draft = AiDraft::query()->firstOrFail();

    chatText('4242', '🤖 AI drafts');
    expect(lastButtons('4242'))->toBe(['ai:open:'.$draft->id]);

    chatTap('4242', 'ai:open:'.$draft->id);
    expect(collect(telegramTexts('4242'))->last())->toContain('Draft reply to');
});

test('assistant problems are explained instead of failing silently', function () {
    fakeDraftModel(error: new AssistantUnavailable('The AI assistant is busy.'));
    chatTap('4242', 'ai:reply:'.$this->trainee->id);
    expect(collect(telegramTexts('4242'))->last())->toContain('The AI assistant is busy.');

    fakeDraftModel();
    config(['services.ai.daily_drafts_per_coach' => 0]);
    chatTap('4242', 'ai:reply:'.$this->trainee->id);
    expect(collect(telegramTexts('4242'))->last())->toContain("used today's AI drafts");
    expect(AiDraft::where('status', AiDraft::PENDING)->count())->toBe(0);
});

test("a coach cannot use another coach's drafts or draft for someone else's trainee", function () {
    $other = User::factory()->publishedCoach()->create();
    $stranger = User::factory()->trainee()->create();
    app(CoachingLifecycle::class)->startDirect($other, $stranger);
    $fake = fakeDraftModel();
    $theirs = AiDraft::create(['coach_id' => $other->id, 'trainee_id' => $stranger->id, 'kind' => AiDraft::REPLY, 'status' => AiDraft::PENDING, 'content' => 'secret']);

    chatTap('4242', 'ai:open:'.$theirs->id);
    chatTap('4242', 'ai:send:'.$theirs->id);
    chatTap('4242', 'ai:reply:'.$stranger->id);

    expect(count($fake->calls))->toBe(0);
    expect($theirs->fresh()->status)->toBe(AiDraft::PENDING);
    expect(DB::table('fitnessos_messages')->count())->toBe(0);
    expect(implode("\n", telegramTexts('4242')))->not->toContain('secret');
});
