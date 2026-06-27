<?php

declare(strict_types=1);

require_once __DIR__ . '/lib/helpers.php';
require_login();

$pdo = db();

function scalar(PDO $pdo, string $sql): int
{
    return (int) $pdo->query($sql)->fetchColumn();
}

$stats = [
    'placed'     => scalar($pdo, "SELECT count(*) FROM orders WHERE status = 'placed'"),
    'confirmed'  => scalar($pdo, "SELECT count(*) FROM orders WHERE status = 'confirmed'"),
    'active'     => scalar($pdo, "SELECT count(*) FROM orders WHERE status IN ('assigned','in_progress','ready','out_for_delivery')"),
    'delivered'  => scalar($pdo, "SELECT count(*) FROM orders WHERE status = 'delivered'"),
    'tailors'    => scalar($pdo, "SELECT count(*) FROM tailor_profiles WHERE approval_state = 'under_review'"),
    'delivery'   => scalar($pdo, "SELECT count(*) FROM delivery_profiles WHERE approval_state = 'under_review'"),
];

layout_header('Dashboard');
?>
<h1>Dashboard</h1>
<p class="sub">Orders, approvals and assignments — live from the app database.</p>

<div class="stats">
  <a class="stat" href="orders.php?status=placed">
    <div class="n"><?= $stats['placed'] ?></div><div class="l">Orders awaiting approval</div>
  </a>
  <a class="stat" href="orders.php?status=confirmed">
    <div class="n"><?= $stats['confirmed'] ?></div><div class="l">Confirmed · need a tailor</div>
  </a>
  <a class="stat" href="orders.php?status=active">
    <div class="n"><?= $stats['active'] ?></div><div class="l">In progress</div>
  </a>
  <a class="stat" href="orders.php?status=delivered">
    <div class="n"><?= $stats['delivered'] ?></div><div class="l">Delivered</div>
  </a>
  <a class="stat" href="approvals.php#tailors">
    <div class="n"><?= $stats['tailors'] ?></div><div class="l">Tailors to review</div>
  </a>
  <a class="stat" href="approvals.php#delivery">
    <div class="n"><?= $stats['delivery'] ?></div><div class="l">Delivery partners to review</div>
  </a>
</div>

<div class="card">
  <strong>Workflow:</strong>
  <span class="muted">Customer places an order → you <em>approve</em> it (becomes “confirmed”, visible to tailors) →
  tailors express interest → you <em>assign</em> a tailor → tailor stitches → you <em>mark delivered</em>
  (customer earns credits automatically).</span>
</div>
<?php
layout_footer();
