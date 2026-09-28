<?php

namespace App\Http\Controllers;

use App\Models\Coaching;
use App\Models\CoachProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class CoachProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json($this->payload($this->profileFor($request->user())));
    }

    public function update(Request $request): JsonResponse
    {
        $profile = $this->profileFor($request->user());

        $data = $request->validate([
            'slug' => ['required', 'string', 'min:3', 'max:60', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('coach_profiles', 'slug')->ignore($profile->id)],
            'headline' => ['nullable', 'required_if:is_published,true', 'string', 'max:120'],
            'bio' => ['nullable', 'required_if:is_published,true', 'string', 'max:5000'],
            'specialties' => ['nullable', 'array', 'max:12'],
            'specialties.*' => ['string', 'max:60'],
            'certifications' => ['nullable', 'array', 'max:12'],
            'certifications.*' => ['string', 'max:120'],
            'years_experience' => ['nullable', 'integer', 'between:0,60'],
            'city' => ['nullable', 'string', 'max:80'],
            'languages' => ['nullable', 'array', 'max:6'],
            'languages.*' => ['string', 'max:40'],
            'online' => ['boolean'],
            'in_person' => ['boolean'],
            'price_from' => ['nullable', 'integer', 'min:0', 'max:1000000000000'],
            'accepting_clients' => ['boolean'],
            'max_clients' => ['nullable', 'integer', 'between:1,1000'],
            'is_published' => ['boolean'],
        ]);

        $profile->update($data);

        return response()->json([
            'message' => __('Profile saved.'),
            'profile' => $this->payload($profile->fresh()),
        ]);
    }

    public function avatar(Request $request): JsonResponse
    {
        $request->validate(['avatar' => ['required', 'image', 'max:2048']]);
        $profile = $this->profileFor($request->user());

        $path = $request->file('avatar')->store('avatars', 'public');
        abort_if($path === false, 500, __('The photo could not be saved.'));
        if ($profile->avatar_path) {
            Storage::disk('public')->delete($profile->avatar_path);
        }
        $profile->forceFill(['avatar_path' => $path])->save();

        return response()->json(['avatar_url' => Storage::disk('public')->url($path)]);
    }

    private function profileFor(User $coach): CoachProfile
    {
        return $coach->coachProfile()->firstOrCreate([], [
            'slug' => CoachProfile::uniqueSlugFor($coach->name),
        ]);
    }

    /** @return array<string, mixed> */
    private function payload(CoachProfile $profile): array
    {
        return [
            ...$profile->toPublicArray(),
            'accepting_clients' => $profile->accepting_clients,
            'max_clients' => $profile->max_clients,
            'is_published' => $profile->is_published,
            'active_clients' => $profile->activeClientCount(),
            'pending_requests' => Coaching::query()
                ->where('coach_id', $profile->user_id)
                ->where('status', Coaching::REQUESTED)
                ->count(),
        ];
    }
}
