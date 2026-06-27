<?php
/** PDO connection to the Neon Postgres database (shared with the FastAPI backend). */

declare(strict_types=1);

function config(): array
{
    static $cfg = null;
    if ($cfg === null) {
        $path = __DIR__ . '/../config.php';
        if (!file_exists($path)) {
            http_response_code(500);
            exit('Missing config.php — copy config.example.php to config.php and fill it in.');
        }
        $cfg = require $path;
    }
    return $cfg;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }
    $c = config()['db'];
    $dsn = sprintf(
        'pgsql:host=%s;port=%d;dbname=%s;sslmode=%s',
        $c['host'],
        $c['port'],
        $c['dbname'],
        $c['sslmode'] ?? 'require'
    );
    try {
        $pdo = new PDO($dsn, $c['user'], $c['password'], [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        exit('Database connection failed. Check config.php and that pdo_pgsql is enabled. ' . htmlspecialchars($e->getMessage()));
    }
    return $pdo;
}

/** Earn-rate per plan tier — must match backend app/core/plans.py. */
function credit_earn_multiplier(string $tier): float
{
    return match ($tier) {
        'platinum' => 0.10,
        default    => 0.05,   // standard + gold
    };
}
