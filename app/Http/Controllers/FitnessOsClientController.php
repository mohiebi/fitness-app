<?php

namespace App\Http\Controllers;

use App\Models\Coaching;
use App\Models\CoachProfile;
use App\Models\User;
use App\Services\CoachingLifecycle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class FitnessOsClientController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $coachings = Coaching::query()
            ->where('coach_id', $request->user()->id)
            ->where('status', Coaching::ACTIVE)
            ->with('trainee.traineeProfile')
            ->get()
            ->keyBy('trainee_id');

        $clients = User::query()
            ->where('role', 'client')
            ->where('coach_id', $request->user()->id)
            ->orderBy('name')
            ->get()
            ->map(fn (User $client) => [
                'id' => (string) $client->id,
                'name' => $client->name,
                'email' => $client->email,
                'avatar' => null,
                'goal' => $client->traineeProfile->goal ?? 'Not set',
                'status' => 'Active',
                'package' => 'Not set',
                'progress' => 0,
                'lastCheckin' => 'No check-in yet',
                'notes' => '',
                'coaching_id' => $coachings->get($client->id)?->id,
                'started_at' => $coachings->get($client->id)?->started_at?->toIso8601String(),
            ]);

        return response()->json($clients);
    }

    public function store(Request $request, CoachingLifecycle $lifecycle): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
        ]);

        $profile = $request->user()->coachProfile()->firstOrCreate([], ['slug' => CoachProfile::uniqueSlugFor($request->user()->name)]);
        $limit = $profile->traineeLimit();
        if ($limit !== null && $profile->activeClientCount() >= $limit) {
            throw ValidationException::withMessages(['email' => $limit === 0
                ? __('Your subscription has ended. Renew it to accept new trainees.')
                : __('You have reached your maximum number of trainees.')]);
        }

        $client = User::create([
            ...$data,
            'password' => Str::random(40),
            'role' => 'client',
        ]);
        $lifecycle->startDirect($request->user(), $client);

        try {
            $mailStatus = Password::sendResetLink(['email' => $client->email]);
        } catch (\Throwable $error) {
            report($error);
            $mailStatus = null;
        }

        $message = 'Client added. Configure mail delivery and send a password reset link to invite them.';

        if ($mailStatus === Password::RESET_LINK_SENT) {
            $message = config('mail.default') === 'log'
                ? 'Client added. The setup link was written to the Laravel log.'
                : 'Client added. An account setup email was sent.';
        }

        return response()->json([
            'id' => $client->id,
            'message' => $message,
        ], 201);
    }

    public function show(Request $request, int $client, CoachingLifecycle $lifecycle): JsonResponse
    {
        $user = User::query()
            ->whereKey($client)
            ->where('role', 'client')
            ->where('coach_id', $request->user()->id)
            ->firstOrFail();

        return response()->json([
            'id' => (string) $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'joined_at' => $user->created_at?->toDateString(),
            'profile' => $user->traineeProfile?->toSummaryArray(),
            'coaching' => $lifecycle->activeFor($user)?->toSummaryArray(),
        ]);
    }
}
