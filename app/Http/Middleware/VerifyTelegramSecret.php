<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Telegram sends the secret chosen when the webhook was registered in a
 * header on every update. Telegraph doesn't check it, so this does:
 * without it anyone who found the webhook URL could post fake updates.
 */
class VerifyTelegramSecret
{
    public function handle(Request $request, Closure $next): Response
    {
        $secret = (string) config('fitnessos.telegram.webhook_secret');
        $given = (string) $request->header('X-Telegram-Bot-Api-Secret-Token', '');

        abort_if($secret === '' || ! hash_equals($secret, $given), 403);

        return $next($request);
    }
}
