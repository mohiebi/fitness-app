<?php

namespace App\Services\Telegram;

use App\Models\TelegramAccount;
use App\Services\Telegram\Screens\TodayScreen;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\App;

/**
 * The morning summary: once a day, at the hour each coach chose, one
 * message with what needs them. Coaches with nothing to do get nothing.
 */
class TelegramDigest
{
    public function __construct(
        private TelegramClient $telegram,
        private TodayScreen $today,
    ) {}

    /**
     * Send the summaries that are due now.
     *
     * @param  bool  $force  ignore the chosen hour and whether one was already sent today
     * @return int how many coaches were messaged
     */
    public function sendDue(?Carbon $now = null, bool $force = false): int
    {
        // The summary is written in the bot's language, not the website's.
        $previous = App::getLocale();
        App::setLocale((string) config('fitnessos.telegram.locale'));

        try {
            return $this->send($now, $force);
        } finally {
            App::setLocale($previous);
        }
    }

    private function send(?Carbon $now, bool $force): int
    {
        $local = ($now ?? now())->copy()->setTimezone((string) config('fitnessos.telegram.timezone'));
        $sent = 0;

        $accounts = TelegramAccount::query()->whereNotNull('chat_id')->with('user')->get();

        foreach ($accounts as $account) {
            if (! $account->user->isCoach() || ! $account->wants('digest')) {
                continue;
            }

            if (! $force && ($account->digestHour() !== $local->hour || $account->last_digest_on?->toDateString() === $local->toDateString())) {
                continue;
            }

            $account->forceFill(['last_digest_on' => $local->toDateString()])->save();

            $summary = $this->today->render($account->user, morning: true);
            if ($summary === null) {
                continue;
            }

            $this->telegram->sendMessage((string) $account->chat_id, $summary['text'], $summary['keyboard']);
            $sent++;
        }

        return $sent;
    }
}
