<?php

namespace App\Http\Controllers;

use App\Models\CalendarEvent;
use App\Services\CoachCalendar;
use App\Services\TrainingPlans;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

/**
 * The coach's calendar: their own appointments plus what their trainees did.
 */
class CalendarController extends Controller
{
    /** The longest stretch one request may cover (a month grid is 42 days). */
    private const MAX_DAYS = 62;

    public function index(Request $request, CoachCalendar $calendar): JsonResponse
    {
        $data = $request->validate([
            'from' => ['required', 'date'],
            'to' => ['required', 'date', 'after:from'],
        ]);

        $from = Carbon::parse($data['from']);
        $to = Carbon::parse($data['to']);
        abort_if($from->diffInDays($to) > self::MAX_DAYS, 422, __('That date range is too long.'));

        return response()->json($calendar->range($request->user(), $from, $to));
    }

    public function store(Request $request, TrainingPlans $plans): JsonResponse
    {
        $coach = $request->user();
        $data = $request->validate([
            'title' => ['required', 'string', 'max:120'],
            'kind' => ['required', Rule::in(CalendarEvent::KINDS)],
            'starts_at' => ['required', 'date'],
            'duration_minutes' => ['nullable', 'integer', 'between:5,600'],
            'trainee_id' => ['nullable', 'integer'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        // An event can only involve someone the coach currently coaches.
        $trainee = isset($data['trainee_id']) ? $plans->currentTrainee($coach, (int) $data['trainee_id']) : null;

        $event = CalendarEvent::create([
            'coach_id' => $coach->id,
            'trainee_id' => $trainee?->id,
            'title' => $data['title'],
            'kind' => $data['kind'],
            'starts_at' => Carbon::parse($data['starts_at']),
            'duration_minutes' => $data['duration_minutes'] ?? null,
            'notes' => $data['notes'] ?? null,
        ]);

        return response()->json($event->load('trainee:id,name')->toSummaryArray(), 201);
    }

    public function destroy(Request $request, CalendarEvent $event): JsonResponse
    {
        abort_unless($event->coach_id === $request->user()->id, 404);
        $event->delete();

        return response()->json(['message' => __('Event deleted.')]);
    }
}
