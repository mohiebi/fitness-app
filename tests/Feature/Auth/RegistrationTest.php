<?php

use Inertia\Inertia;
use Laravel\Fortify\Features;

beforeEach(function () {
    $this->skipUnlessFortifyHas(Features::registration());
});

test('registration screen can be rendered', function () {
    $response = $this->get(route('register'));

    $response->assertOk();
});

test('new users can register', function () {
    $response = $this->post(route('register.store'), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'role' => 'coach',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('portal', absolute: false));
});

test('Inertia registration opens the coach welcome guide', function () {
    $this->get(route('register'))->assertOk();

    $response = $this->followingRedirects()->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => Inertia::getVersion(),
    ])->post(route('register.store'), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'role' => 'coach',
    ]);

    $this->assertAuthenticated();
    $response->assertStatus(409)
        ->assertHeader('X-Inertia-Location', '/dashboard/welcome');
});
