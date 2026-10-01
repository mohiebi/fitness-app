<?php

namespace App\Services\Operations;

use App\Services\Telegram\TelegramClient;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * A go-live checklist you can run: settings that must be right before real
 * people use the site. In production a problem is a failure; elsewhere the
 * same problem is only a warning, so running it on a laptop shows what would
 * need changing without failing.
 */
class Preflight
{
    public const PASS = 'pass';

    public const WARN = 'warn';

    public const FAIL = 'fail';

    public function __construct(
        private TelegramClient $telegram,
        private HealthChecks $health,
    ) {}

    /**
     * @return list<array{level: string, check: string, hint: string}>
     */
    public function run(): array
    {
        $results = [];

        $check = function (string $name, bool $ok, string $hint, bool $mustFix = true) use (&$results): void {
            $results[] = [
                'level' => $ok ? self::PASS : ($mustFix && app()->isProduction() ? self::FAIL : self::WARN),
                'check' => $name,
                'hint' => $ok ? '' : $hint,
            ];
        };

        $check('Environment is production', app()->isProduction(), 'Set APP_ENV=production.');
        $check('Debug mode is off', ! config('app.debug'), 'Set APP_DEBUG=false: debug pages show secrets and code.');
        $check('App key is set', (string) config('app.key') !== '', 'Run php artisan key:generate.');
        $check('Site address uses HTTPS', str_starts_with((string) config('app.url'), 'https://'), 'Set APP_URL to the public https:// address.');
        $check('Session cookie is HTTPS-only', config('session.secure') === true, 'Set SESSION_SECURE_COOKIE=true.');
        $check('Session cookie is hidden from scripts', config('session.http_only') === true, 'Set SESSION_HTTP_ONLY=true.');
        $check('Content Security Policy is enforced', config('security.csp') === 'enforce', 'Set SECURITY_CSP=enforce.');
        $check('HTTPS-only header (HSTS) is on', (bool) config('security.hsts'), 'Set SECURITY_HSTS=true once the site is served over HTTPS.');
        $check('Site language is Persian', config('app.locale') === 'fa', 'Set APP_LOCALE=fa.', mustFix: false);
        $check('Emails are really sent', ! in_array(config('mail.default'), ['log', 'array'], true), 'Configure MAIL_MAILER and its credentials: password reset and verification emails depend on it.');
        $check('Cache keeps values between requests', ! in_array(config('cache.default'), ['array', 'null'], true), 'Use the database, file or redis cache store.');

        $database = true;
        try {
            DB::select('select 1');
        } catch (Throwable) {
            $database = false;
        }
        $check('Database answers', $database, 'Check the DB_* settings.');
        $check('Database suits several users at once', config('database.default') !== 'sqlite', 'SQLite is fine for a small start but serialises writes; plan a move to MySQL or PostgreSQL.', mustFix: false);
        $check('Uploaded photos are reachable', is_link(public_path('storage')) || is_dir(public_path('storage')), 'Run php artisan storage:link.');

        $check('Telegram bot is configured', $this->telegram->enabled() && (string) config('fitnessos.telegram.bot_username') !== '', 'Set TELEGRAM_BOT_TOKEN and TELEGRAM_BOT_USERNAME.');
        $secret = (string) config('fitnessos.telegram.webhook_secret');
        $check('Telegram webhook secret is long and random', strlen($secret) >= 24, 'Set TELEGRAM_WEBHOOK_SECRET to at least 24 random characters (php artisan tinker: Str::random(40)).');
        $admin = (string) config('fitnessos.telegram.admin_chat_id');
        $check('Admin chat for payments and alerts is set', $admin !== '', 'Set TELEGRAM_ADMIN_CHAT_ID.');
        $check('Admin chat is a private chat', $admin !== '' && ! str_starts_with($admin, '-'), 'A group chat id starts with "-": every member of the group could approve payments. Use your private chat id.', mustFix: false);
        $check('Payment card is set', (string) config('fitnessos.payment_card.number') !== '', 'Set PAYMENT_CARD_NUMBER and PAYMENT_CARD_HOLDER.');
        $check('Plan prices were changed from the placeholders', (int) config('fitnessos.plans.starter.price') !== 490000 || (int) config('fitnessos.plans.pro.price') !== 990000, 'Set FITNESSOS_STARTER_PRICE and FITNESSOS_PRO_PRICE to the real prices.', mustFix: false);
        $check('AI assistant has a key', (string) config('services.openai.api_key') !== '' || (config('services.ai.provider') === 'anthropic' && (string) config('services.anthropic.api_key') !== ''), 'Set OPENAI_API_KEY (and OPENAI_BASE_URL for a gateway). The assistant is off without it.', mustFix: false);

        $beats = $this->health->run();
        $check('Scheduler is running', $beats['scheduler']['ok'] && str_starts_with($beats['scheduler']['detail'], 'ticked'), 'Run php artisan schedule:run every minute (cron). Reminders, summaries and backups depend on it. '.$beats['scheduler']['detail'].'.');
        $check('A recent backup exists', str_starts_with($beats['backup']['detail'], 'last good') && $beats['backup']['ok'], 'Run php artisan fitnessos:backup and check the scheduler. '.$beats['backup']['detail'].'.');
        $check('Backups are copied off this server', (string) config('fitnessos.ops.backup.disk') !== '', 'Set BACKUP_DISK to a disk in config/filesystems.php (S3, SFTP...). A backup on the same machine is lost with it.', mustFix: false);
        $check('Server errors are sent to the admin chat', (bool) config('fitnessos.ops.alerts') && $admin !== '' && $this->telegram->enabled(), 'Set the Telegram bot and admin chat so errors reach you.', mustFix: false);

        return $results;
    }

    /**
     * @param  list<array{level: string, check: string, hint: string}>  $results
     */
    public function failed(array $results): bool
    {
        return collect($results)->contains(fn (array $result) => $result['level'] === self::FAIL);
    }
}
