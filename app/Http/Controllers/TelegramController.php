<?php

namespace App\Http\Controllers;

use App\Models\TelegramAccount;
use App\Services\Telegram\TelegramLinks;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Where a coach connects their Telegram account to the bot and chooses
 * what it tells them.
 */
class TelegramController extends Controller
{
    public function __construct(private TelegramLinks $links) {}

    public function show(Request $request): JsonResponse
    {
        return response()->json($this->payload($request));
    }

    public function link(Request $request): JsonResponse
    {
        abort_unless($this->links->available(), 503, __('The Telegram bot is not available yet.'));

        return response()->json($this->links->startLink($request->user()), 201);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            ...array_fill_keys(TelegramAccount::GROUPS, ['sometimes', 'boolean']),
            'digest_hour' => ['sometimes', 'integer', 'between:0,23'],
        ]);

        $this->links->updatePreferences($request->user(), $data);

        return response()->json($this->payload($request));
    }

    public function destroy(Request $request): JsonResponse
    {
        $this->links->unlink($request->user());

        return response()->json($this->payload($request));
    }

    /** @return array<string, mixed> */
    private function payload(Request $request): array
    {
        return [
            'available' => $this->links->available(),
            'bot_username' => $this->links->available() ? ltrim((string) config('fitnessos.telegram.bot_username'), '@') : null,
            ...$this->links->accountFor($request->user())->toSummaryArray(),
        ];
    }
}
