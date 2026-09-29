<?php

namespace App\Services\Telegram\Screens;

use App\Models\AiDraft;
use App\Models\WorkoutPlan;
use App\Services\Ai\AssistantUnavailable;
use App\Services\Ai\CoachAssistant;
use App\Services\CoachDesk;
use App\Services\CoachInbox;
use App\Services\Telegram\BotChat;
use App\Services\Telegram\Tg;
use App\Services\TrainingPlans;
use App\Support\LocalFormat;
use App\Support\Trans;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * The AI assistant, for the coach only. It writes a draft; the coach reads
 * it here and decides. Nothing reaches a trainee until they tap Send (or
 * Save for a plan), and trainees never see or talk to the assistant.
 */
class DraftsScreen extends Screen
{
    private const MAX_LENGTH = 5000;

    public function __construct(
        private CoachAssistant $assistant,
        private CoachDesk $desk,
        private CoachInbox $inbox,
        private TrainingPlans $plans,
    ) {}

    public function show(BotChat $chat): void
    {
        $drafts = $this->desk->drafts($chat->coach());

        if ($drafts->isEmpty()) {
            $chat->show(__('No AI drafts are waiting for you. Open a trainee, a message or a check-in and ask for one. 🤖'));

            return;
        }

        $rows = $drafts->take(10)->map(fn (AiDraft $draft) => Tg::row([
            Tg::button($this->kindLabel($draft).' · '.Tg::clip($draft->trainee->name, 20), 'ai:open:'.$draft->id),
        ]))->values()->all();

        $chat->show(__('🤖 AI drafts to approve: :count', ['count' => LocalFormat::number($drafts->count())]), Tg::keyboard($rows));
    }

    public function tap(BotChat $chat, string $action, array $args): void
    {
        $id = (int) ($args[0] ?? 0);

        match ($action) {
            'reply' => $this->generate($chat, AiDraft::REPLY, $id),
            'plan' => $this->generate($chat, AiDraft::PLAN, $id),
            'fb' => $this->generate($chat, AiDraft::CHECKIN_FEEDBACK, $this->traineeOfCheckin($chat, $id), $id),
            'open' => $this->open($chat, $this->draft($chat, $id)),
            'send', 'save' => $this->approve($chat, $this->draft($chat, $id), activate: false),
            'go' => $this->approve($chat, $this->draft($chat, $id), activate: true),
            'edit' => $this->askFor($chat, $this->draft($chat, $id), 'edit', __('✏️ Send the text you want instead. I will show it to you before anything is sent. Use /cancel to stop.')),
            'redo' => $this->askFor($chat, $this->draft($chat, $id), 'redo', __('🔄 Tell me what to change, for example "shorter" or "focus on legs". Use /cancel to stop.')),
            'drop' => $this->discard($chat, $this->draft($chat, $id)),
            default => $this->show($chat),
        };
    }

    public function typed(BotChat $chat, string $type, int $id, string $text): void
    {
        $draft = $this->draft($chat, $id);

        if (mb_strlen($text) > self::MAX_LENGTH) {
            $chat->send(__('That message is too long. Please keep it under :max characters.', ['max' => LocalFormat::number(self::MAX_LENGTH)]));

            return;
        }

        $chat->forget();

        if ($type === 'edit' && $draft->kind !== AiDraft::PLAN) {
            $draft->update(['content' => $text]);
            $chat->send($this->text($draft), $this->keyboard($draft));
        } elseif ($type === 'redo') {
            $this->generate($chat, $draft->kind, $draft->trainee_id, $draft->source_id, $text, replaces: $draft);
        }
    }

    private function open(BotChat $chat, AiDraft $draft): void
    {
        if ($draft->status !== AiDraft::PENDING) {
            $chat->show(__('This draft was already handled.'));

            return;
        }

        $chat->show($this->text($draft), $this->keyboard($draft));
    }

    /**
     * Ask the assistant for a draft. The reply to Telegram goes out first
     * and the (slow) drafting happens right after it, so Telegram never
     * times out waiting and re-sends the update.
     */
    private function generate(BotChat $chat, string $kind, int $traineeId, ?int $checkinId = null, ?string $instruction = null, ?AiDraft $replaces = null): void
    {
        $coach = $chat->coach();
        $this->plans->currentTrainee($coach, $traineeId);

        $waiting = $chat->send(__('🤖 Drafting… this can take a little while.'));
        $chat->typing();

        defer(function () use ($chat, $coach, $kind, $traineeId, $checkinId, $instruction, $replaces, $waiting): void {
            try {
                $draft = $this->assistant->draft($coach, $kind, $traineeId, $checkinId, $instruction);

                if ($replaces !== null && $replaces->fresh()?->status === AiDraft::PENDING) {
                    $this->assistant->discard($coach, $replaces);
                }

                $chat->replace($waiting, $this->text($draft), $this->keyboard($draft));
            } catch (AssistantUnavailable $e) {
                $chat->replace($waiting, '⚠️ '.Tg::esc($e->getMessage()));
            } catch (ValidationException $e) {
                $chat->replace($waiting, '⚠️ '.Tg::esc((string) collect($e->errors())->flatten()->first()));
            } catch (Throwable $e) {
                Log::error('Telegram AI draft failed', ['coach' => $coach->id, 'error' => $e->getMessage()]);
                $chat->replace($waiting, '⚠️ '.__('Something went wrong. Please try again.'));
            }
        }, always: true);
    }

    private function approve(BotChat $chat, AiDraft $draft, bool $activate): void
    {
        $coach = $chat->coach();
        $name = '<b>'.Tg::esc($draft->trainee->name).'</b>';
        $approved = $this->assistant->approve($coach, $draft);

        if ($approved->kind !== AiDraft::PLAN) {
            $chat->toast = __('Sent to your trainee.');
            $chat->show(__('✅ Sent to :name.', ['name' => $name]));

            return;
        }

        $plan = WorkoutPlan::query()->where('coach_id', $coach->id)->find($approved->result_id);
        $editor = Tg::row([Tg::dashboard(__('🌐 Open plan editor'), '/dashboard/workouts/'.$approved->result_id)]);

        if ($activate && $plan !== null) {
            $this->plans->activate($coach, $plan);
            $chat->toast = __('Plan activated.');
            $chat->show(__('🚀 The plan is active and :name has been told.', ['name' => $name]), Tg::keyboard([$editor]));

            return;
        }

        $chat->toast = __('Draft plan created.');
        $chat->show(__('📋 Saved as a draft plan for :name. Open the plan editor to adjust it, then activate it.', ['name' => $name]), Tg::keyboard([
            $editor,
            Tg::row([Tg::button(__('👤 Trainee'), 'trn:open:'.$draft->trainee_id)]),
        ]));
    }

    private function discard(BotChat $chat, AiDraft $draft): void
    {
        $this->assistant->discard($chat->coach(), $draft);
        $chat->toast = __('Draft discarded.');
        $chat->show(__('🗑 Draft discarded.'));
    }

    private function askFor(BotChat $chat, AiDraft $draft, string $type, string $prompt): void
    {
        if ($draft->status !== AiDraft::PENDING) {
            $chat->toast = __('This draft was already handled.');

            return;
        }

        $chat->expect('ai.'.$type, $draft->id);
        $chat->send($prompt);
    }

    /**
     * A draft of this coach, or "not found".
     */
    private function draft(BotChat $chat, int $id): AiDraft
    {
        return AiDraft::query()
            ->where('coach_id', $chat->coach()->id)
            ->with('trainee')
            ->findOrFail($id);
    }

    private function traineeOfCheckin(BotChat $chat, int $checkinId): int
    {
        $checkin = $this->inbox->currentCheckin($chat->coach(), $checkinId);
        abort_if($checkin === null, 404);

        return (int) $checkin->client_id;
    }

    /**
     * What the assistant wrote, clearly marked as not sent yet.
     */
    private function text(AiDraft $draft): string
    {
        $name = '<b>'.Tg::esc($draft->trainee->name).'</b>';

        if ($draft->kind === AiDraft::PLAN) {
            return __('🤖 Draft plan for :name. Nothing is saved until you approve.', ['name' => $name])."\n\n".$this->planText($draft);
        }

        $title = $draft->kind === AiDraft::CHECKIN_FEEDBACK
            ? __('🤖 Draft feedback on the check-in of :name.', ['name' => $name])
            : __('🤖 Draft reply to :name.', ['name' => $name]);

        return $title.' '.__('Nothing is sent until you approve.')."\n\n".Tg::quote($draft->content, 3000);
    }

    private function planText(AiDraft $draft): string
    {
        $plan = $draft->plan ?? [];
        $lines = ['📋 <b>'.Tg::esc((string) ($plan['title'] ?? '')).'</b>'];

        if (! empty($plan['notes'])) {
            $lines[] = '<i>'.Tg::say((string) $plan['notes'], 300).'</i>';
        }

        foreach ((array) ($plan['days'] ?? []) as $day) {
            $lines[] = '';
            $lines[] = '<b>'.Tg::esc((string) ($day['title'] ?? '')).'</b>';
            foreach ((array) ($day['exercises'] ?? []) as $item) {
                $lines[] = '• '.Tg::esc((string) ($item['exercise']['name'] ?? '')).' — '
                    .LocalFormat::number((int) $item['sets']).'×'.LocalFormat::digits((string) $item['reps'])
                    .(! empty($item['target_weight_kg']) ? ' @ '.Trans::text(':value kg', ['value' => LocalFormat::number((float) $item['target_weight_kg'])]) : '');
            }
        }

        $text = implode("\n", $lines);
        if (mb_strlen($text) > Tg::MAX_TEXT - 400) {
            $cut = mb_substr($text, 0, Tg::MAX_TEXT - 400);
            $text = mb_substr($cut, 0, (int) mb_strrpos($cut, "\n"))."\n".__('… The rest is in the plan editor after you save it.');
        }

        return $text;
    }

    /**
     * @return list<list<array<string, string>>>
     */
    private function keyboard(AiDraft $draft): array
    {
        $approve = $draft->kind === AiDraft::PLAN
            ? Tg::row([
                Tg::button(__('✅ Save as draft plan'), 'ai:save:'.$draft->id),
                Tg::button(__('🚀 Save and activate'), 'ai:go:'.$draft->id),
            ])
            : Tg::row([
                Tg::button(__('✅ Send'), 'ai:send:'.$draft->id),
                Tg::button(__('✏️ Edit'), 'ai:edit:'.$draft->id),
            ]);

        return Tg::keyboard([
            $approve,
            Tg::row([
                Tg::button(__('🔄 Redo with a note'), 'ai:redo:'.$draft->id),
                Tg::button(__('🗑 Discard'), 'ai:drop:'.$draft->id),
            ]),
        ]);
    }

    private function kindLabel(AiDraft $draft): string
    {
        return match ($draft->kind) {
            AiDraft::PLAN => __('📋 Plan'),
            AiDraft::CHECKIN_FEEDBACK => __('✅ Feedback'),
            default => __('💬 Reply'),
        };
    }
}
