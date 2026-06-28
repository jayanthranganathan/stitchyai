<?php

declare(strict_types=1);

require_once __DIR__ . '/lib/helpers.php';
require_login();

$pdo = db();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    check_csrf();
    $kind     = (string) ($_POST['kind'] ?? '');      // tailor | delivery
    $decision = (string) ($_POST['decision'] ?? '');  // approve | reject
    $id       = (string) ($_POST['id'] ?? '');
    $table    = $kind === 'delivery' ? 'delivery_profiles' : 'tailor_profiles';
    $newState = $decision === 'approve' ? 'approved' : 'rejected';

    try {
        if (!in_array($kind, ['tailor', 'delivery'], true) || !in_array($decision, ['approve', 'reject'], true)) {
            throw new RuntimeException('Invalid request.');
        }
        $upd = $pdo->prepare("UPDATE $table SET approval_state = CAST(:s AS approvalstate) WHERE id = :id");
        $upd->execute(['s' => $newState, 'id' => $id]);
        if ($upd->rowCount() === 0) {
            throw new RuntimeException('Record not found.');
        }
        flash_set('ok', ucfirst($kind) . ' ' . ($decision === 'approve' ? 'approved.' : 'rejected.'));
    } catch (Throwable $ex) {
        flash_set('error', $ex->getMessage());
    }
    header('Location: approvals.php');
    exit;
}

$tailors = $pdo->query(
    "SELECT tp.id, tp.city, tp.bio, tp.rating, ua.full_name, ua.phone, tp.created_at
     FROM tailor_profiles tp JOIN user_accounts ua ON ua.id = tp.user_id
     WHERE tp.approval_state = 'under_review' ORDER BY tp.created_at"
)->fetchAll();

$partners = $pdo->query(
    "SELECT dp.id, dp.city, dp.vehicle_type, ua.full_name, ua.phone, dp.created_at
     FROM delivery_profiles dp JOIN user_accounts ua ON ua.id = dp.user_id
     WHERE dp.approval_state = 'under_review' ORDER BY dp.created_at"
)->fetchAll();

function decide_form(string $kind, string $id, string $status): string
{
    ob_start(); ?>
    <div class="actions">
      <form method="post" class="inline"><?= csrf_field() ?>
        <input type="hidden" name="kind" value="<?= e($kind) ?>">
        <input type="hidden" name="id" value="<?= e($id) ?>">
        <input type="hidden" name="decision" value="approve">
        <button class="btn-sm" type="submit">Approve</button>
      </form>
      <form method="post" class="inline" onsubmit="return confirm('Reject this <?= e($kind) ?>?');"><?= csrf_field() ?>
        <input type="hidden" name="kind" value="<?= e($kind) ?>">
        <input type="hidden" name="id" value="<?= e($id) ?>">
        <input type="hidden" name="decision" value="reject">
        <button class="btn-sm btn-danger" type="submit">Reject</button>
      </form>
    </div>
    <?php return (string) ob_get_clean();
}

layout_header('Approvals');
?>
<h1>Approvals</h1>
<p class="sub">Tailors and delivery partners waiting for review.</p>

<h2 id="tailors">Tailors (<?= count($tailors) ?>)</h2>
<?php if (!$tailors): ?>
  <div class="card empty">No tailors awaiting review.</div>
<?php else: ?>
<table>
  <thead><tr><th>Name</th><th>Phone</th><th>City</th><th>Bio</th><th>Submitted</th><th>Decision</th></tr></thead>
  <tbody>
  <?php foreach ($tailors as $t): ?>
    <tr>
      <td><?= e($t['full_name'] ?? '—') ?></td>
      <td><?= e($t['phone']) ?></td>
      <td><?= e($t['city'] ?? '—') ?></td>
      <td class="muted"><?= e(mb_strimwidth((string) $t['bio'], 0, 80, '…')) ?></td>
      <td class="muted"><?= dt($t['created_at']) ?></td>
      <td><?= decide_form('tailor', $t['id'], 'under_review') ?></td>
    </tr>
  <?php endforeach; ?>
  </tbody>
</table>
<?php endif; ?>

<h2 id="delivery">Delivery partners (<?= count($partners) ?>)</h2>
<?php if (!$partners): ?>
  <div class="card empty">No delivery partners awaiting review.</div>
<?php else: ?>
<table>
  <thead><tr><th>Name</th><th>Phone</th><th>City</th><th>Vehicle</th><th>Submitted</th><th>Decision</th></tr></thead>
  <tbody>
  <?php foreach ($partners as $p): ?>
    <tr>
      <td><?= e($p['full_name'] ?? '—') ?></td>
      <td><?= e($p['phone']) ?></td>
      <td><?= e($p['city'] ?? '—') ?></td>
      <td><?= e(ucfirst((string) $p['vehicle_type'])) ?></td>
      <td class="muted"><?= dt($p['created_at']) ?></td>
      <td><?= decide_form('delivery', $p['id'], 'under_review') ?></td>
    </tr>
  <?php endforeach; ?>
  </tbody>
</table>
<?php endif; ?>
<?php
layout_footer();
