<?php

use App\Models\CoachReview;
use App\Models\CoachSubscription;
use App\Models\SubscriptionPayment;
use App\Models\User;
use App\Services\Notifier;
use App\Services\Operations\AdminAlerts;
use App\Services\Operations\DatabaseBackups;
use App\Services\Operations\HealthChecks;
use App\Services\Operations\Preflight;
use App\Services\Payments\SubscriptionPayments;
use App\Services\Telegram\Menu;
use App\Services\Telegram\TelegramClient;
use App\Services\Telegram\TelegramDigest;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('fitnessos:verify-coach {email} {--revoke}', function (string $email) {
    $profile = User::query()->where('email', $email)->first()?->coachProfile;

    if (! $profile) {
        $this->error("No coach profile found for {$email}.");

        return 1;
    }

    $profile->forceFill(['verified_at' => $this->option('revoke') ? null : now()])->save();
    $this->info($this->option('revoke') ? 'Verification removed.' : 'Coach verified.');

    return 0;
})->purpose('Mark a coach profile as verified after checking their certifications');

Artisan::command('fitnessos:telegram:webhook {domain? : Public site address, e.g. https://example.com (defaults to TELEGRAM_WEBHOOK_DOMAIN or APP_URL)}', function (TelegramClient $telegram) {
    $secret = (string) config('fitnessos.telegram.webhook_secret');
    if (! $telegram->enabled() || $secret === '') {
        $this->error('Set TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET first.');

        return 1;
    }

    $domain = $this->argument('domain');
    if (is_string($domain) && $domain !== '') {
        config(['telegraph.webhook.domain' => rtrim($domain, '/')]);
    }

    if (! $telegram->registerWebhook($secret)) {
        $this->error('Telegram did not accept the webhook. Check the address is public HTTPS and the token is right.');

        return 1;
    }

    $this->info('Webhook registered.');

    if ($telegram->setCommands(Menu::commands())) {
        $this->info('Command list updated.');
    } else {
        $this->warn('Telegram did not accept the command list; the menu buttons still work.');
    }

    return 0;
})->purpose('Point the Telegram bot at this app and register its commands');

Artisan::command('fitnessos:telegram:digest {--force : Send to everyone now, ignoring the chosen hour}', function (TelegramDigest $digest) {
    $sent = $digest->sendDue(force: (bool) $this->option('force'));
    $this->info("Sent {$sent} summary message(s).");

    return 0;
})->purpose('Send the morning summary to coaches whose chosen hour has come');

Artisan::command('fitnessos:payments:confirm {reference}', function (string $reference, SubscriptionPayments $payments) {
    $payment = SubscriptionPayment::query()->where('reference', $reference)->first();
    if ($payment === null) {
        $this->error("No payment with reference {$reference}.");

        return 1;
    }

    if (! $payments->approve($payment, 'cli')) {
        $this->warn("Payment {$reference} is already {$payment->status}.");

        return 1;
    }

    $this->info("Payment {$reference} confirmed; subscription active until ".$payment->coach->subscription?->endsAt()?->toDateString().'.');

    return 0;
})->purpose('Confirm a subscription payment by its reference (for receipts checked outside the bot)');

Artisan::command('fitnessos:subscription:grant {email} {plan} {--days=30}', function (string $email, string $plan, SubscriptionPayments $payments) {
    $coach = User::query()->where('email', $email)->first();
    if ($coach === null || ! $coach->isCoach()) {
        $this->error("No coach with email {$email}.");

        return 1;
    }

    if (! array_key_exists($plan, (array) config('fitnessos.plans'))) {
        $this->error('Unknown plan. Choose one of: '.implode(', ', array_keys((array) config('fitnessos.plans'))));

        return 1;
    }

    $payment = $payments->recordManual($coach, $plan, (int) $this->option('days'));
    $this->info("Recorded {$payment->reference}; subscription active until ".$coach->subscription()->first()?->endsAt()?->toDateString().'.');

    return 0;
})->purpose('Record a manual payment and extend a coach subscription');

Artisan::command('fitnessos:reviews:hide {id} {--restore}', function (int $id) {
    $review = CoachReview::query()->find($id);
    if ($review === null) {
        $this->error("No review with id {$id}.");

        return 1;
    }

    $review->forceFill(['hidden_at' => $this->option('restore') ? null : now()])->save();
    $this->info($this->option('restore') ? 'Review restored.' : 'Review hidden.');

    return 0;
})->purpose('Hide (or restore) a coach review that breaks the rules');

Artisan::command('fitnessos:subscriptions:remind {--days=3}', function (Notifier $notifier) {
    $days = (int) $this->option('days');
    $sent = 0;

    // Subscriptions ending within the window that haven't been reminded
    // for their current end date yet.
    CoachSubscription::query()->running()->with('coach')->get()
        ->filter(fn (CoachSubscription $subscription) => $subscription->endsAt()?->lte(now()->addDays($days))
            && ($subscription->reminded_at === null || $subscription->reminded_at->lt($subscription->endsAt()->subDays($days))))
        ->each(function (CoachSubscription $subscription) use ($notifier, &$sent): void {
            $notifier->subscriptionEnding($subscription->coach, max(1, (int) ceil(now()->diffInDays($subscription->endsAt()))));
            $subscription->forceFill(['reminded_at' => now()])->save();
            $sent++;
        });

    $this->info("Sent {$sent} reminder(s).");

    return 0;
})->purpose('Remind coaches whose subscription ends soon');

Artisan::command('fitnessos:backup {--keep= : Days to keep backups (default from BACKUP_KEEP_DAYS)}', function (DatabaseBackups $backups, AdminAlerts $alerts) {
    try {
        $result = $backups->run();
        $deleted = $backups->prune((int) ($this->option('keep') ?: config('fitnessos.ops.backup.keep_days')));
    } catch (Throwable $e) {
        $this->error('Backup failed: '.$e->getMessage());
        $alerts->send(__('🔴 Database backup failed.')."\n".e($e->getMessage()), 'backup-failed');

        return 1;
    }

    $this->info(sprintf('Backup saved: %s (%s KB), checked by reading it back. Removed %d old backup(s).', basename($result['file']), number_format($result['bytes'] / 1024, 1), $deleted));

    return 0;
})->purpose('Back up the database, check the backup can be read, and remove old ones');

Artisan::command('fitnessos:backup:verify {file? : A backup file; defaults to the newest}', function (DatabaseBackups $backups) {
    $file = $this->argument('file') ?: $backups->latest();
    if (! is_string($file) || $file === '') {
        $this->error('There are no backups yet.');

        return 1;
    }

    try {
        $backups->verify($file);
    } catch (Throwable $e) {
        $this->error($e->getMessage());

        return 1;
    }

    $this->info('OK: '.basename($file).' decompresses and contains a database.');

    return 0;
})->purpose('Check that a backup can be read back');

Artisan::command('fitnessos:preflight', function (Preflight $preflight) {
    $results = $preflight->run();

    foreach ($results as $result) {
        $mark = match ($result['level']) {
            Preflight::PASS => '<info> PASS </info>',
            Preflight::WARN => '<comment> WARN </comment>',
            default => '<error> FAIL </error>',
        };
        $this->line($mark.' '.$result['check'].($result['hint'] !== '' ? "\n        ".$result['hint'] : ''));
    }

    $failed = $preflight->failed($results);
    $counts = collect($results)->countBy('level');
    $this->newLine();
    $this->line(sprintf('%d passed, %d warning(s), %d failed.', $counts[Preflight::PASS] ?? 0, $counts[Preflight::WARN] ?? 0, $counts[Preflight::FAIL] ?? 0));

    return $failed ? 1 : 0;
})->purpose('Check the settings that must be right before real people use the site');

$problem = fn (string $task) => fn () => app(AdminAlerts::class)->send(__('🔴 Scheduled task failed: :task', ['task' => $task]), 'task-failed:'.$task);

Schedule::call(fn () => HealthChecks::beat())->everyMinute()->name('heartbeat');
Schedule::command('fitnessos:backup')->dailyAt('03:10')->onFailure($problem('backup'));
Schedule::command('fitnessos:subscriptions:remind')->dailyAt('09:00')->onFailure($problem('subscriptions:remind'));
Schedule::command('fitnessos:telegram:digest')->hourly()->onFailure($problem('telegram:digest'));
