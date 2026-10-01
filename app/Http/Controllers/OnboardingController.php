<?php

namespace App\Http\Controllers;

use App\Services\CoachOnboarding;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The first-run guide for coaches: where they are, publishing from it, and
 * hiding or bringing back the checklist.
 */
class OnboardingController extends Controller
{
    public function __construct(private CoachOnboarding $onboarding) {}

    public function show(Request $request): JsonResponse
    {
        return response()->json($this->onboarding->summary($request->user()));
    }

    public function publish(Request $request): JsonResponse
    {
        $this->onboarding->publish($request->user());

        return response()->json($this->onboarding->summary($request->user()));
    }

    public function dismiss(Request $request): JsonResponse
    {
        $this->onboarding->dismiss($request->user());

        return response()->json($this->onboarding->summary($request->user()));
    }

    public function restore(Request $request): JsonResponse
    {
        $this->onboarding->restore($request->user());

        return response()->json($this->onboarding->summary($request->user()));
    }
}
