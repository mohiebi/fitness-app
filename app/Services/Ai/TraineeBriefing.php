<?php

namespace App\Services\Ai;

use App\Models\PlanDay;
use App\Models\PlanExercise;
use App\Models\User;
use App\Models\WorkoutLog;
use App\Services\TrainingPlans;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use stdClass;

/**
 * What the assistant knows about a trainee: intake, current plan and
 * recent check-ins, sessions and chat. Only what a coach already sees in
 * the dashboard; no email or account details.
 */
class TraineeBriefing
{
    public function __construct(private TrainingPlans $plans) {}

    public function for(User $coach, User $trainee): string
    {
        $sections = [
            $this->profile($coach, $trainee),
            $this->plan($trainee),
            $this->checkins($coach, $trainee),
            $this->sessions($trainee),
            $this->chat($coach, $trainee),
        ];

        return implode("\n\n", array_filter($sections));
    }

    private function profile(User $coach, User $trainee): string
    {
        $profile = $trainee->traineeProfile;
        $lines = [
            '## Trainee',
            'First name: '.strtok($trainee->name, ' '),
            'Coach: '.$coach->name.($coach->coachProfile?->headline ? ' ('.$coach->coachProfile->headline.')' : ''),
        ];

        if ($profile === null) {
            $lines[] = 'Intake profile: not filled in yet.';

            return implode("\n", $lines);
        }

        $lines[] = 'Goal: '.($profile->goal ?? 'not given');
        $lines[] = 'Training experience: '.($profile->experience ?? 'not given');
        if ($profile->birth_year) {
            $lines[] = 'Age: about '.(now()->year - $profile->birth_year);
        }
        if ($profile->height_cm) {
            $lines[] = 'Height: '.$profile->height_cm.' cm';
        }
        if ($profile->weight_kg) {
            $lines[] = 'Weight at intake: '.(float) $profile->weight_kg.' kg';
        }
        $lines[] = 'Injuries, pain or medical conditions: '.($profile->limitations ?: 'none reported');

        return implode("\n", $lines);
    }

    private function plan(User $trainee): string
    {
        $plan = $this->plans->activePlanFor($trainee);
        if ($plan === null) {
            return "## Current plan\nNo active plan.";
        }

        $plan->loadMissing('days.exercises.exercise');
        $lines = ['## Current plan: '.$plan->title];
        foreach ($plan->days as $day) {
            /** @var PlanDay $day */
            $items = $day->exercises->map(fn (PlanExercise $item) => $item->exercise->name.' '.$item->sets.'x'.$item->reps
                .($item->target_weight_kg !== null ? ' @ '.(float) $item->target_weight_kg.' kg' : ''));
            $lines[] = '- '.$day->title.': '.$items->implode(', ');
        }

        return implode("\n", $lines);
    }

    private function checkins(User $coach, User $trainee): string
    {
        $checkins = DB::table('fitnessos_checkins')
            ->where('client_id', $trainee->id)
            ->where('coach_id', $coach->id)
            ->orderByDesc('created_at')
            ->limit(3)
            ->get();

        if ($checkins->isEmpty()) {
            return "## Recent check-ins\nNone yet.";
        }

        $lines = ['## Recent check-ins (newest first)'];
        foreach ($checkins as $checkin) {
            $lines[] = '- '.self::describeCheckin($checkin);
        }

        return implode("\n", $lines);
    }

    public static function describeCheckin(stdClass $checkin): string
    {
        $facts = array_filter([
            'sent '.Carbon::parse($checkin->created_at)->toDateString(),
            $checkin->weight_kg !== null ? 'weight '.(float) $checkin->weight_kg.' kg' : null,
            $checkin->waist_cm !== null ? 'waist '.(float) $checkin->waist_cm.' cm' : null,
            $checkin->sleep_hours !== null ? 'sleep '.(float) $checkin->sleep_hours.' h' : null,
            $checkin->steps !== null ? 'steps '.$checkin->steps : null,
            $checkin->energy !== null ? 'energy '.$checkin->energy.'/10' : null,
            $checkin->hunger !== null ? 'hunger '.$checkin->hunger.'/10' : null,
            'status '.$checkin->status,
        ]);

        return implode(', ', $facts)
            .($checkin->reflection ? "\n  How the week went: ".$checkin->reflection : '')
            .($checkin->adjustments ? "\n  Wants changed: ".$checkin->adjustments : '');
    }

    private function sessions(User $trainee): string
    {
        $logs = WorkoutLog::query()
            ->where('trainee_id', $trainee->id)
            ->with('sets')
            ->latest('performed_on')
            ->limit(5)
            ->get();

        if ($logs->isEmpty()) {
            return "## Recent workouts\nNone logged yet.";
        }

        $lines = ['## Recent workouts (newest first)'];
        foreach ($logs as $log) {
            $sets = $log->sets->where('completed', true)->groupBy('exercise_name')
                ->map(fn ($group, $name) => $name.' '.$group->map(fn ($set) => ($set->reps ?? '?').($set->weight_kg !== null ? 'x'.(float) $set->weight_kg.'kg' : ''))->implode('/'));
            $lines[] = '- '.$log->performed_on->toDateString().' '.$log->title
                .($log->effort ? ' (effort '.$log->effort.'/10)' : '')
                .': '.$sets->implode('; ')
                .($log->notes ? "\n  Trainee note: ".$log->notes : '');
        }

        return implode("\n", $lines);
    }

    private function chat(User $coach, User $trainee): string
    {
        $messages = DB::table('fitnessos_messages')
            ->where('coach_id', $coach->id)
            ->where('client_id', $trainee->id)
            ->orderByDesc('id')
            ->limit(12)
            ->get()
            ->reverse();

        if ($messages->isEmpty()) {
            return "## Recent chat\nNo messages yet.";
        }

        $lines = ['## Recent chat (oldest first)'];
        foreach ($messages as $message) {
            $lines[] = ($message->sender_id === $trainee->id ? 'Trainee' : 'Coach').': '.$message->body;
        }

        return implode("\n", $lines);
    }
}
