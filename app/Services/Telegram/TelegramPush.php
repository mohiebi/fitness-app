<?php

namespace App\Services\Telegram;

use App\Notifications\AppNotice;

/**
 * How a notice looks in Telegram: the text, and the buttons that let the
 * coach act on it right there.
 */
final class TelegramPush
{
    public static function text(AppNotice $notice): string
    {
        $lines = ['<b>'.Tg::esc($notice->title).'</b>'];

        // A chat message's body only says "open the chat"; the words themselves say more.
        if ($notice->kind !== 'message') {
            $lines[] = Tg::esc($notice->body);
        }

        if ($notice->detail !== null && $notice->detail !== '') {
            $lines[] = Tg::quote($notice->detail);
        }

        return implode("\n", $lines);
    }

    /**
     * @return list<list<array<string, string>>>|null
     */
    public static function keyboard(AppNotice $notice): ?array
    {
        $extra = $notice->extra;
        $coachingId = $extra['coaching_id'] ?? null;
        $senderId = $extra['sender_id'] ?? null;
        $checkinId = $extra['checkin_id'] ?? null;

        $rows = match ($notice->kind) {
            'coaching_requested' => $coachingId === null ? [] : [
                Tg::row([
                    Tg::button(__('✅ Accept'), 'req:acc:'.$coachingId),
                    Tg::button(__('❌ Decline'), 'req:dec:'.$coachingId),
                ]),
            ],
            'message' => $senderId === null ? [] : [
                Tg::row([
                    Tg::button(__('✍️ Reply'), 'inb:reply:'.$senderId),
                    Tg::button(__('🤖 AI draft'), 'ai:reply:'.$senderId),
                ]),
            ],
            'checkin_submitted' => $checkinId === null ? [] : [
                Tg::row([
                    Tg::button(__('👀 Read it'), 'chk:open:'.$checkinId),
                    Tg::button(__('🤖 AI feedback'), 'ai:fb:'.$checkinId),
                ]),
            ],
            'payment_confirmed', 'payment_rejected', 'subscription_ending' => [
                Tg::row([Tg::button(__('💳 Subscription'), 'bill:show')]),
            ],
            default => [],
        };

        if ($rows === []) {
            $rows[] = Tg::row([Tg::dashboard(__('🌐 Open in dashboard'), $notice->url)]);
        }

        $keyboard = Tg::keyboard($rows);

        return $keyboard === [] ? null : $keyboard;
    }
}
