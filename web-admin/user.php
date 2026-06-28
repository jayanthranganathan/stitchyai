<?php

declare(strict_types=1);

require_once __DIR__ . '/lib/helpers.php';
require_login();

$pdo = db();
$userId = (string) ($_GET['id'] ?? '');

$us = $pdo->prepare('SELECT id, full_name, phone, email, is_active, created_at FROM user_accounts WHERE id = :id');
$us->execute(['id' => $userId]);
$user = $us->fetch();
if (!$user) {
    layout_header('User');
    echo '<div class="card empty">User not found. <a href="users.php">Back to users</a></div>';
    layout_footer();
    exit;
}

// Profiles
$customer = fetch_one($pdo, 'SELECT id, plan_tier, credit_balance, addresses FROM customer_profiles WHERE user_id = :id', $userId);
$tailor   = fetch_one($pdo, 'SELECT id, approval_state, city, bio, rating FROM tailor_profiles WHERE user_id = :id', $userId);
$delivery = fetch_one($pdo, 'SELECT id, approval_state, city, vehicle_type, is_online FROM delivery_profiles WHERE user_id = :id', $userId);

function fetch_one(PDO $pdo, string $sql, string $id): ?array
{
    $st = $pdo->prepare($sql);
    $st->execute(['id' => $id]);
    $r = $st->fetch();
    return $r ?: null;
}

function truthy(mixed $v): bool
{
    return $v === true || $v === 't' || $v === 1 || $v === '1';
}

function credit_kind_label(string $k): string
{
    return [
        'earn_order'     => 'Earned on order',
        'redeem_order'   => 'Redeemed on order',
        'redeem_upgrade' => 'Plan upgrade',
        'promo'          => 'Promotional credit',
        'refund'         => 'Refund',
    ][$k] ?? ucfirst(str_replace('_', ' ', $k));
}

$initials = strtoupper(substr(preg_replace('/[^A-Za-z ]/', '', (string) $user['full_name']) ?: '?', 0, 1));

layout_header('User · ' . ($user['full_name'] ?? $user['phone']));
?>
<p class="muted"><a href="users.php">← All users</a></p>

<div class="card" style="display:flex;align-items:center;gap:14px">
  <div style="width:52px;height:52px;border-radius:50%;background:var(--maroon);color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700"><?= e($initials) ?></div>
  <div style="flex:1">
    <div style="font-size:18px;font-weight:700"><?= e($user['full_name'] ?? 'Unnamed') ?></div>
    <div class="muted"><?= e($user['phone']) ?><?= $user['email'] ? ' · ' . e($user['email']) : '' ?></div>
    <div class="actions" style="margin-top:6px">
      <?php if ($customer): ?><span class="pill pill-blue">Customer</span><?php endif; ?>
      <?php if ($tailor): ?><span class="pill pill-violet">Tailor</span><?php endif; ?>
      <?php if ($delivery): ?><span class="pill pill-amber">Delivery</span><?php endif; ?>
      <?= truthy($user['is_active']) ? '<span class="pill pill-green">Active</span>' : '<span class="pill pill-red">Inactive</span>' ?>
    </div>
  </div>
  <div class="muted" style="text-align:right">Joined<br><?= dt($user['created_at']) ?></div>
</div>

<?php if ($customer): ?>
  <?php
    $cpid = $customer['id'];
    // Orders
    $oq = $pdo->prepare(
        "SELECT o.id, o.status, o.total_amount, o.credits_redeemed, o.placed_at, o.expected_delivery_date, o.progress_percent,
                (SELECT string_agg(COALESCE(d.name, c.name, 'Custom'), ', ')
                   FROM order_items oi
                   LEFT JOIN designs d ON d.id = oi.design_id
                   LEFT JOIN categories c ON c.id = oi.category_id
                  WHERE oi.order_id = o.id) AS items
         FROM orders o WHERE o.customer_id = :cpid ORDER BY o.created_at DESC LIMIT 100"
    );
    $oq->execute(['cpid' => $cpid]);
    $orders = $oq->fetchAll();

    // Credit ledger
    $cq = $pdo->prepare(
        'SELECT amount, kind, balance_after, note, created_at
         FROM credit_transactions WHERE customer_id = :cpid ORDER BY created_at DESC LIMIT 100'
    );
    $cq->execute(['cpid' => $cpid]);
    $ledger = $cq->fetchAll();

    // Addresses (JSONB)
    $addresses = [];
    if (!empty($customer['addresses'])) {
        $decoded = json_decode((string) $customer['addresses'], true);
        if (is_array($decoded)) {
            $addresses = $decoded;
        }
    }
  ?>

  <div class="stats">
    <div class="stat"><div class="n"><?= e(ucfirst((string) $customer['plan_tier'])) ?></div><div class="l">Plan tier</div></div>
    <div class="stat"><div class="n"><?= money((float) $customer['credit_balance']) ?></div><div class="l">Credit balance</div></div>
    <div class="stat"><div class="n"><?= count($orders) ?></div><div class="l">Orders</div></div>
  </div>

  <h2>Addresses</h2>
  <?php if (!$addresses): ?>
    <div class="card empty">No saved addresses.</div>
  <?php else: ?>
    <div class="card">
    <?php foreach ($addresses as $a): ?>
      <?php
        $line1 = $a['line1'] ?? $a['street'] ?? '';
        $parts = array_filter([$line1, $a['line2'] ?? '', $a['city'] ?? '', $a['state'] ?? '', $a['pincode'] ?? '']);
      ?>
      <div style="padding:6px 0;border-bottom:1px solid var(--line)">
        <strong><?= e($a['label'] ?? 'Address') ?></strong>
        <span class="muted"> — <?= e(implode(', ', array_map('strval', $parts))) ?></span>
        <?php if (!empty($a['landmark'])): ?><span class="muted"> · <?= e((string) $a['landmark']) ?></span><?php endif; ?>
      </div>
    <?php endforeach; ?>
    </div>
  <?php endif; ?>

  <h2>Orders (<?= count($orders) ?>)</h2>
  <?php if (!$orders): ?>
    <div class="card empty">No orders yet.</div>
  <?php else: ?>
    <table>
      <thead><tr><th>Order</th><th>Items</th><th>Amount</th><th>Status</th><th>Placed</th><th>ETA</th></tr></thead>
      <tbody>
      <?php foreach ($orders as $o): ?>
        <tr>
          <td>#<?= e(substr($o['id'], 0, 8)) ?></td>
          <td><?= e($o['items'] ?? '—') ?></td>
          <td class="num"><?= money((float) $o['total_amount']) ?><?php if ((float) $o['credits_redeemed'] > 0): ?><div class="muted">−<?= money((float) $o['credits_redeemed']) ?> credits</div><?php endif; ?></td>
          <td><?= status_pill($o['status']) ?><div class="muted"><?= (int) $o['progress_percent'] ?>%</div></td>
          <td class="muted"><?= dt($o['placed_at']) ?></td>
          <td><?= $o['expected_delivery_date'] ? e($o['expected_delivery_date']) : '<span class="muted">—</span>' ?></td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  <?php endif; ?>

  <h2>Credit ledger (<?= count($ledger) ?>)</h2>
  <?php if (!$ledger): ?>
    <div class="card empty">No credit activity.</div>
  <?php else: ?>
    <table>
      <thead><tr><th>Type</th><th>Note</th><th>Amount</th><th>Balance after</th><th>When</th></tr></thead>
      <tbody>
      <?php foreach ($ledger as $t): $amt = (float) $t['amount']; ?>
        <tr>
          <td><?= e(credit_kind_label((string) $t['kind'])) ?></td>
          <td class="muted"><?= e($t['note'] ?? '—') ?></td>
          <td class="num" style="color:<?= $amt >= 0 ? '#1F8A4C' : '#C0392B' ?>"><?= ($amt >= 0 ? '+' : '') . money($amt) ?></td>
          <td><?= money((float) $t['balance_after']) ?></td>
          <td class="muted"><?= dt($t['created_at']) ?></td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  <?php endif; ?>
<?php endif; ?>

<?php if ($tailor): ?>
  <h2>Tailor profile</h2>
  <div class="card">
    <div class="actions" style="margin-bottom:8px"><?= status_pill((string) $tailor['approval_state']) ?>
      <?php if ($tailor['rating'] !== null): ?><span class="pill pill-amber"><?= e(number_format((float) $tailor['rating'], 1)) ?> ★</span><?php endif; ?>
    </div>
    <div><strong>City:</strong> <?= e($tailor['city'] ?? '—') ?></div>
    <?php if (!empty($tailor['bio'])): ?><div class="muted" style="margin-top:6px"><?= e((string) $tailor['bio']) ?></div><?php endif; ?>
  </div>
<?php endif; ?>

<?php if ($delivery): ?>
  <h2>Delivery profile</h2>
  <div class="card">
    <div class="actions" style="margin-bottom:8px"><?= status_pill((string) $delivery['approval_state']) ?>
      <?= truthy($delivery['is_online']) ? '<span class="pill pill-green">Online</span>' : '<span class="pill pill-gray">Offline</span>' ?>
    </div>
    <div><strong>City:</strong> <?= e($delivery['city'] ?? '—') ?> · <strong>Vehicle:</strong> <?= e(ucfirst((string) $delivery['vehicle_type'])) ?></div>
  </div>
<?php endif; ?>

<?php
layout_footer();
