<?php

namespace App\Http\Controllers;

use App\Services\CoachReports;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The coach's own numbers for the Reports page. Every figure is computed
 * from the signed-in coach's data only.
 */
class CoachReportController extends Controller
{
    public function __invoke(Request $request, CoachReports $reports): JsonResponse
    {
        $data = $request->validate(['weeks' => ['nullable', 'integer', 'between:4,26']]);

        return response()->json($reports->for($request->user(), (int) ($data['weeks'] ?? 12)));
    }
}
