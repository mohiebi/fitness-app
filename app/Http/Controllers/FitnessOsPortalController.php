<?php

namespace App\Http\Controllers;

use App\Models\CoachProfile;
use App\Services\CoachOnboarding;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class FitnessOsPortalController extends Controller
{
    public function __invoke(Request $request, CoachOnboarding $onboarding): Response
    {
        if (! $request->user()->isTrainee()) {
            // A new coach sees the welcome guide once, right after signing up.
            return Inertia::location($onboarding->takeWelcome($request->user()) ? '/dashboard/welcome' : '/dashboard');
        }

        $coach = $request->session()->pull('fitnessos.intended_coach');
        if (is_string($coach) && CoachProfile::query()->published()->where('slug', $coach)->exists()) {
            return Inertia::location('/coaches/'.$coach.'?request=1');
        }

        return Inertia::location('/app');
    }
}
