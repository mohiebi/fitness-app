<?php

namespace App\Services\Operations;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;
use PDO;
use RuntimeException;

/**
 * Compressed, checked database backups. SQLite uses VACUUM INTO (a
 * consistent snapshot taken while the app keeps running), MySQL/MariaDB and
 * PostgreSQL use their own dump tools. Every backup is read back before it
 * counts, old ones are pruned, and the last good one is remembered so the
 * health check can tell when backups stop working.
 */
class DatabaseBackups
{
    private const PREFIX = 'fitnessos-';

    public function directory(): string
    {
        return (string) config('fitnessos.ops.backup.path');
    }

    /**
     * Take a backup now.
     *
     * @return array{file: string, bytes: int}
     */
    public function run(?string $connection = null): array
    {
        $connection ??= (string) config('database.default');
        $config = (array) config("database.connections.{$connection}");
        $driver = (string) ($config['driver'] ?? '');

        if (! is_dir($this->directory()) && ! mkdir($this->directory(), 0750, true) && ! is_dir($this->directory())) {
            throw new RuntimeException('Cannot create the backup folder '.$this->directory());
        }

        $extension = $driver === 'sqlite' ? 'sqlite' : 'sql';
        $name = self::PREFIX.now()->format('Ymd-His').'.'.$extension.'.gz';
        $raw = $this->directory().DIRECTORY_SEPARATOR.'.dump-'.bin2hex(random_bytes(4));
        $target = $this->directory().DIRECTORY_SEPARATOR.$name;

        try {
            match ($driver) {
                'sqlite' => $this->dumpSqlite($config, $raw),
                'mysql', 'mariadb' => $this->dumpMysql($config, $raw),
                'pgsql' => $this->dumpPostgres($config, $raw),
                default => throw new RuntimeException("Backups are not supported for the {$driver} database."),
            };

            $this->gzip($raw, $target);
        } finally {
            @unlink($raw);
        }

        $this->verify($target);
        $this->copyOffsite($target, $name);

        $bytes = (int) filesize($target);
        file_put_contents($this->directory().DIRECTORY_SEPARATOR.'last-success.json', json_encode([
            'file' => $name,
            'bytes' => $bytes,
            'at' => now()->toIso8601String(),
        ]));

        return ['file' => $target, 'bytes' => $bytes];
    }

    /**
     * Prove a backup is usable: it decompresses without error and contains a
     * real database (a SQLite file passes its own integrity check).
     */
    public function verify(string $file): void
    {
        if (! is_file($file) || filesize($file) === 0) {
            throw new RuntimeException('The backup is missing or empty: '.$file);
        }

        $plain = $this->directory().DIRECTORY_SEPARATOR.'.verify-'.bin2hex(random_bytes(4));

        try {
            $this->gunzip($file, $plain);
            $this->checkContents($file, $plain);
        } finally {
            @unlink($plain);
        }
    }

    /**
     * The newest backup file in the folder.
     */
    public function latest(): ?string
    {
        $files = glob($this->directory().DIRECTORY_SEPARATOR.self::PREFIX.'*.gz') ?: [];
        rsort($files);

        return $files[0] ?? null;
    }

    /**
     * When the last backup succeeded, or null if none ever did.
     */
    public function lastSuccess(): ?CarbonImmutable
    {
        $path = $this->directory().DIRECTORY_SEPARATOR.'last-success.json';
        if (! is_file($path)) {
            return null;
        }

        $data = json_decode((string) file_get_contents($path), true);

        return is_array($data) && isset($data['at']) ? CarbonImmutable::parse((string) $data['at']) : null;
    }

    /**
     * Delete backups (here and on the off-site disk) older than the given days.
     *
     * @return int how many were deleted
     */
    public function prune(int $keepDays): int
    {
        $cutoff = now()->subDays($keepDays)->getTimestamp();
        $deleted = 0;

        foreach (glob($this->directory().DIRECTORY_SEPARATOR.self::PREFIX.'*.gz') ?: [] as $file) {
            if (filemtime($file) < $cutoff && unlink($file)) {
                $deleted++;
            }
        }

        $disk = $this->offsiteDisk();
        if ($disk !== null) {
            $path = (string) config('fitnessos.ops.backup.disk_path');
            foreach (Storage::disk($disk)->files($path) as $remote) {
                if (str_starts_with(basename($remote), self::PREFIX) && Storage::disk($disk)->lastModified($remote) < $cutoff) {
                    Storage::disk($disk)->delete($remote);
                    $deleted++;
                }
            }
        }

        return $deleted;
    }

    /**
     * @param  array<string, mixed>  $config
     */
    private function dumpSqlite(array $config, string $to): void
    {
        $database = (string) ($config['database'] ?? '');
        if ($database === '' || $database === ':memory:') {
            throw new RuntimeException('An in-memory SQLite database can not be backed up.');
        }

        // Its own connection: VACUUM can't run inside the app's transactions,
        // and INTO writes a consistent copy even while the app is writing.
        $pdo = new PDO('sqlite:'.$database);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->exec('VACUUM INTO '.$pdo->quote($to));
    }

    /**
     * @param  array<string, mixed>  $config
     */
    private function dumpMysql(array $config, string $to): void
    {
        $this->dumpWithTool([
            'mysqldump', '--single-transaction', '--quick', '--routines', '--triggers', '--no-tablespaces',
            '--default-character-set=utf8mb4',
            '--host='.($config['host'] ?? '127.0.0.1'), '--port='.($config['port'] ?? 3306),
            '--user='.($config['username'] ?? ''), (string) ($config['database'] ?? ''),
        ], ['MYSQL_PWD' => (string) ($config['password'] ?? '')], $to);
    }

    /**
     * @param  array<string, mixed>  $config
     */
    private function dumpPostgres(array $config, string $to): void
    {
        $this->dumpWithTool([
            'pg_dump', '--no-owner', '--format=plain',
            '--host='.($config['host'] ?? '127.0.0.1'), '--port='.($config['port'] ?? 5432),
            '--username='.($config['username'] ?? ''), (string) ($config['database'] ?? ''),
        ], ['PGPASSWORD' => (string) ($config['password'] ?? '')], $to);
    }

    /**
     * Run a dump tool, streaming its output to a file. The password goes in
     * the environment, never on the command line where `ps` would show it.
     *
     * @param  list<string>  $command
     * @param  array<string, string>  $environment
     */
    private function dumpWithTool(array $command, array $environment, string $to): void
    {
        $handle = fopen($to, 'wb');
        if ($handle === false) {
            throw new RuntimeException('Cannot write the dump to '.$to);
        }

        try {
            $result = Process::forever()->env($environment)->start($command, function (string $type, string $output) use ($handle): void {
                if ($type === 'out') {
                    fwrite($handle, $output);
                }
            })->wait();
        } finally {
            fclose($handle);
        }

        if ($result->failed()) {
            throw new RuntimeException($command[0].' failed: '.trim($result->errorOutput()));
        }
    }

    private function gzip(string $from, string $to): void
    {
        $in = fopen($from, 'rb');
        $out = gzopen($to, 'wb6');
        if ($in === false || $out === false) {
            throw new RuntimeException('Cannot compress the backup.');
        }

        while (! feof($in)) {
            $chunk = fread($in, 1 << 20);
            if ($chunk === false || ($chunk !== '' && gzwrite($out, $chunk) === false)) {
                throw new RuntimeException('Compressing the backup failed.');
            }
        }

        fclose($in);
        gzclose($out);
    }

    private function gunzip(string $from, string $to): void
    {
        $in = gzopen($from, 'rb');
        $out = fopen($to, 'wb');
        if ($in === false || $out === false) {
            throw new RuntimeException('Cannot read the backup: '.$from);
        }

        while (! gzeof($in)) {
            $chunk = gzread($in, 1 << 20);
            if ($chunk === false) {
                throw new RuntimeException('The backup is corrupt (it does not decompress): '.$from);
            }
            fwrite($out, $chunk);
        }

        gzclose($in);
        fclose($out);
    }

    private function checkContents(string $backup, string $plain): void
    {
        if (filesize($plain) === 0) {
            throw new RuntimeException('The backup is empty once decompressed: '.$backup);
        }

        if (str_contains($backup, '.sqlite.')) {
            $pdo = new PDO('sqlite:'.$plain);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

            if ($this->scalar($pdo, 'PRAGMA integrity_check') !== 'ok') {
                throw new RuntimeException('The backup fails the SQLite integrity check: '.$backup);
            }
            if ((int) $this->scalar($pdo, "select count(*) from sqlite_master where type = 'table'") === 0) {
                throw new RuntimeException('The backup has no tables: '.$backup);
            }

            return;
        }

        $head = (string) file_get_contents($plain, false, null, 0, 1 << 16);
        if (! str_contains($head, 'CREATE TABLE')) {
            throw new RuntimeException('The backup does not look like a database dump: '.$backup);
        }
    }

    private function scalar(PDO $pdo, string $sql): mixed
    {
        $statement = $pdo->query($sql);

        return $statement === false ? null : $statement->fetchColumn();
    }

    private function copyOffsite(string $file, string $name): void
    {
        $disk = $this->offsiteDisk();
        if ($disk === null) {
            return;
        }

        $stream = fopen($file, 'rb');
        if ($stream === false || ! Storage::disk($disk)->put(config('fitnessos.ops.backup.disk_path').'/'.$name, $stream)) {
            throw new RuntimeException("Copying the backup to the {$disk} disk failed.");
        }
        if (is_resource($stream)) {
            fclose($stream);
        }
    }

    private function offsiteDisk(): ?string
    {
        $disk = config('fitnessos.ops.backup.disk');

        return is_string($disk) && $disk !== '' ? $disk : null;
    }
}
