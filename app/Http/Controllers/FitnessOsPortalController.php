<?php

namespace App\Http\Controllers;

use App\Models\CoachProfile;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class FitnessOsPortalController extends Controller
{
    public function __invoke(Request $request): Response
    {
        if (! $request->user()->isTrainee()) {
            return Inertia::location('/dashboard');
        }

        $coach = $request->session()->pull('fitnessos.intended_coach');
        if (is_string($coach) && CoachProfile::query()->published()->where('slug', $coach)->exists()) {
            return Inertia::location('/coaches/'.$coach.'?request=1');
        }

        return Inertia::location('/app');
    }
}
