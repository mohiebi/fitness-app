<?php

use App\Models\User;
use App\Services\Operations\AdminAlerts;
use App\Services\Operations\DatabaseBackups;
use App\Services\Operations\HealthChecks;
use App\Services\Operations\Preflight;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Factory;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

beforeEach(function () {
    fakeTelegram();
    $this->backupDir = sys_get_temp_dir().DIRECTORY_SEPARATOR.'fitnessos-backups-'.bin2hex(random_bytes(4));
    config(['fitnessos.ops.backup.path' => $this->backupDir, 'fitnessos.ops.backup.disk' => null]);
});

afterEach(function () {
    File::deleteDirectory($this->backupDir);
    if (isset($this->sourceDb)) {
        @unlink($this->sourceDb);
    }
});

/** A real SQLite file with a table and some rows, set up as a connection to back up. */
function sourceDatabase(): string
{
    $path = sys_get_temp_dir().DIRECTORY_SEPARATOR.'fitnessos-source-'.bin2hex(random_bytes(4)).'.sqlite';
    $pdo = new PDO('sqlite:'.$path);
    $pdo->exec('create table members (id integer primary key, name text)');
    $pdo->exec("insert into members (name) values ('Sara'), ('Nima'), ('نیما')");
    unset($pdo);

    config(['database.connections.source' => ['driver' => 'sqlite', 'database' => $path, 'prefix' => '', 'foreign_key_constraints' => true]]);
    test()->sourceDb = $path;

    return $path;
}

/** @return list<array{0: string, 1: array<string, mixed>}> the admin chat's messages */
function adminMessages(): array
{
    return array_values(array_filter(telegramCalls(), fn (array $call) => $call[0] === 'sendMessage' && (string) ($call[1]['chat_id'] ?? '') === '-1001'));
}

// ---------------------------------------------------------------- backups

test('a backup of a SQLite database is compressed and holds every row', function () {
    sourceDatabase();

    $result = app(DatabaseBackups::class)->run('source');

    expect($result['file'])->toMatch('/fitnessos-\d{8}-\d{6}\.sqlite\.gz$/')->and($result['bytes'])->toBeGreaterThan(0);
    expect(is_file($result['file']))->toBeTrue();

    $plain = $this->backupDir.DIRECTORY_SEPARATOR.'restored.sqlite';
    file_put_contents($plain, gzdecode((string) file_get_contents($result['file'])));
    $names = (new PDO('sqlite:'.$plain))->query('select name from members order by id')->fetchAll(PDO::FETCH_COLUMN);

    expect($names)->toBe(['Sara', 'Nima', 'نیما']);
    expect(glob($this->backupDir.'/.dump-*'))->toBe([])->and(glob($this->backupDir.'/.verify-*'))->toBe([]);
});

test('the last good backup is remembered and a good file passes verification', function () {
    sourceDatabase();
    $backups = app(DatabaseBackups::class);

    expect($backups->lastSuccess())->toBeNull()->and($backups->latest())->toBeNull();

    $result = $backups->run('source');

    expect($backups->lastSuccess()->diffInSeconds(now(), true))->toBeLessThan(5);
    expect($backups->latest())->toBe($result['file']);
    $backups->verify($result['file']);
});

test('a damaged or empty backup is rejected', function () {
    sourceDatabase();
    $backups = app(DatabaseBackups::class);
    $good = $backups->run('source')['file'];

    $bytes = (string) file_get_contents($good);
    $broken = $this->backupDir.'/fitnessos-20260101-000000.sqlite.gz';
    file_put_contents($broken, substr($bytes, 0, (int) (strlen($bytes) / 2)));
    expect(fn () => $backups->verify($broken))->toThrow(RuntimeException::class);

    $notDatabase = $this->backupDir.'/fitnessos-20260101-000001.sqlite.gz';
    file_put_contents($notDatabase, gzencode('this is not a database'));
    expect(fn () => $backups->verify($notDatabase))->toThrow(Exception::class);

    $empty = $this->backupDir.'/fitnessos-20260101-000002.sqlite.gz';
    file_put_contents($empty, '');
    expect(fn () => $backups->verify($empty))->toThrow(RuntimeException::class, 'empty');
});

test('old backups are pruned and recent ones kept', function () {
    sourceDatabase();
    $backups = app(DatabaseBackups::class);
    $recent = $backups->run('source')['file'];

    $old = $this->backupDir.'/fitnessos-20250101-000000.sqlite.gz';
    copy($recent, $old);
    touch($old, now()->subDays(40)->getTimestamp());

    expect($backups->prune(14))->toBe(1);
    expect(is_file($old))->toBeFalse()->and(is_file($recent))->toBeTrue();
});

test('each backup is also copied to the off-site disk and pruned there', function () {
    Storage::fake('offsite');
    config(['fitnessos.ops.backup.disk' => 'offsite', 'fitnessos.ops.backup.disk_path' => 'db']);
    sourceDatabase();
    $backups = app(DatabaseBackups::class);

    $name = basename($backups->run('source')['file']);

    Storage::disk('offsite')->assertExists('db/'.$name);
    expect(Storage::disk('offsite')->size('db/'.$name))->toBe((int) filesize($this->backupDir.'/'.$name));
});

test('an in-memory database or an unknown one cannot be backed up', function () {
    expect(fn () => app(DatabaseBackups::class)->run())->toThrow(RuntimeException::class, 'in-memory');

    config(['database.connections.odd' => ['driver' => 'sqlsrv']]);
    expect(fn () => app(DatabaseBackups::class)->run('odd'))->toThrow(RuntimeException::class, 'not supported');
});

test('MySQL is dumped by the native tool with the password kept off the command line', function () {
    Process::fake(['*' => Process::result(output: "-- MySQL dump\nCREATE TABLE `users` (id int);\n")]);
    $password = Str::random(24);
    config(['database.connections.mysql_test' => [
        'driver' => 'mysql', 'host' => 'db.internal', 'port' => 3307, 'database' => 'fitness', 'username' => 'app', 'password' => $password,
    ]]);

    $result = app(DatabaseBackups::class)->run('mysql_test');

    Process::assertRan(function ($process) use ($password) {
        $command = is_array($process->command) ? implode(' ', $process->command) : $process->command;

        return str_starts_with($command, 'mysqldump')
            && str_contains($command, '--single-transaction')
            && str_contains($command, '--host=db.internal') && str_contains($command, '--port=3307') && str_contains($command, '--user=app')
            && str_ends_with($command, 'fitness')
            && ! str_contains($command, $password)
            && ($process->environment['MYSQL_PWD'] ?? null) === $password;
    });
    expect($result['file'])->toEndWith('.sql.gz');
    expect(gzdecode((string) file_get_contents($result['file'])))->toContain('CREATE TABLE');
});

test('a failing dump tool is an error, not a silent empty backup', function () {
    Process::fake(['*' => Process::result(errorOutput: 'Access denied', exitCode: 2)]);
    config(['database.connections.mysql_test' => ['driver' => 'mysql', 'host' => 'h', 'port' => 3306, 'database' => 'd', 'username' => 'u', 'password' => 'p']]);

    expect(fn () => app(DatabaseBackups::class)->run('mysql_test'))->toThrow(RuntimeException::class, 'Access denied');
    expect(glob($this->backupDir.'/fitnessos-*'))->toBe([]);
});

test('the backup command reports success, and tells the admin when it fails', function () {
    $this->artisan('fitnessos:backup')->assertFailed();

    $messages = adminMessages();
    expect($messages)->toHaveCount(1)->and($messages[0][1]['text'])->toContain('Database backup failed')->toContain('in-memory');

    $this->artisan('fitnessos:backup:verify')->assertFailed();
});

// ---------------------------------------------------------------- health

test('health is green on a fresh install outside production', function () {
    $this->getJson('/health')->assertOk()->assertJsonPath('status', 'ok')
        ->assertJsonStructure(['status', 'checks' => ['database', 'cache', 'scheduler', 'backup', 'disk']])
        ->assertJsonPath('checks.database', true);
});

test('in production health goes red when the scheduler stops and green when it ticks', function () {
    config(['fitnessos.ops.require_scheduler' => true, 'fitnessos.ops.require_backups' => false]);

    $this->getJson('/health')->assertStatus(503)->assertJsonPath('status', 'degraded')->assertJsonPath('checks.scheduler', false);

    HealthChecks::beat();
    $this->getJson('/health')->assertOk()->assertJsonPath('checks.scheduler', true);

    $this->travel(10)->minutes();
    $this->getJson('/health')->assertStatus(503)->assertJsonPath('checks.scheduler', false);
});

test('in production health goes red when backups stop succeeding', function () {
    config(['fitnessos.ops.require_scheduler' => false, 'fitnessos.ops.require_backups' => true]);
    $this->getJson('/health')->assertStatus(503)->assertJsonPath('checks.backup', false);

    sourceDatabase();
    app(DatabaseBackups::class)->run('source');
    $this->getJson('/health')->assertOk()->assertJsonPath('checks.backup', true);

    $this->travel(2)->days();
    $this->getJson('/health')->assertStatus(503)->assertJsonPath('checks.backup', false);
});

test('the health answer never says why something failed', function () {
    config(['fitnessos.ops.require_backups' => true]);

    $body = json_encode($this->getJson('/health')->json());

    expect($body)->not->toContain('backup yet')->not->toContain('last good')->not->toContain('free');
});

test('the scheduler beats every minute and runs the backup daily', function () {
    Artisan::call('schedule:list');
    $output = Artisan::output();

    expect($output)->toContain('heartbeat')->toContain('fitnessos:backup')->toMatch('/10\s+3 \* \* \*/');
});

// ---------------------------------------------------------------- alerts

test('a server error is sent to the admin chat once, not every time', function () {
    $alerts = app(AdminAlerts::class);
    $error = new RuntimeException('Payment table is gone');

    $alerts->exception($error);
    $alerts->exception($error);

    $messages = adminMessages();
    expect($messages)->toHaveCount(1);
    expect($messages[0][1]['text'])->toContain('RuntimeException')->toContain('Payment table is gone');
});

test('client mistakes are not alerts but server errors are', function () {
    $alerts = app(AdminAlerts::class);

    $alerts->exception(new NotFoundHttpException('nope'));
    expect(adminMessages())->toBe([]);

    $alerts->exception(new HttpException(503, 'down'));
    expect(adminMessages())->toHaveCount(1);
});

test('a real 500 on the site reaches the admin chat', function () {
    Route::get('/_boom', fn () => throw new RuntimeException('kaboom in checkout'));

    $this->get('/_boom')->assertStatus(500);

    expect(implode('
', array_column(array_column(adminMessages(), 1), 'text')))->toContain('kaboom in checkout');
});

test('alert text from errors is escaped', function () {
    app(AdminAlerts::class)->exception(new RuntimeException('<script>alert(1)</script> & more'));

    $text = adminMessages()[0][1]['text'];
    expect($text)->not->toContain('<script>')->toContain('&lt;script&gt;');
});

test('only a limited number of alerts are sent each hour', function () {
    config(['fitnessos.ops.alerts_per_hour' => 3]);
    $alerts = app(AdminAlerts::class);

    foreach (range(1, 8) as $i) {
        $alerts->send('problem '.$i);
    }

    $texts = array_column(array_column(adminMessages(), 1), 'text');
    expect($texts)->toHaveCount(4);
    expect($texts[3])->toContain('Too many alerts');
});

test('alerts are off without an admin chat or when switched off, and never break the caller', function () {
    config(['fitnessos.telegram.admin_chat_id' => null]);
    expect(app(AdminAlerts::class)->send('x'))->toBeFalse();

    config(['fitnessos.telegram.admin_chat_id' => '-1001', 'fitnessos.ops.alerts' => false]);
    expect(app(AdminAlerts::class)->send('x'))->toBeFalse();

    config(['fitnessos.ops.alerts' => true]);
    Http::swap(new Factory);
    Http::fake(fn () => throw new ConnectionException('down'));
    expect(app(AdminAlerts::class)->send('x', 'unique-key'))->toBeTrue();
});

// ---------------------------------------------------------------- preflight

/** Run the checklist and return [exit code, output]. */
function preflight(): array
{
    $code = Artisan::call('fitnessos:preflight');

    return [$code, Artisan::output()];
}

test('preflight only warns outside production and still exits cleanly', function () {
    [$code, $output] = preflight();

    expect($code)->toBe(0)->and($output)->toContain('WARN')->toContain('Environment is production')->not->toContain('FAIL');
});

test('preflight fails in production for debug mode and a plain-HTTP site', function () {
    app()->detectEnvironment(fn () => 'production');
    config(['app.debug' => true, 'app.url' => 'http://example.com']);

    [$code, $output] = preflight();

    expect($code)->toBe(1)->and($output)->toContain('FAIL')->toContain('Debug mode is off')->toContain('Site address uses HTTPS');
});

test('preflight passes the essentials when production is set up properly', function () {
    app()->detectEnvironment(fn () => 'production');
    sourceDatabase();
    app(DatabaseBackups::class)->run('source');
    HealthChecks::beat();
    config([
        'app.debug' => false, 'app.url' => 'https://fitness.example', 'app.locale' => 'fa',
        'session.secure' => true, 'session.http_only' => true, 'security.csp' => 'enforce', 'security.hsts' => true,
        'mail.default' => 'smtp',
        'fitnessos.telegram.webhook_secret' => str_repeat('a', 40), 'fitnessos.telegram.admin_chat_id' => '123456',
        'fitnessos.payment_card.number' => '6037991234567890',
    ]);

    $failures = collect(app(Preflight::class)->run())->where('level', Preflight::FAIL)->pluck('check')->all();

    // Machine setup steps (the public/storage link, a real cache store) are not something a test should create.
    expect(array_values(array_diff($failures, ['Uploaded photos are reachable', 'Cache keeps values between requests'])))->toBe([]);
});

test('a short webhook secret and a group admin chat are called out', function () {
    config(['fitnessos.telegram.webhook_secret' => 'short', 'fitnessos.telegram.admin_chat_id' => '-100123']);

    [$code, $output] = preflight();

    expect($code)->toBe(0)->and($output)->toContain('Telegram webhook secret is long and random')->toContain('Admin chat is a private chat');
});

// ---------------------------------------------------------------- browser errors

test('browser errors are logged with the page and user, and are size-limited', function () {
    Log::spy();
    $user = User::factory()->create();

    $this->actingAs($user)->postJson('/client-errors', ['message' => 'x is undefined', 'page' => '/dashboard', 'source' => 'app.js:1:2', 'stack' => 'at foo'])->assertStatus(202);

    Log::shouldHaveReceived('warning')->withArgs(fn (string $message, array $context) => $message === 'Browser error'
        && $context['message'] === 'x is undefined' && $context['page'] === '/dashboard' && $context['user'] === $user->id)->once();

    $this->postJson('/client-errors', ['message' => str_repeat('a', 501)])->assertUnprocessable();
    $this->postJson('/client-errors', [])->assertUnprocessable();
});

test('the browser error endpoint is rate limited', function () {
    foreach (range(1, 20) as $i) {
        $this->postJson('/client-errors', ['message' => 'oops'])->assertStatus(202);
    }

    $this->postJson('/client-errors', ['message' => 'oops'])->assertStatus(429);
});
