<?php

use App\Models\AiDraft;
use App\Models\Coaching;
use App\Models\Exercise;
use App\Models\User;
use App\Models\WorkoutPlan;
use App\Services\Ai\AssistantUnavailable;
use App\Services\Ai\CoachAssistant;
use App\Services\Ai\DraftModel;
use App\Services\Ai\DraftResult;
use App\Services\CoachingLifecycle;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * A stand-in for Claude that records what it was asked and returns fixed output.
 */
function fakeDraftModel(array $data = ['message' => 'Great week, Nima!'], ?Throwable $error = null): object
{
    $fake = new class($data, $error) implements DraftModel
    {
        /** @var list<array{system: string, prompt: string, schema: array<string, mixed>}> */
        public array $calls = [];

        public function __construct(public array $data, public ?Throwable $error) {}

        public function generate(string $system, string $prompt, array $schema): DraftResult
        {
            $this->calls[] = compact('system', 'prompt', 'schema');
            if ($this->error) {
                throw $this->error;
            }

            return new DraftResult($this->data, 'claude-opus-5', 1200, 150);
        }
    };
    app()->instance(DraftModel::class, $fake);

    return $fake;
}

beforeEach(function () {
    $this->coach = User::factory()->publishedCoach()->create(['name' => 'Sara Ahmadi']);
    $this->trainee = User::factory()->trainee()->create(['name' => 'Nima Rezaei', 'email' => 'nima-secret@example.com']);
    $this->trainee->traineeProfile()->create(['goal' => 'fat-loss', 'experience' => 'beginner', 'limitations' => 'Right knee pain on deep squats']);
    app(CoachingLifecycle::class)->startDirect($this->coach, $this->trainee);
    $this->trainee->refresh();
});

test('a reply draft is stored for the coach and sends nothing to the trainee', function () {
    $fake = fakeDraftModel();
    DB::table('fitnessos_messages')->insert(['coach_id' => $this->coach->id, 'client_id' => $this->trainee->id, 'sender_id' => $this->trainee->id, 'body' => 'Should I train with sore legs?', 'created_at' => now(), 'updated_at' => now()]);

    $draft = app(CoachAssistant::class)->draft($this->coach, AiDraft::REPLY, $this->trainee->id, instruction: 'Keep it short');

    expect($draft->status)->toBe(AiDraft::PENDING);
    expect($draft->content)->toBe('Great week, Nima!');
    expect($draft->input_tokens)->toBe(1200);
    expect(DB::table('fitnessos_messages')->count())->toBe(1);

    $call = $fake->calls[0];
    expect($call['prompt'])
        ->toContain('Should I train with sore legs?')
        ->toContain('Right knee pain on deep squats')
        ->toContain('Keep it short')
        ->toContain('<trainee_information>')
        ->not->toContain('nima-secret@example.com')
        ->not->toContain('Rezaei');
    expect($call['system'])->toContain('never talk to the trainee directly');
});

test('approving a reply sends the coach-edited text as a coach message', function () {
    fakeDraftModel();
    $assistant = app(CoachAssistant::class);
    $draft = $assistant->draft($this->coach, AiDraft::REPLY, $this->trainee->id);

    $assistant->approve($this->coach, $draft, 'Edited by Sara: rest today, easy walk tomorrow.');

    $message = DB::table('fitnessos_messages')->latest('id')->first();
    expect($message->body)->toBe('Edited by Sara: rest today, easy walk tomorrow.');
    expect($message->sender_id)->toBe($this->coach->id);
    expect($draft->fresh()->status)->toBe(AiDraft::APPROVED);
    expect($draft->fresh()->result_id)->toBe($message->id);

    expect(fn () => $assistant->approve($this->coach, $draft->fresh()))->toThrow(ValidationException::class);
});

test('discarded drafts never reach the trainee', function () {
    fakeDraftModel();
    $assistant = app(CoachAssistant::class);
    $draft = $assistant->draft($this->coach, AiDraft::REPLY, $this->trainee->id);

    $assistant->discard($this->coach, $draft);

    expect($draft->fresh()->status)->toBe(AiDraft::DISCARDED);
    expect(DB::table('fitnessos_messages')->count())->toBe(0);
    expect(fn () => $assistant->approve($this->coach, $draft->fresh()))->toThrow(ValidationException::class);
});

test('check-in feedback drafts review the check-in only after approval', function () {
    fakeDraftModel(['message' => 'Nice consistency this week.']);
    $checkinId = DB::table('fitnessos_checkins')->insertGetId([
        'client_id' => $this->trainee->id, 'coach_id' => $this->coach->id, 'weight_kg' => 84.2, 'energy' => 6,
        'reflection' => 'Missed one workout', 'status' => 'Pending', 'created_at' => now(), 'updated_at' => now(),
    ]);
    $assistant = app(CoachAssistant::class);

    $draft = $assistant->draft($this->coach, AiDraft::CHECKIN_FEEDBACK, $this->trainee->id, $checkinId);
    expect(DB::table('fitnessos_checkins')->value('status'))->toBe('Pending');

    $assistant->approve($this->coach, $draft);
    expect(DB::table('fitnessos_checkins')->value('status'))->toBe('Reviewed');
    expect(DB::table('fitnessos_messages')->value('body'))->toBe('Nice consistency this week.');
});

test('plan drafts keep only library exercises and become a draft plan on approval', function () {
    $squat = Exercise::query()->where('name_en', 'Goblet squat')->value('id');
    $row = Exercise::query()->where('name_en', 'Seated cable row')->value('id');
    fakeDraftModel([
        'title' => 'Month one',
        'notes' => 'Warm up first.',
        'days' => [
            ['title' => 'Day A', 'exercises' => [
                ['exercise_id' => $squat, 'sets' => 3, 'reps' => '10-12', 'rest_seconds' => 90, 'target_weight_kg' => 12, 'notes' => 'Box depth for the knee'],
                ['exercise_id' => 999999, 'sets' => 3, 'reps' => '10', 'rest_seconds' => 60, 'target_weight_kg' => 0, 'notes' => ''],
            ]],
            ['title' => 'Day B', 'exercises' => [
                ['exercise_id' => $row, 'sets' => 50, 'reps' => '12', 'rest_seconds' => 5000, 'target_weight_kg' => 0, 'notes' => ''],
            ]],
            ['title' => 'Empty', 'exercises' => []],
        ],
    ]);
    $assistant = app(CoachAssistant::class);

    $draft = $assistant->draft($this->coach, AiDraft::PLAN, $this->trainee->id);
    expect($draft->plan['days'])->toHaveCount(2);
    expect($draft->plan['days'][0]['exercises'])->toHaveCount(1);
    expect($draft->plan['days'][1]['exercises'][0])->toMatchArray(['sets' => 20, 'rest_seconds' => 900, 'target_weight_kg' => null]);
    expect(WorkoutPlan::count())->toBe(0);

    $assistant->approve($this->coach, $draft, title: 'Nima — month one');

    $plan = WorkoutPlan::query()->firstOrFail();
    expect($plan->status)->toBe(WorkoutPlan::DRAFT);
    expect($plan->title)->toBe('Nima — month one');
    expect($plan->trainee_id)->toBe($this->trainee->id);
    expect($plan->days()->count())->toBe(2);
});

test('failures are recorded and the daily limit is enforced', function () {
    fakeDraftModel(error: new AssistantUnavailable('The AI assistant is busy.'));
    $assistant = app(CoachAssistant::class);

    expect(fn () => $assistant->draft($this->coach, AiDraft::REPLY, $this->trainee->id))->toThrow(AssistantUnavailable::class);
    expect(AiDraft::query()->value('status'))->toBe(AiDraft::FAILED);

    config(['services.anthropic.daily_drafts_per_coach' => 1]);
    expect(fn () => $assistant->draft($this->coach, AiDraft::REPLY, $this->trainee->id))->toThrow(ValidationException::class);
});

test('coaches can only draft for current trainees and approve their own drafts', function () {
    fakeDraftModel();
    $assistant = app(CoachAssistant::class);
    $other = User::factory()->publishedCoach()->create();
    $draft = $assistant->draft($this->coach, AiDraft::REPLY, $this->trainee->id);

    expect(fn () => $assistant->draft($other, AiDraft::REPLY, $this->trainee->id))->toThrow(ModelNotFoundException::class);
    expect(fn () => $assistant->approve($other, $draft))->toThrow(HttpException::class);

    app(CoachingLifecycle::class)->end(Coaching::query()->firstOrFail(), $this->trainee);
    expect(fn () => $assistant->approve($this->coach, $draft))->toThrow(ModelNotFoundException::class);
    expect(DB::table('fitnessos_messages')->count())->toBe(0);
});

test('without an API key the assistant is disabled', function () {
    config(['services.anthropic.api_key' => null]);

    expect(app(CoachAssistant::class)->enabled())->toBeFalse();
    expect(fn () => app(CoachAssistant::class)->draft($this->coach, AiDraft::REPLY, $this->trainee->id))->toThrow(AssistantUnavailable::class);
});

test('a configured API key enables the Claude model', function () {
    app()->forgetInstance(DraftModel::class);
    config(['services.anthropic.api_key' => 'test-key', 'services.anthropic.base_url' => 'https://gateway.example.test']);

    expect(app(DraftModel::class))->toBeInstanceOf(App\Services\Ai\ClaudeDraftModel::class);
    expect(app(CoachAssistant::class)->enabled())->toBeTrue();
});
