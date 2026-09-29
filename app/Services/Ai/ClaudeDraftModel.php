<?php

namespace App\Services\Ai;

use Anthropic\Beta\Messages\BetaTextBlock;
use Anthropic\Client;
use Anthropic\Core\Exceptions\APIConnectionException;
use Anthropic\Core\Exceptions\APIStatusException;
use Anthropic\Core\Exceptions\AuthenticationException;
use Anthropic\Core\Exceptions\BadRequestException;
use Anthropic\Core\Exceptions\RateLimitException;
use Illuminate\Support\Facades\Log;

/**
 * Drafts with Claude through the official Anthropic SDK, using structured
 * output so every draft is valid JSON for its schema.
 */
class ClaudeDraftModel implements DraftModel
{
    public function __construct(
        private Client $client,
        private string $model,
    ) {}

    public function generate(string $system, string $prompt, array $schema): DraftResult
    {
        try {
            $message = $this->client->beta->messages->create(
                model: $this->model,
                maxTokens: 16000,
                // Drafting is routine work: adaptive thinking at medium effort.
                thinking: ['type' => 'adaptive'],
                // Cache the fixed instructions; the trainee context changes per call.
                system: [['type' => 'text', 'text' => $system, 'cacheControl' => ['type' => 'ephemeral']]],
                messages: [['role' => 'user', 'content' => $prompt]],
                outputConfig: [
                    'effort' => 'medium',
                    'format' => ['type' => 'json_schema', 'schema' => $schema],
                ],
                // If a safety classifier declines, let the API retry on its recommended model.
                fallbacks: 'default',
                betas: ['server-side-fallback-2026-07-01'],
            );
        } catch (AuthenticationException $e) {
            Log::error('AI assistant authentication failed', ['error' => $e->getMessage()]);
            throw new AssistantUnavailable(__('The AI assistant is not set up correctly. Please contact support.'), previous: $e);
        } catch (RateLimitException $e) {
            throw new AssistantUnavailable(__('The AI assistant is busy. Please try again in a minute.'), previous: $e);
        } catch (BadRequestException $e) {
            Log::error('AI assistant request rejected', ['error' => $e->getMessage()]);
            throw new AssistantUnavailable(__('The AI assistant could not write this draft.'), previous: $e);
        } catch (APIStatusException|APIConnectionException $e) {
            Log::warning('AI assistant unavailable', ['error' => $e->getMessage()]);
            throw new AssistantUnavailable(__('The AI assistant is temporarily unavailable. Please try again.'), previous: $e);
        }

        if ($message->stopReason === 'refusal') {
            throw new AssistantUnavailable(__('The AI assistant declined to write this draft. Please write it yourself.'));
        }

        if ($message->stopReason === 'max_tokens') {
            throw new AssistantUnavailable(__('The draft was too long. Try a narrower instruction.'));
        }

        foreach ($message->content as $block) {
            if ($block instanceof BetaTextBlock) {
                $data = json_decode($block->text, true);
                if (is_array($data)) {
                    return new DraftResult(
                        data: $data,
                        model: $message->model,
                        inputTokens: $message->usage->inputTokens,
                        outputTokens: $message->usage->outputTokens,
                    );
                }
            }
        }

        throw new AssistantUnavailable(__('The AI assistant could not write this draft.'));
    }
}
