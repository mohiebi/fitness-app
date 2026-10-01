<?php

namespace App\Services\Operations;

use App\Services\Telegram\TelegramClient;
use App\Services\Telegram\Tg;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

/**
 * Tells the admin about problems as they happen, in the admin Telegram chat:
 * server errors and failed backups. It never throws (an alert must not make a
 * failure worse), repeats of the same problem are held back, and there is a
 * cap per hour so one broken page can't flood the chat.
 */
class AdminAlerts
{
    public function __construct(private TelegramClient $telegram) {}

    /**
     * Report an exception that caused a server error. Client mistakes
     * (404, validation, not allowed) are not alerts.
     */
    public function exception(Throwable $e): void
    {
        if ($e instanceof HttpExceptionInterface && $e->getStatusCode() < 500) {
            return;
        }

        $where = app()->runningInConsole() ? 'console' : request()->method().' '.request()->path();

        $this->send(
            '🚨 <b>'.Tg::esc(class_basename($e)).'</b>'."\n"
            .Tg::esc(Tg::clip($e->getMessage(), 300))."\n"
            .'<code>'.Tg::esc(basename($e->getFile()).':'.$e->getLine()).'</code> · '.Tg::esc($where),
            'exception:'.sha1($e::class.'|'.$e->getFile().'|'.$e->getLine()),
        );
    }

    /**
     * A plain alert (a failed backup, a failed scheduled task...).
     *
     * @param  string|null  $repeatKey  alerts with the same key are sent once per repeat window
     */
    public function send(string $html, ?string $repeatKey = null): bool
    {
        $chat = (string) config('fitnessos.telegram.admin_chat_id');

        if (! config('fitnessos.ops.alerts') || $chat === '' || ! $this->telegram->enabled()) {
            return false;
        }

        try {
            if ($repeatKey !== null && ! Cache::add('alert:'.$repeatKey, true, now()->addMinutes((int) config('fitnessos.ops.alert_repeat_minutes')))) {
                return false;
            }

            $hour = 'alerts:'.now()->format('YmdH');
            Cache::add($hour, 0, now()->addHours(2));
            $count = (int) Cache::increment($hour);
            $limit = (int) config('fitnessos.ops.alerts_per_hour');

            // One last notice that alerts are being held back, then silence.
            if ($count > $limit + 1) {
                return false;
            }

            $text = $count > $limit ? __('⚠️ Too many alerts this hour; the rest are only in the log.') : $html;

            // After the response, so a slow Telegram never slows the request that failed.
            defer(fn () => $this->telegram->sendMessage($chat, $text), always: true);

            return true;
        } catch (Throwable $e) {
            Log::warning('Admin alert could not be sent', ['error' => $e->getMessage()]);

            return false;
        }
    }
}
