<?php

namespace App\Http\Controllers;

use App\Models\Exercise;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ExerciseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'muscle_group' => ['nullable', Rule::in(Exercise::MUSCLE_GROUPS)],
        ]);

        $exercises = Exercise::query()
            ->visibleTo($request->user())
            ->when($filters['q'] ?? null, fn ($query, string $q) => $query->where(fn ($query) => $query
                ->where('name', 'like', "%{$q}%")
                ->orWhere('name_en', 'like', "%{$q}%")))
            ->when($filters['muscle_group'] ?? null, fn ($query, string $group) => $query->where('muscle_group', $group))
            ->orderByRaw('coach_id is null')
            ->orderBy('name')
            ->limit(200)
            ->get()
            ->map(fn (Exercise $exercise) => $exercise->toSummaryArray());

        return response()->json($exercises);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'muscle_group' => ['required', Rule::in(Exercise::MUSCLE_GROUPS)],
            'equipment' => ['required', Rule::in(Exercise::EQUIPMENT)],
            'video_url' => ['nullable', 'url:https', 'max:500'],
            'instructions' => ['nullable', 'string', 'max:2000'],
        ]);

        $exercise = new Exercise($data);
        $exercise->coach_id = $request->user()->id;
        $exercise->save();

        return response()->json($exercise->toSummaryArray(), 201);
    }
}
