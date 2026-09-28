<?php

use App\Models\User;

test('Persian locale renders right-to-left pages and Persian messages', function () {
    app()->setLocale('fa');

    $this->get('/')->assertOk()->assertSee('dir="rtl"', false)->assertSee('lang="fa"', false);
    $this->get('/login')->assertOk()->assertSee('dir="rtl"', false);

    $this->actingAs(User::factory()->trainee()->create())
        ->putJson('/fitnessos/trainee-profile', [])
        ->assertJsonValidationErrors(['health_consent' => 'تأیید سلامت باید پذیرفته شود.']);
});

test('English locale stays left-to-right', function () {
    app()->setLocale('en');

    $this->get('/')->assertOk()->assertSee('dir="ltr"', false);
});
