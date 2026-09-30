<?php

use App\Services\Ai\AssistantUnavailable;
use App\Services\Ai\OpenAiDraftModel;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;

beforeEach(fn () => app()->setLocale('en'));

function openAiReply(array $overrides = []): array
{
    return array_replace_recursive([
        'model' => 'gpt-4o-2026',
        'choices' => [['finish_reason' => 'stop', 'message' => ['role' => 'assistant', 'content' => json_encode(['message' => 'سلام نیما!'], JSON_UNESCAPED_UNICODE)]]],
        'usage' => ['prompt_tokens' => 321, 'completion_tokens' => 45],
    ], $overrides);
}

function openAiModel(string $mode = OpenAiDraftModel::SCHEMA_MODE): OpenAiDraftModel
{
    return new OpenAiDraftModel('https://gateway.example.test/v1/', 'sk-test', 'gpt-4o', $mode);
}

$schema = ['type' => 'object', 'properties' => ['message' => ['type' => 'string']], 'required' => ['message'], 'additionalProperties' => false];

test('it asks the endpoint for a schema-constrained reply with the key and model', function () use ($schema) {
    Http::fake(['gateway.example.test/*' => Http::response(openAiReply())]);

    $result = openAiModel()->generate('You draft messages.', 'Say hi to Nima.', $schema);

    expect($result->data)->toBe(['message' => 'سلام نیما!']);
    expect($result->model)->toBe('gpt-4o-2026')->and($result->inputTokens)->toBe(321)->and($result->outputTokens)->toBe(45);

    Http::assertSent(function (Request $request) use ($schema) {
        return $request->url() === 'https://gateway.example.test/v1/chat/completions'
            && $request->hasHeader('Authorization', 'Bearer sk-test')
            && $request['model'] === 'gpt-4o'
            && $request['messages'][0] === ['role' => 'system', 'content' => 'You draft messages.']
            && $request['messages'][1] === ['role' => 'user', 'content' => 'Say hi to Nima.']
            && $request['response_format']['type'] === 'json_schema'
            && $request['response_format']['json_schema']['strict'] === true
            && $request['response_format']['json_schema']['schema'] === $schema;
    });
});

test('plain JSON mode describes the schema in the prompt for gateways without structured outputs', function () use ($schema) {
    Http::fake(['gateway.example.test/*' => Http::response(openAiReply())]);

    openAiModel(OpenAiDraftModel::OBJECT_MODE)->generate('You draft messages.', 'Hi', $schema);

    Http::assertSent(fn (Request $request) => $request['response_format'] === ['type' => 'json_object']
        && str_contains($request['messages'][0]['content'], 'You draft messages.')
        && str_contains($request['messages'][0]['content'], '"additionalProperties":false'));
});

test('JSON wrapped in a markdown fence is still understood', function () use ($schema) {
    Http::fake(['gateway.example.test/*' => Http::response(openAiReply(['choices' => [['message' => ['content' => "```json\n{\"message\": \"Hi\"}\n```"]]]]))]);

    expect(openAiModel()->generate('s', 'p', $schema)->data)->toBe(['message' => 'Hi']);
});

test('failures become messages a coach can read', function (int $status, string $expected) use ($schema) {
    Http::fake(['gateway.example.test/*' => Http::response(['error' => ['message' => 'nope']], $status)]);

    expect(fn () => openAiModel()->generate('s', 'p', $schema))->toThrow(AssistantUnavailable::class, $expected);
})->with([
    'bad key' => [401, 'not set up correctly'],
    'forbidden' => [403, 'not set up correctly'],
    'rate limited' => [429, 'busy'],
    'rejected' => [400, 'could not write'],
    'server error' => [503, 'temporarily unavailable'],
]);

test('refusals, cut-off drafts, empty and non-JSON replies are handled', function (array $body, string $expected) use ($schema) {
    Http::fake(['gateway.example.test/*' => Http::response($body)]);

    expect(fn () => openAiModel()->generate('s', 'p', $schema))->toThrow(AssistantUnavailable::class, $expected);
})->with([
    'refusal' => fn () => [openAiReply(['choices' => [['message' => ['refusal' => 'I cannot help with that.', 'content' => null]]]]), 'declined'],
    'cut off' => fn () => [openAiReply(['choices' => [['finish_reason' => 'length']]]), 'too long'],
    'not JSON' => fn () => [openAiReply(['choices' => [['message' => ['content' => 'just words']]]]), 'could not write'],
    'no choices' => fn () => [['choices' => []], 'could not write'],
]);

test('an unreachable endpoint is reported as temporarily unavailable', function () use ($schema) {
    Http::fake(fn () => throw new ConnectionException('timeout'));

    expect(fn () => openAiModel()->generate('s', 'p', $schema))->toThrow(AssistantUnavailable::class, 'temporarily unavailable');
});
