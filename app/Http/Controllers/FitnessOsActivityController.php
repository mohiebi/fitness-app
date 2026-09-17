<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class FitnessOsActivityController extends Controller
{
    private function clientFor(Request $request, ?int $client): User
    {
        $user = $request->user();

        if ($user->role === 'client') {
            abort_unless($user->coach_id, 422, 'No coach is assigned to this account.');

            return $user;
        }

        abort_unless($client, 422, 'Choose a client.');

        return User::query()
            ->whereKey($client)
            ->where('role', 'client')
            ->where('coach_id', $user->id)
            ->firstOrFail();
    }

    public function checkins(Request $request, ?int $client = null): JsonResponse
    {
        $query = DB::table('fitnessos_checkins')
            ->join('users', 'fitnessos_checkins.client_id', '=', 'users.id')
            ->select('fitnessos_checkins.*', 'users.name as client_name');

        if ($request->user()->role === 'client' || $client !== null) {
            $query->where('fitnessos_checkins.client_id', $this->clientFor($request, $client)->id);
        } else {
            $query->where('fitnessos_checkins.coach_id', $request->user()->id);
        }

        return response()->json($query->orderByDesc('fitnessos_checkins.created_at')->limit(100)->get());
    }

    public function storeCheckin(Request $request): JsonResponse
    {
        abort_unless($request->user()->role === 'client', 403);
        $client = $this->clientFor($request, null);

        $data = $request->validate([
            'weight_kg' => ['nullable', 'numeric', 'between:20,500'],
            'waist_cm' => ['nullable', 'numeric', 'between:20,250'],
            'sleep_hours' => ['nullable', 'numeric', 'between:0,24'],
            'steps' => ['nullable', 'integer', 'between:0,100000'],
            'energy' => ['nullable', 'integer', 'between:1,10'],
            'hunger' => ['nullable', 'integer', 'between:1,10'],
            'reflection' => ['nullable', 'string', 'max:5000'],
            'adjustments' => ['nullable', 'string', 'max:5000'],
        ]);

        $id = DB::table('fitnessos_checkins')->insertGetId([
            ...$data,
            'client_id' => $client->id,
            'coach_id' => $client->coach_id,
            'status' => 'Pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['id' => $id, 'message' => 'Check-in submitted.'], 201);
    }

    public function reviewCheckin(Request $request, int $checkin): JsonResponse
    {
        abort_unless(in_array($request->user()->role, ['coach', 'admin'], true), 403);
        $data = $request->validate(['feedback' => ['required', 'string', 'max:5000']]);
        $entry = DB::table('fitnessos_checkins')
            ->where('id', $checkin)
            ->where('coach_id', $request->user()->id)
            ->first();
        abort_unless($entry, 404);

        DB::transaction(function () use ($entry, $request, $data): void {
            DB::table('fitnessos_checkins')->where('id', $entry->id)->update([
                'status' => 'Reviewed',
                'updated_at' => now(),
            ]);
            DB::table('fitnessos_messages')->insert([
                'coach_id' => $request->user()->id,
                'client_id' => $entry->client_id,
                'sender_id' => $request->user()->id,
                'body' => $data['feedback'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });

        return response()->json(['message' => 'Feedback sent.']);
    }

    public function conversations(Request $request): JsonResponse
    {
        abort_unless(in_array($request->user()->role, ['coach', 'admin'], true), 403);

        $clients = User::query()
            ->where('role', 'client')
            ->where('coach_id', $request->user()->id)
            ->orderBy('name')
            ->get()
            ->map(function (User $client) use ($request): array {
                $last = DB::table('fitnessos_messages')
                    ->where('coach_id', $request->user()->id)
                    ->where('client_id', $client->id)
                    ->latest()
                    ->first();

                return [
                    'id' => (string) $client->id,
                    'name' => $client->name,
                    'avatar' => null,
                    'last' => $last?->body ?? 'No messages yet',
                    'time' => $last ? Carbon::parse($last->created_at)->diffForHumans() : '',
                    'unread' => 0,
                ];
            });

        return response()->json($clients);
    }

    public function messages(Request $request, ?int $client = null): JsonResponse
    {
        $recipient = $this->clientFor($request, $client);

        $messages = DB::table('fitnessos_messages')
            ->where('coach_id', $recipient->coach_id)
            ->where('client_id', $recipient->id)
            ->oldest()
            ->limit(500)
            ->get()
            ->map(fn ($message) => [
                'id' => $message->id,
                'from' => $message->sender_id === $recipient->id ? 'client' : 'coach',
                'text' => $message->body,
                'time' => Carbon::parse($message->created_at)->format('M j, H:i'),
            ]);

        return response()->json($messages);
    }

    public function sendMessage(Request $request): JsonResponse
    {
        $data = $request->validate([
            'client_id' => ['nullable', 'integer'],
            'body' => ['required', 'string', 'max:5000'],
        ]);
        $client = $this->clientFor($request, $data['client_id'] ?? null);

        $id = DB::table('fitnessos_messages')->insertGetId([
            'coach_id' => $client->coach_id,
            'client_id' => $client->id,
            'sender_id' => $request->user()->id,
            'body' => $data['body'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['id' => $id, 'message' => 'Message sent.'], 201);
    }
}
