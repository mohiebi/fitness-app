<?php

namespace App\Services\Telegram\Screens;

use App\Services\CoachDesk;
use App\Services\CoachInbox;
use App\Services\Telegram\BotChat;
use App\Services\Telegram\Tg;
use App\Support\LocalFormat;
use App\Support\Trans;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use stdClass;

/**
 * Weekly check-ins: the ones waiting for review, what the trainee wrote,
 * and sending feedback by typing.
 */
class CheckinsScreen extends Screen
{
    private const MAX_LENGTH = 5000;

    public function __construct(
        private CoachDesk $desk,
        private CoachInbox $inbox,
    ) {}

    public function show(BotChat $chat): void
    {
        $pending = $this->desk->pendingCheckins($chat->coach());

        if ($pending->isEmpty()) {
            $chat->show(__('No check-ins are waiting for review. ✅'));

            return;
        }

        $rows = $pending->take(10)->map(fn (stdClass $checkin) => Tg::row([
            Tg::button(Tg::clip((string) $checkin->client_name, 22).' · '.Tg::ago(Carbon::parse($checkin->created_at)), 'chk:open:'.$checkin->id),
        ]))->values()->all();

        $chat->show(__('✅ Check-ins to review: :count', ['count' => LocalFormat::number($pending->count())]), Tg::keyboard($rows));
    }

    public function tap(BotChat $chat, string $action, array $args): void
    {
        $id = (int) ($args[0] ?? 0);

        match ($action) {
            'open' => $this->open($chat, $this->checkin($chat, $id)),
            'fb' => $this->askForFeedback($chat, $this->checkin($chat, $id)),
            default => $this->show($chat),
        };
    }

    public function typed(BotChat $chat, string $type, int $id, string $text): void
    {
        if ($type !== 'feedback') {
            $chat->forget();

            return;
        }

        $checkin = $this->checkin($chat, $id);

        if (mb_strlen($text) > self::MAX_LENGTH) {
            $chat->send(__('That message is too long. Please keep it under :max characters.', ['max' => LocalFormat::number(self::MAX_LENGTH)]));

            return;
        }

        $this->inbox->reviewCheckin($chat->coach(), $checkin, $text);
        $chat->forget();
        $chat->send(__('✅ Feedback sent to :name and the check-in is marked as reviewed.', ['name' => '<b>'.Tg::esc($this->traineeName($checkin)).'</b>']), Tg::keyboard([
            Tg::row([Tg::button(__('✅ More check-ins'), 'chk:list')]),
        ]));
    }

    /**
     * What the trainee reported, as a short readable list.
     */
    public function describe(stdClass $checkin): string
    {
        $facts = array_filter([
            $checkin->weight_kg !== null ? Trans::text('⚖️ Weight: :value kg', ['value' => LocalFormat::number((float) $checkin->weight_kg)]) : null,
            $checkin->waist_cm !== null ? Trans::text('📏 Waist: :value cm', ['value' => LocalFormat::number((float) $checkin->waist_cm)]) : null,
            $checkin->sleep_hours !== null ? Trans::text('😴 Sleep: :value h', ['value' => LocalFormat::number((float) $checkin->sleep_hours)]) : null,
            $checkin->steps !== null ? Trans::text('👣 Steps: :value', ['value' => LocalFormat::number((int) $checkin->steps)]) : null,
            $checkin->energy !== null ? Trans::text('⚡ Energy: :value/10', ['value' => LocalFormat::number((int) $checkin->energy)]) : null,
            $checkin->hunger !== null ? Trans::text('🍽 Hunger: :value/10', ['value' => LocalFormat::number((int) $checkin->hunger)]) : null,
        ]);

        $lines = [implode("\n", $facts)];
        if ($checkin->reflection) {
            $lines[] = '<b>'.__('How the week went').'</b>'."\n".Tg::quote((string) $checkin->reflection, 700);
        }
        if ($checkin->adjustments) {
            $lines[] = '<b>'.__('Wants changed').'</b>'."\n".Tg::quote((string) $checkin->adjustments, 500);
        }

        return implode("\n\n", array_filter($lines));
    }

    private function open(BotChat $chat, stdClass $checkin): void
    {
        $pending = $checkin->status === 'Pending';
        $head = '✅ <b>'.Tg::esc($this->traineeName($checkin)).'</b> · '.Tg::ago(Carbon::parse($checkin->created_at));

        $chat->show($head."\n\n".$this->describe($checkin).($pending ? '' : "\n\n".__('This check-in was already reviewed.')), Tg::keyboard([
            $pending ? Tg::row([Tg::button(__('✍️ Write feedback'), 'chk:fb:'.$checkin->id)]) : [],
            Tg::row([
                Tg::button(__('👤 Trainee'), 'trn:open:'.$checkin->client_id),
                Tg::button(__('✅ All check-ins'), 'chk:list'),
            ]),
        ]));
    }

    private function askForFeedback(BotChat $chat, stdClass $checkin): void
    {
        $chat->expect('chk.feedback', $checkin->id);
        $chat->send(__('✍️ Type your feedback for :name. It is sent as a message and the check-in is marked as reviewed. Use /cancel to stop.', ['name' => '<b>'.Tg::esc($this->traineeName($checkin)).'</b>']));
    }

    /**
     * A check-in from a current trainee of this coach, or "not found".
     */
    private function checkin(BotChat $chat, int $id): stdClass
    {
        $checkin = $this->inbox->currentCheckin($chat->coach(), $id);
        abort_if($checkin === null, 404);

        return $checkin;
    }

    private function traineeName(stdClass $checkin): string
    {
        return (string) DB::table('users')->where('id', $checkin->client_id)->value('name');
    }
}
