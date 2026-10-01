<?php

namespace App\Services\Operations;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Is the app really working? Beyond "the page loads": the database and cache
 * answer, the scheduler is running, backups keep succeeding and the disk is
 * not filling up. An uptime monitor pointed at /health turns these into a
 * phone call or message before users notice.
 */
class HealthChecks
{
    /** A scheduler that has not ticked for this long is considered stopped. */
    private const HEARTBEAT_MAX_MINUTES = 5;

    /** Backups are daily; a day and a half without a good one is a problem. */
    private const BACKUP_MAX_HOURS = 36;

    private const DISK_MIN_FREE_PERCENT = 10;

    public function __construct(private DatabaseBackups $backups) {}

    /**
     * @return array<string, array{ok: bool, detail: string}>
     */
    public function run(): array
    {
        return [
            'database' => $this->database(),
            'cache' => $this->cache(),
            'scheduler' => $this->scheduler(),
            'backup' => $this->backup(),
            'disk' => $this->disk(),
        ];
    }

    /**
     * @param  array<string, array{ok: bool, detail: string}>  $checks
     */
    public function healthy(array $checks): bool
    {
        return collect($checks)->every(fn (array $check) => $check['ok']);
    }

    /** Called every minute by the scheduler. */
    public static function beat(): void
    {
        Cache::forever('fitnessos:heartbeat', now()->getTimestamp());
    }

    /**
     * @return array{ok: bool, detail: string}
     */
    private function database(): array
    {
        try {
            DB::select('select 1');

            return ['ok' => true, 'detail' => 'answers'];
        } catch (Throwable $e) {
            return ['ok' => false, 'detail' => 'unreachable'];
        }
    }

    /**
     * @return array{ok: bool, detail: string}
     */
    private function cache(): array
    {
        try {
            Cache::put('fitnessos:health', 'ok', 60);

            return Cache::get('fitnessos:health') === 'ok'
                ? ['ok' => true, 'detail' => 'answers']
                : ['ok' => false, 'detail' => 'does not keep values'];
        } catch (Throwable $e) {
            return ['ok' => false, 'detail' => 'unreachable'];
        }
    }

    /**
     * @return array{ok: bool, detail: string}
     */
    private function scheduler(): array
    {
        $beat = Cache::get('fitnessos:heartbeat');
        $age = is_int($beat) ? (int) floor((now()->getTimestamp() - $beat) / 60) : null;
        $running = $age !== null && $age <= self::HEARTBEAT_MAX_MINUTES;

        if ($running) {
            return ['ok' => true, 'detail' => 'ticked '.$age.' min ago'];
        }

        $detail = $age === null ? 'has never run' : 'last ticked '.$age.' min ago';

        // Outside production the scheduler is often not running; only production insists.
        return ['ok' => ! config('fitnessos.ops.require_scheduler'), 'detail' => $detail];
    }

    /**
     * @return array{ok: bool, detail: string}
     */
    private function backup(): array
    {
        $last = $this->backups->lastSuccess();
        $fresh = $last !== null && $last->gt(now()->subHours(self::BACKUP_MAX_HOURS));

        if ($fresh) {
            return ['ok' => true, 'detail' => 'last good backup '.$last->diffForHumans()];
        }

        return [
            'ok' => ! config('fitnessos.ops.require_backups'),
            'detail' => $last === null ? 'no backup yet' : 'last good backup '.$last->diffForHumans(),
        ];
    }

    /**
     * @return array{ok: bool, detail: string}
     */
    private function disk(): array
    {
        $free = @disk_free_space(storage_path());
        $total = @disk_total_space(storage_path());

        if ($free === false || $total === false || $total <= 0) {
            return ['ok' => true, 'detail' => 'unknown'];
        }

        $percent = (int) round($free / $total * 100);

        return ['ok' => $percent >= self::DISK_MIN_FREE_PERCENT, 'detail' => $percent.'% free'];
    }
}
