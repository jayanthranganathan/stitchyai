<?php

declare(strict_types=1);

require_once __DIR__ . '/lib/helpers.php';
require_login();

$pdo = db();

// ── Actions (POST) ───────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    check_csrf();
    $action  = (string) ($_POST['action'] ?? '');
    $orderId = (string) ($_POST['order_id'] ?? '');

    try {
        switch ($action) {
            case 'approve_order':
                approve_order($pdo, $orderId);
                flash_set('ok', 'Order approved — now visible to tailors.');
                break;
            case 'assign_tailor':
                assign_tailor($pdo, $orderId, (string) ($_POST['tailor_id'] ?? ''));
                flash_set('ok', 'Tailor assigned. Order moved to “assigned”.');
                break;
            case 'mark_delivered':
                mark_delivered($pdo, $orderId);
                flash_set('ok', 'Order delivered. Customer credits awarded.');
                break;
            default:
                flash_set('error', 'Unknown action.');
        }
    } catch (Throwable $ex) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        flash_set('error', $ex->getMessage());
    }
    $back = 'orders.php' . (isset($_POST['status']) ? '?status=' . urlencode((string) $_POST['status']) : '');
    header('Location: ' . $back);
    exit;
}

// ── Action implementations (mirror backend AdminService) ──────────────────────

function approve_order(PDO $pdo, string $orderId): void
{
    $st = $pdo->prepare('SELECT status, progress_percent FROM orders WHERE id = :id');
    $st->execute(['id' => $orderId]);
    $o = $st->fetch();
    if (!$o) {
        throw new RuntimeException('Order not found.');
    }
    if ($o['status'] !== 'placed') {
        throw new RuntimeException("Order is '{$o['status']}' — only 'placed' orders can be approved.");
    }
    $pdo->beginTransaction();
    $pdo->prepare("UPDATE orders SET status = 'confirmed'::orderstatus WHERE id = :id")
        ->execute(['id' => $orderId]);
    $pdo->prepare(
        'INSERT INTO order_status_history (order_id, status, progress_percent, note, actor_role)
         VALUES (:oid, CAST(:st AS orderstatus), :pct, :note, :role)'
    )->execute([
        'oid' => $orderId, 'st' => 'confirmed', 'pct' => (int) $o['progress_percent'],
        'note' => 'Order approved by admin — open for tailor interest', 'role' => 'admin',
    ]);
    $pdo->commit();
}

function assign_tailor(PDO $pdo, string $orderId, string $tailorId): void
{
    if ($tailorId === '') {
        throw new RuntimeException('Pick a tailor to assign.');
    }
    $st = $pdo->prepare('SELECT status, expected_delivery_date FROM orders WHERE id = :id');
    $st->execute(['id' => $orderId]);
    $o = $st->fetch();
    if (!$o) {
        throw new RuntimeException('Order not found.');
    }
    if ($o['status'] !== 'confirmed') {
        throw new RuntimeException("Order is '{$o['status']}' — only 'confirmed' orders can be assigned.");
    }
    $ts = $pdo->prepare('SELECT approval_state FROM tailor_profiles WHERE id = :id');
    $ts->execute(['id' => $tailorId]);
    $t = $ts->fetch();
    if (!$t) {
        throw new RuntimeException('Tailor not found.');
    }
    if ($t['approval_state'] !== 'approved') {
        throw new RuntimeException('Tailor is not approved yet.');
    }

    $pdo->beginTransaction();
    $pdo->prepare(
        "INSERT INTO order_assignments (order_id, tailor_id, state, progress_percent, agreed_delivery_date)
         VALUES (:oid, :tid, 'accepted'::assignmentstate, 0, :eta)"
    )->execute(['oid' => $orderId, 'tid' => $tailorId, 'eta' => $o['expected_delivery_date']]);
    $pdo->prepare("UPDATE orders SET status = 'assigned'::orderstatus, progress_percent = 15 WHERE id = :id")
        ->execute(['id' => $orderId]);
    $pdo->prepare(
        'INSERT INTO order_status_history (order_id, status, progress_percent, note, actor_role)
         VALUES (:oid, CAST(:st AS orderstatus), 15, :note, :role)'
    )->execute(['oid' => $orderId, 'st' => 'assigned', 'note' => 'Assigned to tailor by admin', 'role' => 'admin']);
    $pdo->commit();
}

function mark_delivered(PDO $pdo, string $orderId): void
{
    $pdo->beginTransaction();
    $st = $pdo->prepare('SELECT status, customer_id, total_amount FROM orders WHERE id = :id FOR UPDATE');
    $st->execute(['id' => $orderId]);
    $o = $st->fetch();
    if (!$o) {
        throw new RuntimeException('Order not found.');
    }
    if ($o['status'] === 'delivered') {
        $pdo->commit();
        return;
    }
    $pdo->prepare("UPDATE orders SET status = 'delivered'::orderstatus, progress_percent = 100 WHERE id = :id")
        ->execute(['id' => $orderId]);
    $pdo->prepare(
        "INSERT INTO order_status_history (order_id, status, progress_percent, note, actor_role)
         VALUES (:oid, 'delivered'::orderstatus, 100, 'Order delivered', 'admin')"
    )->execute(['oid' => $orderId]);

    // Award completion credits (idempotent) — mirrors CreditsService.award_for_delivered_order
    $cp = $pdo->prepare('SELECT id, plan_tier, credit_balance FROM customer_profiles WHERE id = :id FOR UPDATE');
    $cp->execute(['id' => $o['customer_id']]);
    $customer = $cp->fetch();
    if ($customer) {
        $dup = $pdo->prepare(
            "SELECT 1 FROM credit_transactions WHERE reference_id = :oid AND kind = 'earn_order'::creditkind LIMIT 1"
        );
        $dup->execute(['oid' => $orderId]);
        if (!$dup->fetchColumn()) {
            $mult   = credit_earn_multiplier((string) $customer['plan_tier']);
            $amount = round(((float) $o['total_amount']) * $mult, 2);
            if ($amount > 0) {
                $newBal = round(((float) $customer['credit_balance']) + $amount, 2);
                $pdo->prepare(
                    "INSERT INTO credit_transactions (customer_id, amount, kind, balance_after, reference_id, note)
                     VALUES (:cid, :amt, 'earn_order'::creditkind, :bal, :oid, :note)"
                )->execute([
                    'cid' => $customer['id'], 'amt' => $amount, 'bal' => $newBal,
                    'oid' => $orderId, 'note' => 'Earned on delivered order ' . substr($orderId, 0, 8),
                ]);
                $pdo->prepare('UPDATE customer_profiles SET credit_balance = :bal WHERE id = :id')
                    ->execute(['bal' => $newBal, 'id' => $customer['id']]);
            }
        }
    }
    $pdo->commit();
}

// ── Listing (GET) ─────────────────────────────────────────────────────────────
$filter = (string) ($_GET['status'] ?? 'all');
$where  = '';
$params = [];
if ($filter === 'active') {
    $where = "WHERE o.status IN ('assigned','in_progress','ready','out_for_delivery')";
} elseif ($filter !== 'all') {
    $where = 'WHERE o.status = CAST(:status AS orderstatus)';
    $params['status'] = $filter;
}

$sql = "SELECT o.id, o.status, o.total_amount, o.placed_at, o.expected_delivery_date,
               o.progress_percent, o.credits_redeemed,
               ua.full_name AS customer_name, ua.phone AS customer_phone
        FROM orders o
        JOIN customer_profiles cp ON cp.id = o.customer_id
        JOIN user_accounts ua ON ua.id = cp.user_id
        $where
        ORDER BY o.created_at DESC
        LIMIT 200";
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$orders = $stmt->fetchAll();

$orderIds = array_column($orders, 'id');

// Items (design name) per order
$itemsByOrder = [];
if ($orderIds) {
    $in = implode(',', array_fill(0, count($orderIds), '?'));
    $iq = $pdo->prepare(
        "SELECT oi.order_id, COALESCE(d.name, c.name, 'Custom') AS label, oi.quantity
         FROM order_items oi
         LEFT JOIN designs d ON d.id = oi.design_id
         LEFT JOIN categories c ON c.id = oi.category_id
         WHERE oi.order_id IN ($in)"
    );
    $iq->execute($orderIds);
    foreach ($iq->fetchAll() as $r) {
        $itemsByOrder[$r['order_id']][] = $r['label'] . ($r['quantity'] > 1 ? " ×{$r['quantity']}" : '');
    }
}

// Interested tailors per confirmed order
$interestsByOrder = [];
$statusById = array_column($orders, 'status', 'id');
$confirmedIds = array_values(array_filter($orderIds, fn ($id) => ($statusById[$id] ?? '') === 'confirmed'));
if ($confirmedIds) {
    $in = implode(',', array_fill(0, count($confirmedIds), '?'));
    $tq = $pdo->prepare(
        "SELECT ti.order_id, ti.tailor_id, ti.expected_delivery_date, ua.full_name AS tailor_name
         FROM tailor_interests ti
         JOIN tailor_profiles tp ON tp.id = ti.tailor_id
         JOIN user_accounts ua ON ua.id = tp.user_id
         WHERE ti.order_id IN ($in)"
    );
    $tq->execute($confirmedIds);
    foreach ($tq->fetchAll() as $r) {
        $interestsByOrder[$r['order_id']][] = $r;
    }
}
// Fallback list of approved tailors (when an order has no interests yet)
$approvedTailors = $pdo->query(
    "SELECT tp.id, ua.full_name FROM tailor_profiles tp
     JOIN user_accounts ua ON ua.id = tp.user_id
     WHERE tp.approval_state = 'approved' ORDER BY ua.full_name"
)->fetchAll();

$tabs = ['all' => 'All', 'placed' => 'Awaiting approval', 'confirmed' => 'Need tailor', 'active' => 'In progress', 'delivered' => 'Delivered', 'cancelled' => 'Cancelled'];

layout_header('Orders');
?>
<h1>Orders</h1>
<div class="filters">
  <?php foreach ($tabs as $key => $label): ?>
    <a class="btn btn-sm <?= $filter === $key ? '' : 'btn-ghost' ?>" href="orders.php?status=<?= e($key) ?>"><?= e($label) ?></a>
  <?php endforeach; ?>
</div>

<?php if (!$orders): ?>
  <div class="card empty">No orders in this view.</div>
<?php else: ?>
<table>
  <thead>
    <tr><th>Order</th><th>Customer</th><th>Items</th><th>Amount</th><th>Status</th><th>ETA</th><th>Action</th></tr>
  </thead>
  <tbody>
  <?php foreach ($orders as $o): $id = $o['id']; ?>
    <tr>
      <td>#<?= e(substr($id, 0, 8)) ?><div class="muted"><?= dt($o['placed_at']) ?></div></td>
      <td><?= e($o['customer_name'] ?? '—') ?><div class="muted"><?= e($o['customer_phone']) ?></div></td>
      <td><?= e(implode(', ', $itemsByOrder[$id] ?? [])) ?: '<span class="muted">—</span>' ?></td>
      <td class="num"><?= money((float) $o['total_amount']) ?>
        <?php if ((float) $o['credits_redeemed'] > 0): ?><div class="muted">−<?= money((float) $o['credits_redeemed']) ?> credits</div><?php endif; ?>
      </td>
      <td><?= status_pill($o['status']) ?><div class="muted"><?= (int) $o['progress_percent'] ?>%</div></td>
      <td><?= $o['expected_delivery_date'] ? e($o['expected_delivery_date']) : '<span class="muted">—</span>' ?></td>
      <td>
        <div class="actions">
        <?php if ($o['status'] === 'placed'): ?>
          <form method="post" class="inline">
            <?= csrf_field() ?>
            <input type="hidden" name="action" value="approve_order">
            <input type="hidden" name="order_id" value="<?= e($id) ?>">
            <input type="hidden" name="status" value="<?= e($filter) ?>">
            <button class="btn-sm" type="submit">✓ Approve</button>
          </form>
        <?php elseif ($o['status'] === 'confirmed'): ?>
          <?php $opts = $interestsByOrder[$id] ?? []; ?>
          <form method="post" class="inline actions">
            <?= csrf_field() ?>
            <input type="hidden" name="action" value="assign_tailor">
            <input type="hidden" name="order_id" value="<?= e($id) ?>">
            <input type="hidden" name="status" value="<?= e($filter) ?>">
            <select name="tailor_id" required>
              <option value="">— assign tailor —</option>
              <?php if ($opts): ?>
                <optgroup label="Interested">
                <?php foreach ($opts as $it): ?>
                  <option value="<?= e($it['tailor_id']) ?>"><?= e($it['tailor_name']) ?><?= $it['expected_delivery_date'] ? ' · by ' . e($it['expected_delivery_date']) : '' ?></option>
                <?php endforeach; ?>
                </optgroup>
              <?php endif; ?>
              <optgroup label="All approved tailors">
              <?php foreach ($approvedTailors as $t): ?>
                <option value="<?= e($t['id']) ?>"><?= e($t['full_name']) ?></option>
              <?php endforeach; ?>
              </optgroup>
            </select>
            <button class="btn-sm" type="submit">Assign</button>
          </form>
        <?php elseif (in_array($o['status'], ['assigned','in_progress','ready','out_for_delivery'], true)): ?>
          <form method="post" class="inline" onsubmit="return confirm('Mark this order delivered? Customer credits will be awarded.');">
            <?= csrf_field() ?>
            <input type="hidden" name="action" value="mark_delivered">
            <input type="hidden" name="order_id" value="<?= e($id) ?>">
            <input type="hidden" name="status" value="<?= e($filter) ?>">
            <button class="btn-sm" type="submit">Mark delivered</button>
          </form>
        <?php else: ?>
          <span class="muted">—</span>
        <?php endif; ?>
        </div>
      </td>
    </tr>
  <?php endforeach; ?>
  </tbody>
</table>
<?php endif; ?>
<?php
layout_footer();
