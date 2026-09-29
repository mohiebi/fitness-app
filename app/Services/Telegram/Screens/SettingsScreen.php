<?php

namespace App\Services\Telegram\Screens;

use App\Models\TelegramAccount;
use App\Services\Telegram\BotChat;
use App\Services\Telegram\TelegramLinks;
use App\Services\Telegram\Tg;
use App\Support\LocalFormat;
use App\Support\Trans;

/**
 * What the bot tells the coach about, and when the morning summary comes.
 * The same preferences can be changed in the dashboard.
 */
class SettingsScreen extends Screen
{
    /** Hours of the day offered for the morning summary. */
    private const DIGEST_HOURS = [6, 7, 8, 9, 10, 12, 18, 20];

    /** Preference group => button label. */
    private const LABELS = [
        'messages' => '💬 Trainee messages',
        'requests' => '📥 Coaching requests',
        'checkins' => '✅ Check-ins',
        'billing' => '💳 Subscription and payments',
        'reviews' => '⭐ New reviews',
        'digest' => '☀️ Morning summary',
    ];

    public function __construct(private TelegramLinks $links) {}

    public function show(BotChat $chat): void
    {
        $account = $this->links->accountFor($chat->coach());
        $rows = [];

        foreach (self::LABELS as $group => $label) {
            $rows[] = Tg::row([Tg::button(($account->wants($group) ? '✅ ' : '⬜ ').Trans::text($label), 'set:tgl:'.$group)]);
        }

        if ($account->wants('digest')) {
            $hours = array_map(
                fn (int $hour) => Tg::button(($hour === $account->digestHour() ? '● ' : '').LocalFormat::number($hour).':'.LocalFormat::number(0).LocalFormat::number(0), 'set:hour:'.$hour),
                self::DIGEST_HOURS,
            );
            foreach (array_chunk($hours, 4) as $row) {
                $rows[] = $row;
            }
        }

        $rows[] = Tg::row([Tg::dashboard(__('🌐 Open dashboard'), '/dashboard'), Tg::button(__('🔌 Disconnect'), 'set:ask')]);

        $chat->show(implode("\n", [
            '⚙️ <b>'.__('Telegram settings').'</b>',
            __('Tap to switch a kind of message on or off. The morning summary arrives at the hour you choose.'),
        ]), Tg::keyboard($rows));
    }

    public function tap(BotChat $chat, string $action, array $args): void
    {
        $value = (string) ($args[0] ?? '');

        match ($action) {
            'tgl' => $this->toggle($chat, $value),
            'hour' => $this->hour($chat, (int) $value),
            'ask' => $this->confirmDisconnect($chat),
            'unlink' => $this->disconnect($chat),
            default => $this->show($chat),
        };
    }

    private function toggle(BotChat $chat, string $group): void
    {
        if (! in_array($group, TelegramAccount::GROUPS, true)) {
            return;
        }

        $account = $this->links->accountFor($chat->coach());
        $this->links->updatePreferences($chat->coach(), [$group => ! $account->wants($group)]);
        $this->show($chat);
    }

    private function hour(BotChat $chat, int $hour): void
    {
        if (in_array($hour, self::DIGEST_HOURS, true)) {
            $this->links->updatePreferences($chat->coach(), ['digest_hour' => $hour]);
            $chat->toast = __('The summary will arrive at :hour.', ['hour' => LocalFormat::number($hour).':'.LocalFormat::number(0).LocalFormat::number(0)]);
        }

        $this->show($chat);
    }

    private function confirmDisconnect(BotChat $chat): void
    {
        $chat->show(__('Disconnect Telegram from your FitnessOS account? You will stop getting messages here until you connect again from the dashboard.'), Tg::keyboard([
            Tg::row([
                Tg::button(__('🔌 Yes, disconnect'), 'set:unlink'),
                Tg::button(__('◀ Keep it'), 'set:show'),
            ]),
        ]));
    }

    private function disconnect(BotChat $chat): void
    {
        $this->links->unlink($chat->coach());
        $chat->show(__('Telegram is disconnected from your FitnessOS account.'));
    }
}
