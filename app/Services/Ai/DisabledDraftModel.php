<?php

namespace App\Services\Ai;

/**
 * Used when no API key is configured.
 */
class DisabledDraftModel implements DraftModel
{
    public function generate(string $system, string $prompt, array $schema): DraftResult
    {
        throw new AssistantUnavailable(__('The AI assistant is not set up on this server.'));
    }
}
