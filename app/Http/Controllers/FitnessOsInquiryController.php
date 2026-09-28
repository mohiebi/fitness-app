<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Platform contact form. Coaching applications now go to a specific coach
 * as coaching requests (see CoachingController).
 */
class FitnessOsInquiryController extends Controller
{
    public function contactMessages(): JsonResponse
    {
        $messages = DB::table('fitnessos_contact_messages')->latest()->limit(100)->get();

        return response()->json($messages);
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

        return response()->json(['message' => __('Message received.')], 201);
    }
}
