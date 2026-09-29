<?php

use App\Models\CoachReview;
use App\Models\SubscriptionPayment;
use App\Models\User;
use App\Services\Payments\SubscriptionPayments;
use App\Services\Telegram\TelegramClient;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

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

Artisan::command('fitnessos:telegram:webhook {url? : Defaults to APP_URL/telegram/webhook}', function (TelegramClient $telegram) {
    $secret = (string) config('fitnessos.telegram.webhook_secret');
    if (! $telegram->enabled() || $secret === '') {
        $this->error('Set TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET first.');

        return 1;
    }

    $given = $this->argument('url');
    $url = is_string($given) && $given !== '' ? $given : rtrim((string) config('app.url'), '/').'/telegram/webhook';
    if (! $telegram->setWebhook($url, $secret)) {
        $this->error('Telegram did not accept the webhook. Check the URL is public HTTPS and the token is right.');

        return 1;
    }

    $this->info("Webhook set to {$url}");

    return 0;
})->purpose('Point the Telegram payment bot at this app');

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
