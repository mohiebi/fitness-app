<?php

namespace App\Http\Controllers;

use App\Services\Operations\HealthChecks;
use Illuminate\Http\JsonResponse;

/**
 * The address an uptime monitor watches. It answers 200 when everything
 * works and 503 when something does not, and only says which check failed,
 * never why, so it is safe to leave public.
 */
class HealthController extends Controller
{
    public function __invoke(HealthChecks $health): JsonResponse
    {
        $checks = $health->run();
        $healthy = $health->healthy($checks);

        return response()->json([
            'status' => $healthy ? 'ok' : 'degraded',
            'checks' => collect($checks)->map(fn (array $check) => $check['ok'])->all(),
        ], $healthy ? 200 : 503);
    }
}
