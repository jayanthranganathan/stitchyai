<?php
/** Shared view helpers + page chrome. */

declare(strict_types=1);

require_once __DIR__ . '/auth.php';

/** HTML-escape. */
function e(?string $s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');
}

function money(float $n): string
{
    return '₹' . number_format($n, 2);
}

function dt(?string $iso): string
{
    if (!$iso) {
        return '—';
    }
    try {
        return (new DateTime($iso))->format('d M Y, g:i A');
    } catch (Exception) {
        return e($iso);
    }
}

function flash_set(string $type, string $msg): void
{
    start_session();
    $_SESSION['flash'] = ['type' => $type, 'msg' => $msg];
}

function flash_render(): string
{
    start_session();
    if (empty($_SESSION['flash'])) {
        return '';
    }
    $f = $_SESSION['flash'];
    unset($_SESSION['flash']);
    $cls = $f['type'] === 'error' ? 'flash flash-error' : 'flash flash-ok';
    return '<div class="' . $cls . '">' . e($f['msg']) . '</div>';
}

/** Colored status pill. */
function status_pill(string $status): string
{
    $map = [
        'delivered'        => 'pill-green',
        'cancelled'        => 'pill-red',
        'undeliverable'    => 'pill-red',
        'ready'            => 'pill-amber',
        'out_for_delivery' => 'pill-amber',
        'placed'           => 'pill-blue',
        'confirmed'        => 'pill-violet',
        'approved'         => 'pill-green',
        'rejected'         => 'pill-red',
        'under_review'     => 'pill-amber',
    ];
    $cls = $map[$status] ?? 'pill-gray';
    return '<span class="pill ' . $cls . '">' . e(ucwords(str_replace('_', ' ', $status))) . '</span>';
}

function layout_header(string $title): void
{
    $admin = current_admin();
    ?><!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= e($title) ?> · Thugil Admin</title>
<link rel="stylesheet" href="assets/style.css">
</head>
<body>
<header class="topbar">
  <div class="brand">Thugil Designers <span>· Admin</span></div>
  <nav>
    <a href="index.php">Dashboard</a>
    <a href="orders.php">Orders</a>
    <a href="approvals.php">Approvals</a>
    <a href="users.php">Users</a>
  </nav>
  <div class="who">
    <span><?= e($admin) ?></span>
    <a class="logout" href="logout.php">Sign out</a>
  </div>
</header>
<main class="wrap">
<?= flash_render() ?>
<?php
}

function layout_footer(): void
{
    ?>
</main>
</body>
</html>
<?php
}
