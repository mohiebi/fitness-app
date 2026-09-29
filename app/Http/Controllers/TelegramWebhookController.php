<?php

namespace App\Http\Controllers;

use App\Services\Telegram\PaymentBot;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class TelegramWebhookController extends Controller
{
    /**
     * Telegram sends every bot update here. The secret token set with
     * setWebhook proves the request came from Telegram.
     */
    public function __invoke(Request $request, PaymentBot $bot): JsonResponse
    {
        $secret = (string) config('fitnessos.telegram.webhook_secret');
        $given = (string) $request->header('X-Telegram-Bot-Api-Secret-Token', '');
        abort_if($secret === '' || ! hash_equals($secret, $given), 403);

        try {
            $bot->handle($request->json()->all());
        } catch (Throwable $e) {
            // Answer 200 anyway so Telegram doesn't keep retrying the update.
            Log::error('Telegram update failed', ['error' => $e->getMessage(), 'update_id' => $request->json('update_id')]);
        }

        return response()->json(['ok' => true]);
    }
}
