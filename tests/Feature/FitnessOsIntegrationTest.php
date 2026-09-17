<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

test('public pages load and private pages require the right role', function () {
    $this->get('/')->assertOk();
    $this->get('/about')->assertOk();
    $this->get('/dashboard')->assertRedirect('/login');
    $this->get('/app')->assertRedirect('/login');

    $coach = User::factory()->create();
    $client = User::factory()->create(['role' => 'client', 'coach_id' => $coach->id]);

    $this->actingAs($coach)->get('/dashboard')->assertOk();
    $this->actingAs($coach)->get('/app')->assertForbidden();
    $this->actingAs($client)->get('/app')->assertOk();
    $this->actingAs($client)->get('/dashboard')->assertForbidden();
    $this->actingAs($client)->get('/portal')->assertRedirect('/app');
    $this->actingAs($coach)->get('/portal')->assertRedirect('/dashboard');

    $this->actingAs($coach)
        ->withHeader('X-Inertia', 'true')
        ->get('/portal')
        ->assertStatus(409)
        ->assertHeader('X-Inertia-Location', '/dashboard');

    $this->actingAs($client)
        ->withHeader('X-Inertia', 'true')
        ->get('/portal')
        ->assertStatus(409)
        ->assertHeader('X-Inertia-Location', '/app');
});

test('application and contact forms save validated submissions', function () {
    $this->postJson('/fitnessos/apply', [
        'name' => 'Taylor Smith',
        'email' => 'taylor@example.com',
        'goal' => 'strength',
        'package' => 'pro',
    ])->assertCreated();

    $this->assertDatabaseHas('fitnessos_leads', [
        'email' => 'taylor@example.com',
        'stage' => 'New',
    ]);

    $this->postJson('/fitnessos/contact', [
        'first_name' => 'Taylor',
        'last_name' => 'Smith',
        'email' => 'taylor@example.com',
        'message' => 'I have a question.',
    ])->assertCreated();

    $this->assertDatabaseHas('fitnessos_contact_messages', [
        'email' => 'taylor@example.com',
        'message' => 'I have a question.',
    ]);
});

test('a coach can invite a client and only see their own clients', function () {
    Notification::fake();
    $coach = User::factory()->create();
    $other = User::factory()->create();

    $this->actingAs($coach)->postJson('/fitnessos/clients', [
        'name' => 'Jamie Client',
        'email' => 'jamie@example.com',
    ])->assertCreated();

    $client = User::query()->where('email', 'jamie@example.com')->firstOrFail();
    expect($client->role)->toBe('client');
    expect($client->coach_id)->toBe($coach->id);

    $this->actingAs($other)->getJson('/fitnessos/clients/'.$client->id)->assertNotFound();
    $this->actingAs($coach)->getJson('/fitnessos/clients/'.$client->id)->assertOk();
});

test('client check-ins and messages stay within the assigned coach account', function () {
    $coach = User::factory()->create();
    $other = User::factory()->create();
    $client = User::factory()->create(['role' => 'client', 'coach_id' => $coach->id]);

    $this->actingAs($client)->postJson('/fitnessos/checkins', [
        'weight_kg' => 81.5,
        'energy' => 8,
        'reflection' => 'Training went well.',
    ])->assertCreated();

    $checkin = DB::table('fitnessos_checkins')->first();
    expect($checkin->coach_id)->toBe($coach->id);
    $this->actingAs($other)->patchJson('/fitnessos/checkins/'.$checkin->id, ['feedback' => 'Great work.'])->assertNotFound();
    $this->actingAs($coach)->patchJson('/fitnessos/checkins/'.$checkin->id, ['feedback' => 'Great work.'])->assertOk();

    $this->actingAs($client)->getJson('/fitnessos/messages')->assertJsonCount(1);
    $this->actingAs($other)->getJson('/fitnessos/messages/'.$client->id)->assertNotFound();
});
