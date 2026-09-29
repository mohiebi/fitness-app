<?php

namespace App\Services\Telegram\Screens;

use App\Models\User;
use App\Services\CoachDesk;
use App\Services\CoachInbox;
use App\Services\Telegram\BotChat;
use App\Services\Telegram\Tg;
use App\Services\TrainingPlans;
use App\Support\LocalFormat;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Chat with trainees: who is waiting for an answer, the recent
 * conversation, and replying by typing.
 */
class InboxScreen extends Screen
{
    /** Longest chat message the app accepts. */
    private const MAX_LENGTH = 5000;

    public function __construct(
        private CoachDesk $desk,
        private CoachInbox $inbox,
        private TrainingPlans $plans,
    ) {}

    public function show(BotChat $chat): void
    {
        $waiting = $this->desk->awaitingReply($chat->coach());

        if ($waiting->isEmpty()) {
            $chat->show(__('No messages are waiting for your reply. ✅'), Tg::keyboard([
                Tg::row([Tg::button(__('👥 Trainees'), 'trn:list:0')]),
            ]));

            return;
        }

        $rows = $waiting->take(10)->map(fn ($row) => Tg::row([
            Tg::button(Tg::clip($row->name, 22).' · '.Tg::ago(Carbon::parse($row->created_at)), 'inb:open:'.$row->client_id),
        ]))->values()->all();

        $chat->show(__('💬 Waiting for your reply: :count', ['count' => LocalFormat::number($waiting->count())]), Tg::keyboard($rows));
    }

    public function tap(BotChat $chat, string $action, array $args): void
    {
        $id = (int) ($args[0] ?? 0);

        match ($action) {
            'open' => $this->open($chat, $this->plans->currentTrainee($chat->coach(), $id)),
            'reply' => $this->askForReply($chat, $this->plans->currentTrainee($chat->coach(), $id)),
            default => $this->show($chat),
        };
    }

    public function typed(BotChat $chat, string $type, int $id, string $text): void
    {
        if ($type !== 'reply') {
            $chat->forget();

            return;
        }

        $trainee = $this->plans->currentTrainee($chat->coach(), $id);

        if (mb_strlen($text) > self::MAX_LENGTH) {
            $chat->send(__('That message is too long. Please keep it under :max characters.', ['max' => LocalFormat::number(self::MAX_LENGTH)]));

            return;
        }

        $this->inbox->sendMessage($chat->coach(), $trainee->id, $text);
        $chat->forget();
        $chat->send(__('✅ Sent to :name.', ['name' => '<b>'.Tg::esc($trainee->name).'</b>']), Tg::keyboard([
            Tg::row([
                Tg::button(__('✍️ Write again'), 'inb:reply:'.$trainee->id),
                Tg::button(__('💬 Messages'), 'inb:list'),
            ]),
        ]));
    }

    /**
     * The latest messages of a conversation, oldest first.
     */
    public function conversation(User $coach, User $trainee, int $limit = 6): string
    {
        $messages = DB::table('fitnessos_messages')
            ->where('coach_id', $coach->id)
            ->where('client_id', $trainee->id)
            ->orderByDesc('id')
            ->limit($limit)
            ->get()
            ->reverse();

        if ($messages->isEmpty()) {
            return '<i>'.__('No messages yet').'</i>';
        }

        return $messages->map(fn ($message) => ($message->sender_id === $trainee->id
            ? '<b>'.Tg::esc(strtok($trainee->name, ' ') ?: $trainee->name).'</b>'
            : '<b>'.__('You').'</b>').': '.Tg::say((string) $message->body, 400))->implode("\n\n");
    }

    private function open(BotChat $chat, User $trainee): void
    {
        $chat->show('💬 <b>'.Tg::esc($trainee->name).'</b>'."\n\n".$this->conversation($chat->coach(), $trainee), Tg::keyboard([
            Tg::row([
                Tg::button(__('✍️ Reply'), 'inb:reply:'.$trainee->id),
                Tg::button(__('👤 Trainee'), 'trn:open:'.$trainee->id),
            ]),
            Tg::row([Tg::dashboard(__('🌐 Open chat in dashboard'), '/dashboard/messages?client='.$trainee->id)]),
        ]));
    }

    private function askForReply(BotChat $chat, User $trainee): void
    {
        $chat->expect('inb.reply', $trainee->id);
        $chat->send(__('✍️ Type your reply to :name. It is sent to them as soon as you send it. Use /cancel to stop.', ['name' => '<b>'.Tg::esc($trainee->name).'</b>']));
    }
}
