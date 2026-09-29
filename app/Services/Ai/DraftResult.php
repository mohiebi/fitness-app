<?php

namespace App\Services\Ai;

final readonly class DraftResult
{
    /**
     * @param  array<string, mixed>  $data  output matching the requested schema
     */
    public function __construct(
        public array $data,
        public string $model,
        public int $inputTokens = 0,
        public int $outputTokens = 0,
    ) {}
}
