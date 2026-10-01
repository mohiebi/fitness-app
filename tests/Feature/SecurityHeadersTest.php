<?php

use App\Models\User;
use App\Providers\AppServiceProvider;
use Illuminate\Http\Middleware\TrustProxies;
use Illuminate\Http\Request;

test('every page carries the basic browser protections', function () {
    $response = $this->get('/login');

    $response->assertOk()
        ->assertHeader('X-Content-Type-Options', 'nosniff')
        ->assertHeader('X-Frame-Options', 'DENY')
        ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
        ->assertHeader('Cross-Origin-Opener-Policy', 'same-origin');
    expect($response->headers->get('Permissions-Policy'))->toContain('camera=()')->toContain('publickey-credentials-get=(self)');
});

test('the policy is off outside production and a script nonce is only used when it is on', function () {
    config(['security.csp' => 'off']);

    $response = $this->get('/login');

    expect($response->headers->has('Content-Security-Policy'))->toBeFalse();
    expect($response->getContent())->not->toMatch('/nonce="[A-Za-z0-9+\/=]{10,}"/');
});

test('the Content Security Policy blocks inline and outside scripts and framing', function () {
    config(['security.csp' => 'enforce']);

    $response = $this->get('/login');
    $policy = (string) $response->headers->get('Content-Security-Policy');

    expect($policy)->toContain("default-src 'self'")->toContain("object-src 'none'")->toContain("frame-ancestors 'none'")
        ->toContain("base-uri 'self'")->toContain("form-action 'self'")
        ->toContain('https://images.unsplash.com')
        ->not->toContain('script-src *')->not->toContain("'unsafe-eval'")
        ->not->toMatch("/script-src[^;]*'unsafe-inline'/");

    // The page's inline script and the policy share one nonce.
    preg_match("/'nonce-([^']+)'/", $policy, $match);
    expect($match[1] ?? null)->not->toBeNull();
    expect($response->getContent())->toContain('nonce="'.$match[1].'"');
});

test('report-only mode sends the policy without enforcing it', function () {
    config(['security.csp' => 'report-only']);

    $response = $this->get('/login');

    expect($response->headers->has('Content-Security-Policy'))->toBeFalse();
    expect($response->headers->get('Content-Security-Policy-Report-Only'))->toContain("default-src 'self'");
});

test('HSTS is only sent over HTTPS and when switched on', function () {
    config(['security.hsts' => true]);

    expect($this->get('/login')->headers->has('Strict-Transport-Security'))->toBeFalse();
    expect($this->get('https://localhost/login')->headers->get('Strict-Transport-Security'))->toContain('max-age=31536000');

    config(['security.hsts' => false]);
    expect($this->get('https://localhost/login')->headers->has('Strict-Transport-Security'))->toBeFalse();
});

test('the endpoints that had no limit now have one', function () {
    $trainee = User::factory()->trainee()->create();
    $coach = User::factory()->publishedCoach()->create();
    $trainee->forceFill(['coach_id' => $coach->id])->save();

    foreach (range(1, 10) as $i) {
        $this->actingAs($trainee)->postJson('/fitnessos/checkins', ['reflection' => 'ok'])->assertCreated();
    }
    $this->actingAs($trainee)->postJson('/fitnessos/checkins', ['reflection' => 'ok'])->assertStatus(429);
});

test('different limits for one person do not share a counter', function () {
    $trainee = User::factory()->trainee()->create();
    $coach = User::factory()->publishedCoach()->create();
    $trainee->forceFill(['coach_id' => $coach->id])->save();

    foreach (range(1, 10) as $i) {
        $this->actingAs($trainee)->postJson('/fitnessos/checkins', ['reflection' => 'ok'])->assertCreated();
    }
    $this->actingAs($trainee)->postJson('/fitnessos/checkins', ['reflection' => 'ok'])->assertStatus(429);

    // The check-in limit is used up, but sending a message is a different limit.
    $this->actingAs($trainee)->postJson('/fitnessos/messages', ['body' => 'Hello coach'])->assertCreated();
});

test('behind a trusted proxy the app knows it is on HTTPS', function () {
    config(['security.hsts' => true]);

    // A forwarded header from an address nobody trusted is ignored.
    expect($this->withHeader('X-Forwarded-Proto', 'https')->get('/login')->headers->has('Strict-Transport-Security'))->toBeFalse();

    config(['security.trusted_proxies' => '*']);
    $provider = app()->getProvider(AppServiceProvider::class);
    (fn () => $this->trustProxies())->call($provider);

    try {
        expect($this->withHeader('X-Forwarded-Proto', 'https')->get('/login')->headers->has('Strict-Transport-Security'))->toBeTrue();
    } finally {
        TrustProxies::flushState();
        Request::setTrustedProxies([], 0);
    }
});
