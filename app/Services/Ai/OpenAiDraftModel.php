<?php

namespace App\Services\Ai;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Drafts through any OpenAI-compatible Chat Completions endpoint: OpenAI
 * itself, or a gateway that speaks the same API. The endpoint is a base
 * URL plus an API key, so a server that can't reach OpenAI directly can
 * point at a gateway instead.
 *
 * By default the reply is constrained with a JSON schema (structured
 * outputs). Some gateways only support plain JSON mode; set the mode to
 * "json_object" and the schema is described in the prompt instead.
 */
class OpenAiDraftModel implements DraftModel
{
    public const SCHEMA_MODE = 'json_schema';

    public const OBJECT_MODE = 'json_object';

    public function __construct(
        private string $baseUrl,
        private string $apiKey,
        private string $model,
        private string $mode = self::SCHEMA_MODE,
    ) {}

    public function generate(string $system, string $prompt, array $schema): DraftResult
    {
        try {
            $response = $this->http()->post('chat/completions', [
                'model' => $this->model,
                'messages' => [
                    ['role' => 'system', 'content' => $this->mode === self::OBJECT_MODE ? $this->withSchema($system, $schema) : $system],
                    ['role' => 'user', 'content' => $prompt],
                ],
                'response_format' => $this->mode === self::OBJECT_MODE
                    ? ['type' => 'json_object']
                    : ['type' => 'json_schema', 'json_schema' => ['name' => 'draft', 'strict' => true, 'schema' => $schema]],
            ]);
        } catch (ConnectionException $e) {
            Log::warning('AI assistant unreachable', ['error' => $e->getMessage()]);
            throw new AssistantUnavailable(__('The AI assistant is temporarily unavailable. Please try again.'), previous: $e);
        }

        if ($response->failed()) {
            $this->fail($response->status(), (string) ($response->json('error.message') ?? $response->body()));
        }

        $choice = $response->json('choices.0');
        $message = is_array($choice) ? ($choice['message'] ?? null) : null;

        if (! is_array($message)) {
            throw new AssistantUnavailable(__('The AI assistant could not write this draft.'));
        }

        if (! empty($message['refusal'])) {
            throw new AssistantUnavailable(__('The AI assistant declined to write this draft. Please write it yourself.'));
        }

        if (($choice['finish_reason'] ?? null) === 'length') {
            throw new AssistantUnavailable(__('The draft was too long. Try a narrower instruction.'));
        }

        $data = json_decode($this->stripFence((string) ($message['content'] ?? '')), true);
        if (! is_array($data)) {
            throw new AssistantUnavailable(__('The AI assistant could not write this draft.'));
        }

        return new DraftResult(
            data: $data,
            model: (string) ($response->json('model') ?? $this->model),
            inputTokens: (int) $response->json('usage.prompt_tokens', 0),
            outputTokens: (int) $response->json('usage.completion_tokens', 0),
        );
    }

    /**
     * Map an HTTP failure to a message that is safe to show a coach.
     */
    private function fail(int $status, string $detail): never
    {
        if ($status === 401 || $status === 403) {
            Log::error('AI assistant authentication failed', ['status' => $status, 'error' => $detail]);
            throw new AssistantUnavailable(__('The AI assistant is not set up correctly. Please contact support.'));
        }

        if ($status === 429) {
            throw new AssistantUnavailable(__('The AI assistant is busy. Please try again in a minute.'));
        }

        if ($status >= 400 && $status < 500) {
            Log::error('AI assistant request rejected', ['status' => $status, 'error' => $detail]);
            throw new AssistantUnavailable(__('The AI assistant could not write this draft.'));
        }

        Log::warning('AI assistant unavailable', ['status' => $status, 'error' => $detail]);
        throw new AssistantUnavailable(__('The AI assistant is temporarily unavailable. Please try again.'));
    }

    /**
     * Plain JSON mode doesn't enforce a schema, so describe it in the prompt.
     *
     * @param  array<string, mixed>  $schema
     */
    private function withSchema(string $system, array $schema): string
    {
        return $system."\n\nReply with a single JSON object and nothing else. It must match this JSON Schema:\n".json_encode($schema, JSON_UNESCAPED_UNICODE);
    }

    /**
     * Some gateways wrap JSON in a markdown code fence.
     */
    private function stripFence(string $content): string
    {
        $content = trim($content);

        return (string) preg_replace('/^```(?:json)?\s*(.*?)\s*```$/s', '$1', $content);
    }

    private function http(): PendingRequest
    {
        return Http::baseUrl(rtrim($this->baseUrl, '/').'/')
            ->withToken($this->apiKey)
            ->acceptJson()
            ->asJson()
            ->timeout(120);
    }
}
