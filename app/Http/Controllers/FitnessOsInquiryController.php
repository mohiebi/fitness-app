<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class FitnessOsInquiryController extends Controller
{
    public function leads(): JsonResponse
    {
        $leads = DB::table('fitnessos_leads')->latest()->get()->map(fn ($lead) => [
            'id' => (string) $lead->id,
            'name' => $lead->name,
            'email' => $lead->email,
            'stage' => $lead->stage,
            'source' => 'Website',
            'date' => Carbon::parse($lead->created_at)->diffForHumans(),
            'created_at' => $lead->created_at,
        ]);

        return response()->json($leads);
    }

    public function contactMessages(): JsonResponse
    {
        $messages = DB::table('fitnessos_contact_messages')->latest()->limit(100)->get();

        return response()->json($messages);
    }

    public function updateLead(Request $request, int $lead): JsonResponse
    {
        $data = $request->validate([
            'stage' => ['required', 'in:New,Qualified,Call booked,Nurturing,Won,Lost'],
        ]);

        $updated = DB::table('fitnessos_leads')->where('id', $lead)->update([
            ...$data,
            'updated_at' => now(),
        ]);

        abort_unless($updated, 404);

        return response()->json(['message' => 'Lead updated.']);
    }

    public function application(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'age' => ['nullable', 'integer', 'between:13,120'],
            'country' => ['nullable', 'string', 'max:255'],
            'goal' => ['nullable', 'string', 'max:255'],
            'timeline' => ['nullable', 'string', 'max:255'],
            'success' => ['nullable', 'string', 'max:5000'],
            'experience' => ['nullable', 'string', 'max:255'],
            'height_cm' => ['nullable', 'integer', 'between:100,250'],
            'weight_kg' => ['nullable', 'numeric', 'between:20,500'],
            'limitations' => ['nullable', 'string', 'max:5000'],
            'package' => ['nullable', 'in:starter,pro,elite'],
        ]);

        DB::table('fitnessos_leads')->insert([
            ...$data,
            'stage' => 'New',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Application received.'], 201);
    }

    public function contact(Request $request): JsonResponse
    {
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'message' => ['required', 'string', 'max:5000'],
        ]);

        DB::table('fitnessos_contact_messages')->insert([
            ...$data,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Message received.'], 201);
    }
}
