<?php

use App\Models\User;
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
