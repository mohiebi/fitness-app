<?php

namespace App\Services\Telegram\Screens;

use App\Models\Coaching;
use App\Services\CoachDesk;
use App\Services\CoachingLifecycle;
use App\Services\Telegram\BotChat;
use App\Services\Telegram\Tg;
use App\Support\LocalFormat;

/**
 * Coaching requests: who wants to train with the coach, with Accept and
 * Decline right on the message.
 */
class RequestsScreen extends Screen
{
    /** More than this many requests are summarised, not listed one by one. */
    private const LIST_LIMIT = 5;

    public function __construct(
        private CoachDesk $desk,
        private CoachingLifecycle $lifecycle,
    ) {}

    public function show(BotChat $chat): void
    {
        $requests = $this->desk->requests($chat->coach());

        if ($requests->isEmpty()) {
            $chat->send(__('No coaching requests right now. 🎉'));

            return;
        }

        $chat->send(__('📥 Coaching requests: :count', ['count' => LocalFormat::number($requests->count())]));

        foreach ($requests->take(self::LIST_LIMIT) as $coaching) {
            $chat->send($this->text($coaching), $this->keyboard($coaching));
        }

        if ($requests->count() > self::LIST_LIMIT) {
            $chat->send(__('Answer these first, then open Requests again to see the rest.'));
        }
    }

    public function tap(BotChat $chat, string $action, array $args): void
    {
        if ($action === 'list') {
            $this->show($chat);

            return;
        }

        $coaching = Coaching::query()
            ->where('coach_id', $chat->coach()->id)
            ->with('trainee.traineeProfile')
            ->find((int) ($args[0] ?? 0));

        if ($coaching === null) {
            $chat->toast = __('This request was not found.');

            return;
        }

        if ($action === 'acc') {
            $this->lifecycle->accept($coaching, $chat->coach());
            $chat->toast = __('Request accepted.');
            $chat->show(__('✅ You accepted :name.', ['name' => '<b>'.Tg::esc($coaching->trainee->name).'</b>']), Tg::keyboard([
                Tg::row([
                    Tg::button(__('👤 Open trainee'), 'trn:open:'.$coaching->trainee_id),
                    Tg::button(__('💬 Message'), 'inb:open:'.$coaching->trainee_id),
                ]),
            ]));
        } elseif ($action === 'dec') {
            $this->lifecycle->decline($coaching, $chat->coach());
            $chat->toast = __('Request declined.');
            $chat->show(__('❌ You declined :name.', ['name' => '<b>'.Tg::esc($coaching->trainee->name).'</b>']));
        }
    }

    private function text(Coaching $coaching): string
    {
        $trainee = $coaching->trainee;
        $profile = $trainee->traineeProfile;
        $lines = [__(':name wants to train with you', ['name' => '<b>'.Tg::esc($trainee->name).'</b>'])];

        if ($profile === null) {
            $lines[] = '<i>'.__('They have not filled in their intake profile yet.').'</i>';
        } else {
            $lines[] = __('🎯 Goal: :goal', ['goal' => Tg::esc($profile->goalLabel() ?? '—')]);
            $lines[] = __('📈 Experience: :level', ['level' => Tg::esc($profile->experienceLabel() ?? '—')]);
            if ($profile->limitations) {
                $lines[] = __('⚠️ Injuries and limitations:').' '.Tg::say($profile->limitations, 400);
            }
        }

        if ($coaching->request_message) {
            $lines[] = '';
            $lines[] = Tg::quote($coaching->request_message);
        }

        return implode("\n", $lines);
    }

    /**
     * @return list<list<array<string, string>>>
     */
    private function keyboard(Coaching $coaching): array
    {
        return Tg::keyboard([
            Tg::row([
                Tg::button(__('✅ Accept'), 'req:acc:'.$coaching->id),
                Tg::button(__('❌ Decline'), 'req:dec:'.$coaching->id),
            ]),
        ]);
    }
}
