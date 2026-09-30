<?php

use App\Models\AiDraft;
use App\Models\User;
use App\Services\Ai\AssistantUnavailable;
use App\Services\Ai\DraftModel;
use App\Services\Ai\DraftResult;
use App\Services\CoachingLifecycle;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    $this->coach = User::factory()->publishedCoach()->create();
    $this->trainee = User::factory()->trainee()->create();
    app(CoachingLifecycle::class)->startDirect($this->coach, $this->trainee);

    app()->instance(DraftModel::class, new class implements DraftModel
    {
        public function generate(string $system, string $prompt, array $schema): DraftResult
        {
            return new DraftResult(['message' => 'How did the squats feel?'], 'claude-opus-5');
        }
    });
});

test('a coach drafts, edits and approves a reply over HTTP', function () {
    $this->actingAs($this->coach)->getJson('/fitnessos/ai/status')->assertOk()->assertJsonPath('enabled', true);

    $draft = $this->actingAs($this->coach)->postJson('/fitnessos/ai/drafts', [
        'kind' => 'reply',
        'trainee_id' => $this->trainee->id,
        'instruction' => 'Ask about the squats',
    ])->assertCreated()->assertJsonPath('status', 'pending')->json();

    $this->actingAs($this->coach)->getJson('/fitnessos/ai/drafts')->assertJsonCount(1)->assertJsonPath('0.content', 'How did the squats feel?');

    $this->actingAs($this->coach)->postJson("/fitnessos/ai/drafts/{$draft['id']}/approve", ['content' => 'How did the squats feel on your knee?'])
        ->assertOk()->assertJsonPath('draft.status', 'approved');

    expect(DB::table('fitnessos_messages')->value('body'))->toBe('How did the squats feel on your knee?');
    $this->actingAs($this->coach)->getJson('/fitnessos/ai/drafts')->assertJsonCount(0);
    $this->actingAs($this->coach)->getJson('/fitnessos/ai/drafts?status=approved')->assertJsonCount(1);
});

test('trainees cannot reach any assistant endpoint', function () {
    $draft = AiDraft::create(['coach_id' => $this->coach->id, 'trainee_id' => $this->trainee->id, 'kind' => 'reply', 'status' => 'pending', 'content' => 'Hi']);
    $trainee = $this->trainee->fresh();

    $this->actingAs($trainee)->getJson('/fitnessos/ai/status')->assertForbidden();
    $this->actingAs($trainee)->getJson('/fitnessos/ai/drafts')->assertForbidden();
    $this->actingAs($trainee)->postJson('/fitnessos/ai/drafts', ['kind' => 'reply', 'trainee_id' => $trainee->id])->assertForbidden();
    $this->actingAs($trainee)->postJson("/fitnessos/ai/drafts/{$draft->id}/approve")->assertForbidden();
    $this->actingAs($trainee)->postJson("/fitnessos/ai/drafts/{$draft->id}/discard")->assertForbidden();

    expect(DB::table('fitnessos_messages')->count())->toBe(0);
    $this->actingAs($trainee)->getJson('/fitnessos/messages')->assertOk()->assertJsonCount(0);
});

test('other coaches cannot see, approve or discard a coach\'s drafts', function () {
    $draft = AiDraft::create(['coach_id' => $this->coach->id, 'trainee_id' => $this->trainee->id, 'kind' => 'reply', 'status' => 'pending', 'content' => 'Hi']);
    $other = User::factory()->publishedCoach()->create();

    $this->actingAs($other)->getJson('/fitnessos/ai/drafts')->assertJsonCount(0);
    $this->actingAs($other)->postJson("/fitnessos/ai/drafts/{$draft->id}/approve")->assertNotFound();
    $this->actingAs($other)->postJson("/fitnessos/ai/drafts/{$draft->id}/discard")->assertNotFound();
    $this->actingAs($other)->postJson('/fitnessos/ai/drafts', ['kind' => 'reply', 'trainee_id' => $this->trainee->id])->assertNotFound();
});

test('assistant failures return 503 with a readable message, and bad input is rejected', function () {
    app()->instance(DraftModel::class, new class implements DraftModel
    {
        public function generate(string $system, string $prompt, array $schema): DraftResult
        {
            throw new AssistantUnavailable('The AI assistant is busy. Please try again in a minute.');
        }
    });

    $this->actingAs($this->coach)->postJson('/fitnessos/ai/drafts', ['kind' => 'reply', 'trainee_id' => $this->trainee->id])
        ->assertStatus(503)->assertJsonPath('message', 'The AI assistant is busy. Please try again in a minute.');

    $this->actingAs($this->coach)->postJson('/fitnessos/ai/drafts', ['kind' => 'essay', 'trainee_id' => $this->trainee->id])
        ->assertJsonValidationErrors('kind');
    $this->actingAs($this->coach)->postJson('/fitnessos/ai/drafts', ['kind' => 'checkin_feedback', 'trainee_id' => $this->trainee->id])
        ->assertJsonValidationErrors('checkin_id');
});

test('the status endpoint reports a disabled assistant without an API key', function () {
    app()->forgetInstance(DraftModel::class);
    config(['services.openai.api_key' => '', 'services.anthropic.api_key' => '']);

    $this->actingAs($this->coach)->getJson('/fitnessos/ai/status')->assertJsonPath('enabled', false);
});
