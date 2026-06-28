<?php
/** Session auth + CSRF for the admin panel. */

declare(strict_types=1);

require_once __DIR__ . '/db.php';

function start_session(): void
{
    if (session_status() === PHP_SESSION_NONE) {
        session_set_cookie_params([
            'httponly' => true,
            'samesite' => 'Lax',
            'secure'   => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
        ]);
        session_start();
    }
}

function attempt_login(string $username, string $password): bool
{
    $admins = config()['admins'] ?? [];
    $hash = $admins[$username] ?? null;
    if ($hash && password_verify($password, $hash)) {
        start_session();
        session_regenerate_id(true);
        $_SESSION['admin'] = $username;
        return true;
    }
    return false;
}

function require_login(): void
{
    start_session();
    if (empty($_SESSION['admin'])) {
        header('Location: login.php');
        exit;
    }
}

function current_admin(): string
{
    start_session();
    return (string) ($_SESSION['admin'] ?? '');
}

function logout(): void
{
    start_session();
    $_SESSION = [];
    session_destroy();
}

// ── CSRF ─────────────────────────────────────────────────────────────────────

function csrf_token(): string
{
    start_session();
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

function csrf_field(): string
{
    return '<input type="hidden" name="csrf" value="' . htmlspecialchars(csrf_token(), ENT_QUOTES) . '">';
}

function check_csrf(): void
{
    start_session();
    $sent = $_POST['csrf'] ?? '';
    if (!is_string($sent) || !hash_equals($_SESSION['csrf'] ?? '', $sent)) {
        http_response_code(400);
        exit('Invalid CSRF token. Reload the page and try again.');
    }
}
