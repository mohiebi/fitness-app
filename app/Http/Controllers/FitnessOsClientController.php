<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class FitnessOsClientController extends Controller
{
    public function index(Request $request): JsonResponse
    {
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
                'goal' => 'Not set',
                'status' => 'Active',
                'package' => 'Not set',
                'progress' => 0,
                'lastCheckin' => 'No check-in yet',
                'notes' => '',
            ]);

        return response()->json($clients);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
        ]);

        $client = User::create([
            ...$data,
            'password' => Str::random(40),
            'role' => 'client',
            'coach_id' => $request->user()->id,
        ]);

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

    public function show(Request $request, int $client): JsonResponse
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
        ]);
    }
}
