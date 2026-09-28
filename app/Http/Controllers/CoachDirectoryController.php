<?php

namespace App\Http\Controllers;

use App\Models\CoachProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CoachDirectoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'specialty' => ['nullable', 'string', 'max:100'],
            'city' => ['nullable', 'string', 'max:100'],
            'online' => ['nullable', 'boolean'],
        ]);

        $coaches = CoachProfile::query()
            ->published()
            ->with('user')
            ->when($filters['q'] ?? null, function ($query, string $q): void {
                $query->where(function ($query) use ($q): void {
                    $query->where('headline', 'like', "%{$q}%")
                        ->orWhere('bio', 'like', "%{$q}%")
                        ->orWhereHas('user', fn ($user) => $user->where('name', 'like', "%{$q}%"));
                });
            })
            ->when($filters['specialty'] ?? null, fn ($query, string $specialty) => $query->whereJsonContains('specialties', $specialty))
            ->when($filters['city'] ?? null, fn ($query, string $city) => $query->where('city', 'like', "%{$city}%"))
            ->when($request->boolean('online'), fn ($query) => $query->where('online', true))
            ->orderByRaw('verified_at is null')
            ->latest('updated_at')
            ->paginate(24);

        return response()->json([
            'data' => $coaches->getCollection()->map(fn (CoachProfile $profile) => $profile->toPublicArray()),
            'meta' => [
                'current_page' => $coaches->currentPage(),
                'last_page' => $coaches->lastPage(),
                'total' => $coaches->total(),
            ],
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $profile = CoachProfile::query()->published()->with('user')->where('slug', $slug)->firstOrFail();

        return response()->json($profile->toPublicArray());
    }
}
