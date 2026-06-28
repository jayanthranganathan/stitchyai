<?php

declare(strict_types=1);

require_once __DIR__ . '/lib/helpers.php';
require_login();

$pdo = db();

// ── Counts for the tabs ───────────────────────────────────────────────────────
function count_of(PDO $pdo, string $sql): int
{
    return (int) $pdo->query($sql)->fetchColumn();
}
$counts = [
    'all'       => count_of($pdo, 'SELECT count(*) FROM user_accounts'),
    'customers' => count_of($pdo, 'SELECT count(*) FROM customer_profiles'),
    'tailors'   => count_of($pdo, 'SELECT count(*) FROM tailor_profiles'),
    'delivery'  => count_of($pdo, 'SELECT count(*) FROM delivery_profiles'),
];

$role = (string) ($_GET['role'] ?? 'customers');
if (!in_array($role, ['all', 'customers', 'tailors', 'delivery'], true)) {
    $role = 'customers';
}
$q = trim((string) ($_GET['q'] ?? ''));

// Build the role-specific query
$params = [];
$searchSql = '';
if ($q !== '') {
    $searchSql = ' AND (ua.full_name ILIKE :q OR ua.phone ILIKE :q OR ua.email ILIKE :q)';
    $params['q'] = '%' . $q . '%';
}

switch ($role) {
    case 'tailors':
        $sql = "SELECT ua.id AS user_id, ua.full_name, ua.phone, ua.email, ua.created_at,
                       tp.approval_state, tp.city, tp.rating
                FROM tailor_profiles tp JOIN user_accounts ua ON ua.id = tp.user_id
                WHERE 1=1 $searchSql ORDER BY ua.created_at DESC LIMIT 300";
        break;
    case 'delivery':
        $sql = "SELECT ua.id AS user_id, ua.full_name, ua.phone, ua.email, ua.created_at,
                       dp.approval_state, dp.city, dp.vehicle_type, dp.is_online
                FROM delivery_profiles dp JOIN user_accounts ua ON ua.id = dp.user_id
                WHERE 1=1 $searchSql ORDER BY ua.created_at DESC LIMIT 300";
        break;
    case 'all':
        $sql = "SELECT ua.id AS user_id, ua.full_name, ua.phone, ua.email, ua.created_at,
                       (cp.id IS NOT NULL) AS is_customer,
                       (tp.id IS NOT NULL) AS is_tailor,
                       (dp.id IS NOT NULL) AS is_delivery,
                       (ap.id IS NOT NULL) AS is_admin
                FROM user_accounts ua
                LEFT JOIN customer_profiles cp ON cp.user_id = ua.id
                LEFT JOIN tailor_profiles   tp ON tp.user_id = ua.id
                LEFT JOIN delivery_profiles dp ON dp.user_id = ua.id
                LEFT JOIN admin_profiles    ap ON ap.user_id = ua.id
                WHERE 1=1 $searchSql ORDER BY ua.created_at DESC LIMIT 300";
        break;
    case 'customers':
    default:
        $sql = "SELECT ua.id AS user_id, ua.full_name, ua.phone, ua.email, ua.created_at,
                       cp.plan_tier, cp.credit_balance
                FROM customer_profiles cp JOIN user_accounts ua ON ua.id = cp.user_id
                WHERE 1=1 $searchSql ORDER BY ua.created_at DESC LIMIT 300";
        break;
}
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll();

/** Postgres bool comes back as 't'/'f' (or bool) — normalise. */
function truthy(mixed $v): bool
{
    return $v === true || $v === 't' || $v === 1 || $v === '1';
}

function plan_badge(string $tier): string
{
    $cls = match ($tier) {
        'platinum' => 'pill-violet',
        'gold'     => 'pill-amber',
        default    => 'pill-gray',
    };
    return '<span class="pill ' . $cls . '">' . e(ucfirst($tier)) . '</span>';
}

$tabs = ['all' => 'All', 'customers' => 'Customers', 'tailors' => 'Tailors', 'delivery' => 'Delivery'];

layout_header('Users');
?>
<h1>Users</h1>
<p class="sub">Everyone on the platform — filter by role.</p>

<div class="filters">
  <?php foreach ($tabs as $key => $label): ?>
    <a class="btn btn-sm <?= $role === $key ? '' : 'btn-ghost' ?>"
       href="users.php?role=<?= e($key) ?><?= $q !== '' ? '&q=' . urlencode($q) : '' ?>">
       <?= e($label) ?> (<?= $counts[$key] ?>)
    </a>
  <?php endforeach; ?>
  <form method="get" class="inline actions" style="margin-left:auto">
    <input type="hidden" name="role" value="<?= e($role) ?>">
    <input type="text" name="q" value="<?= e($q) ?>" placeholder="Search name / phone / email">
    <button class="btn-sm" type="submit">Search</button>
    <?php if ($q !== ''): ?><a class="btn btn-sm btn-ghost" href="users.php?role=<?= e($role) ?>">Clear</a><?php endif; ?>
  </form>
</div>

<?php if (!$rows): ?>
  <div class="card empty">No users found<?= $q !== '' ? ' for “' . e($q) . '”' : '' ?>.</div>
<?php else: ?>
<table>
  <thead>
    <tr>
      <th>Name</th><th>Phone</th><th>Email</th>
      <?php if ($role === 'customers'): ?>
        <th>Plan</th><th>Credits</th>
      <?php elseif ($role === 'tailors'): ?>
        <th>Status</th><th>City</th><th>Rating</th>
      <?php elseif ($role === 'delivery'): ?>
        <th>Status</th><th>City</th><th>Vehicle</th><th>Online</th>
      <?php else: ?>
        <th>Roles</th>
      <?php endif; ?>
      <th>Joined</th>
    </tr>
  </thead>
  <tbody>
  <?php foreach ($rows as $r): ?>
    <tr>
      <td><a href="user.php?id=<?= e($r['user_id']) ?>"><?= e($r['full_name'] ?? '(unnamed)') ?></a></td>
      <td><?= e($r['phone']) ?></td>
      <td class="muted"><?= e($r['email'] ?? '—') ?></td>

      <?php if ($role === 'customers'): ?>
        <td><?= plan_badge((string) ($r['plan_tier'] ?? 'standard')) ?></td>
        <td class="num"><?= money((float) ($r['credit_balance'] ?? 0)) ?></td>

      <?php elseif ($role === 'tailors'): ?>
        <td><?= status_pill((string) $r['approval_state']) ?></td>
        <td><?= e($r['city'] ?? '—') ?></td>
        <td><?= $r['rating'] !== null ? e(number_format((float) $r['rating'], 1)) . ' ★' : '<span class="muted">—</span>' ?></td>

      <?php elseif ($role === 'delivery'): ?>
        <td><?= status_pill((string) $r['approval_state']) ?></td>
        <td><?= e($r['city'] ?? '—') ?></td>
        <td><?= e(ucfirst((string) $r['vehicle_type'])) ?></td>
        <td><?= truthy($r['is_online']) ? '<span class="pill pill-green">Online</span>' : '<span class="pill pill-gray">Offline</span>' ?></td>

      <?php else: ?>
        <td class="actions">
          <?php if (truthy($r['is_customer'])): ?><span class="pill pill-blue">Customer</span><?php endif; ?>
          <?php if (truthy($r['is_tailor'])): ?><span class="pill pill-violet">Tailor</span><?php endif; ?>
          <?php if (truthy($r['is_delivery'])): ?><span class="pill pill-amber">Delivery</span><?php endif; ?>
          <?php if (truthy($r['is_admin'])): ?><span class="pill pill-red">Admin</span><?php endif; ?>
        </td>
      <?php endif; ?>

      <td class="muted"><?= dt($r['created_at']) ?></td>
    </tr>
  <?php endforeach; ?>
  </tbody>
</table>
<p class="muted" style="margin-top:8px">Showing up to 300 rows.</p>
<?php endif; ?>
<?php
layout_footer();
