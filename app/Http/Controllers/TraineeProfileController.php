<?php

namespace App\Http\Controllers;

use App\Models\TraineeProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TraineeProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $profile = $request->user()->traineeProfile ?? new TraineeProfile;

        return response()->json($profile->toSummaryArray());
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'birth_year' => ['nullable', 'integer', 'between:1920,'.now()->year],
            'height_cm' => ['nullable', 'integer', 'between:100,250'],
            'weight_kg' => ['nullable', 'numeric', 'between:20,500'],
            'goal' => ['nullable', 'string', 'max:255'],
            'experience' => ['nullable', 'string', 'max:255'],
            'limitations' => ['nullable', 'string', 'max:5000'],
            'health_consent' => ['accepted'],
        ]);
        unset($data['health_consent']);

        $profile = $request->user()->traineeProfile()->firstOrNew();
        $profile->fill($data);
        $profile->health_consent_at ??= now();
        $profile->save();

        return response()->json([
            'message' => __('Profile saved.'),
            'profile' => $profile->toSummaryArray(),
        ]);
    }
}
