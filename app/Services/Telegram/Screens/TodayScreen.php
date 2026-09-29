<?php

namespace App\Services\Telegram\Screens;

use App\Models\User;
use App\Services\CoachDesk;
use App\Services\Telegram\BotChat;
use App\Services\Telegram\Tg;
use App\Support\LocalFormat;
use Illuminate\Support\Collection;

/**
 * A short list of what needs the coach right now, each with a button that
 * opens it. Also the text of the morning summary.
 */
class TodayScreen extends Screen
{
    public function __construct(private CoachDesk $desk) {}

    public function show(BotChat $chat): void
    {
        $summary = $this->render($chat->coach());

        if ($summary === null) {
            $chat->send(__('All caught up. ✨ Nothing needs you right now.'));

            return;
        }

        $chat->send($summary['text'], $summary['keyboard']);
    }

    public function tap(BotChat $chat, string $action, array $args): void
    {
        $this->show($chat);
    }

    /**
     * The summary for a coach, or null when there is nothing to do.
     *
     * @return array{text: string, keyboard: list<list<array<string, string>>>}|null
     */
    public function render(User $coach, bool $morning = false): ?array
    {
        $summary = $this->desk->summary($coach);
        $lines = [];
        $rows = [];

        if ($summary['requests'] > 0) {
            $lines[] = __('📥 Coaching requests: :count', ['count' => LocalFormat::number($summary['requests'])]);
            $rows[] = Tg::row([Tg::button(__('📥 Requests'), 'req:list')]);
        }
        if ($summary['waiting'] > 0) {
            $lines[] = __('💬 Waiting for your reply: :count', ['count' => LocalFormat::number($summary['waiting'])]);
            $rows[] = Tg::row([Tg::button(__('💬 Messages'), 'inb:list')]);
        }
        if ($summary['checkins'] > 0) {
            $lines[] = __('✅ Check-ins to review: :count', ['count' => LocalFormat::number($summary['checkins'])]);
            $rows[] = Tg::row([Tg::button(__('✅ Check-ins'), 'chk:list')]);
        }
        if ($summary['drafts'] > 0) {
            $lines[] = __('🤖 AI drafts to approve: :count', ['count' => LocalFormat::number($summary['drafts'])]);
            $rows[] = Tg::row([Tg::button(__('🤖 AI drafts'), 'ai:list')]);
        }
        if ($summary['idle']->isNotEmpty()) {
            $lines[] = __('😴 No workout in :days days: :names', [
                'days' => LocalFormat::number($this->desk::IDLE_DAYS),
                'names' => $this->names($summary['idle']),
            ]);
            $rows[] = Tg::row([Tg::button(__('👥 Trainees'), 'trn:list:0')]);
        }
        if (! $summary['subscription_active']) {
            $lines[] = __('💳 Your subscription has ended.');
            $rows[] = Tg::row([Tg::button(__('💳 Subscription'), 'bill:show')]);
        } elseif ($summary['subscription_days'] <= 5) {
            $lines[] = __('💳 Your subscription ends in :days days.', ['days' => LocalFormat::number($summary['subscription_days'])]);
            $rows[] = Tg::row([Tg::button(__('💳 Subscription'), 'bill:show')]);
        }

        if ($lines === []) {
            return null;
        }

        $title = $morning
            ? __('☀️ Good morning, :name', ['name' => '<b>'.Tg::esc(strtok($coach->name, ' ') ?: $coach->name).'</b>'])
            : __('📊 Today');

        return ['text' => $title."\n\n".implode("\n", $lines), 'keyboard' => Tg::keyboard($rows)];
    }

    /**
     * @param  Collection<int, User>  $trainees
     */
    private function names(Collection $trainees): string
    {
        $names = $trainees->take(3)->map(fn (User $trainee) => Tg::esc(strtok($trainee->name, ' ') ?: $trainee->name))->implode('، ');
        $more = $trainees->count() - 3;

        return $more > 0 ? $names.' '.__('and :count more', ['count' => LocalFormat::number($more)]) : $names;
    }
}
