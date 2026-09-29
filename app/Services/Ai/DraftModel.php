<?php

namespace App\Services\Ai;

/**
 * The language model behind the coach assistant. Returns JSON that
 * matches the given schema; implementations throw AssistantUnavailable
 * when they can't produce a draft.
 */
interface DraftModel
{
    /**
     * @param  array<string, mixed>  $schema  JSON Schema for the output
     */
    public function generate(string $system, string $prompt, array $schema): DraftResult;
}
