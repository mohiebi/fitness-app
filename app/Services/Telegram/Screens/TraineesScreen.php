<?php

namespace App\Services\Telegram\Screens;

use App\Models\PlanDay;
use App\Models\PlanExercise;
use App\Models\User;
use App\Models\WorkoutLog;
use App\Models\WorkoutPlan;
use App\Services\CoachDesk;
use App\Services\Telegram\BotChat;
use App\Services\Telegram\Tg;
use App\Services\TrainingPlans;
use App\Support\LocalFormat;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * The coach's current trainees: a list, a card for each one and their
 * active training plan.
 */
class TraineesScreen extends Screen
{
    private const PAGE_SIZE = 8;

    public function __construct(
        private CoachDesk $desk,
        private TrainingPlans $plans,
    ) {}

    public function show(BotChat $chat): void
    {
        $this->list($chat, 0);
    }

    public function tap(BotChat $chat, string $action, array $args): void
    {
        $id = (int) ($args[0] ?? 0);

        match ($action) {
            'list' => $this->list($chat, $id),
            'open' => $this->open($chat, $this->trainee($chat, $id)),
            'plan' => $this->plan($chat, $this->trainee($chat, $id)),
            default => $this->show($chat),
        };
    }

    private function list(BotChat $chat, int $page): void
    {
        $trainees = $this->desk->trainees($chat->coach());

        if ($trainees->isEmpty()) {
            $chat->show(__('You have no trainees yet. New requests will show up here.'));

            return;
        }

        $pages = (int) ceil($trainees->count() / self::PAGE_SIZE);
        $page = max(0, min($page, $pages - 1));

        $buttons = $trainees->slice($page * self::PAGE_SIZE, self::PAGE_SIZE)
            ->map(fn (User $trainee) => Tg::button(Tg::clip($trainee->name, 24), 'trn:open:'.$trainee->id))
            ->values()
            ->all();

        $rows = array_chunk($buttons, 2);
        if ($pages > 1) {
            $rows[] = Tg::row([
                $page > 0 ? Tg::button('◀', 'trn:list:'.($page - 1)) : null,
                Tg::button(LocalFormat::number($page + 1).' / '.LocalFormat::number($pages), 'trn:list:'.$page),
                $page < $pages - 1 ? Tg::button('▶', 'trn:list:'.($page + 1)) : null,
            ]);
        }

        $chat->show(__('👥 Your trainees: :count', ['count' => LocalFormat::number($trainees->count())]), Tg::keyboard($rows));
    }

    private function open(BotChat $chat, User $trainee): void
    {
        $chat->show($this->card($chat->coach(), $trainee), Tg::keyboard([
            Tg::row([
                Tg::button(__('💬 Messages'), 'inb:open:'.$trainee->id),
                Tg::button(__('📋 Training plan'), 'trn:plan:'.$trainee->id),
            ]),
            Tg::row([Tg::dashboard(__('🌐 Open in dashboard'), '/dashboard/clients/'.$trainee->id)]),
            Tg::row([Tg::button(__('◀ All trainees'), 'trn:list:0')]),
        ]));
    }

    private function plan(BotChat $chat, User $trainee): void
    {
        $plan = $this->plans->activePlanFor($trainee);
        $back = Tg::row([Tg::button(__('◀ Back'), 'trn:open:'.$trainee->id)]);

        if ($plan === null) {
            $chat->show(__(':name has no active plan yet.', ['name' => '<b>'.Tg::esc($trainee->name).'</b>']), Tg::keyboard([$back]));

            return;
        }

        $chat->show($this->planText($plan), Tg::keyboard([
            Tg::row([Tg::dashboard(__('🌐 Open plan editor'), '/dashboard/workouts/'.$plan->id)]),
            $back,
        ]));
    }

    /**
     * A trainee the coach currently coaches; anyone else is "not found".
     */
    private function trainee(BotChat $chat, int $id): User
    {
        return $this->plans->currentTrainee($chat->coach(), $id);
    }

    /**
     * The trainee at a glance: goal, plan, training, check-in and chat.
     */
    public function card(User $coach, User $trainee): string
    {
        $profile = $trainee->traineeProfile;
        $lines = ['👤 <b>'.Tg::esc($trainee->name).'</b>'];

        if ($profile !== null) {
            $lines[] = __('🎯 Goal: :goal', ['goal' => Tg::esc($profile->goalLabel() ?? '—')]).'  '
                .__('📈 Experience: :level', ['level' => Tg::esc($profile->experienceLabel() ?? '—')]);
            if ($profile->limitations) {
                $lines[] = __('⚠️ Injuries and limitations:').' '.Tg::say($profile->limitations, 300);
            }
        }

        $plan = $this->plans->activePlanFor($trainee);
        $lines[] = '';
        $lines[] = $plan !== null
            ? __('📋 Plan: :title', ['title' => Tg::esc($plan->title)])
            : __('📋 No active plan yet.');

        $adherence = $this->plans->adherence($trainee);
        $last = WorkoutLog::query()->where('trainee_id', $trainee->id)->latest('performed_on')->first();
        if ($adherence['planned_per_week'] > 0 || $last !== null) {
            $lines[] = __('🏋️ Last 7 days: :done of :planned sessions', [
                'done' => LocalFormat::number($adherence['weeks'][0]['done']),
                'planned' => LocalFormat::number($adherence['planned_per_week']),
            ]).($last !== null ? ' — '.__('last session :when', ['when' => Tg::ago($last->performed_on)]) : '');
        }

        $checkin = DB::table('fitnessos_checkins')->where('client_id', $trainee->id)->where('coach_id', $coach->id)->latest('id')->first();
        if ($checkin !== null) {
            $lines[] = $checkin->status === 'Pending'
                ? __('✅ Check-in waiting for review (:when)', ['when' => Tg::ago(Carbon::parse($checkin->created_at))])
                : __('✅ Last check-in reviewed');
        }

        $message = DB::table('fitnessos_messages')->where('coach_id', $coach->id)->where('client_id', $trainee->id)->latest('id')->first();
        if ($message !== null) {
            $from = $message->sender_id === $trainee->id ? __('They wrote') : __('You wrote');
            $lines[] = '';
            $lines[] = '💬 '.$from.' ('.Tg::ago(Carbon::parse($message->created_at)).'):';
            $lines[] = Tg::quote((string) $message->body, 300);
        }

        return implode("\n", $lines);
    }

    private function planText(WorkoutPlan $plan): string
    {
        $plan->loadMissing('days.exercises.exercise');
        $lines = ['📋 <b>'.Tg::esc($plan->title).'</b>'];

        if ($plan->notes) {
            $lines[] = '<i>'.Tg::say($plan->notes, 300).'</i>';
        }

        foreach ($plan->days as $day) {
            /** @var PlanDay $day */
            $lines[] = '';
            $lines[] = '<b>'.Tg::esc($day->title).'</b>';
            foreach ($day->exercises as $item) {
                /** @var PlanExercise $item */
                $lines[] = '• '.Tg::esc($item->exercise->name).' — '
                    .LocalFormat::number($item->sets).'×'.LocalFormat::digits((string) $item->reps)
                    .($item->target_weight_kg !== null ? ' @ '.__(':value kg', ['value' => LocalFormat::number((float) $item->target_weight_kg)]) : '');
            }
        }

        return $this->fit(implode("\n", $lines));
    }

    /**
     * Keep a long plan inside Telegram's message size.
     */
    private function fit(string $text): string
    {
        if (mb_strlen($text) <= Tg::MAX_TEXT) {
            return $text;
        }

        // Cut at a line break so no HTML tag is left open.
        $cut = mb_substr($text, 0, Tg::MAX_TEXT);
        $cut = mb_substr($cut, 0, (int) mb_strrpos($cut, "\n"));

        return $cut."\n\n".__('… The rest is in the dashboard.');
    }
}
