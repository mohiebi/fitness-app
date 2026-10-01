<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Errors that happen in people's browsers never reach the server on their
 * own. The app reports them here, and they land in the log next to the
 * server's own errors. Everything is size-limited, the endpoint is
 * rate-limited, and nothing is stored beyond the log line.
 */
class ClientErrorController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $data = $request->validate([
            'message' => ['required', 'string', 'max:500'],
            'source' => ['nullable', 'string', 'max:300'],
            'page' => ['nullable', 'string', 'max:300'],
            'stack' => ['nullable', 'string', 'max:2000'],
        ]);

        Log::warning('Browser error', [
            ...$data,
            'user' => $request->user()?->id,
            'agent' => mb_substr((string) $request->userAgent(), 0, 200),
        ]);

        return response()->json(['ok' => true], 202);
    }
}
