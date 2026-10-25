<?php
require __DIR__ . '/config.php';
// GET -> топ-10 рекордов. POST {"player_id":..., "trust":..., "avg":..., "diff":..., "mode":..., "days":...} -> добавить рекорд.
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $d = body_json();
    $pid = (int)($d['player_id'] ?? 0);
    if ($pid <= 0) out(['ok' => false, 'error' => 'no_player'], 400);
    $pdo->prepare("INSERT INTO leaderboard (player_id, trust, avg_calibration, diff, mode, days) VALUES (?, ?, ?, ?, ?, ?)")
        ->execute([$pid, (int)($d['trust'] ?? 0), (int)($d['avg'] ?? 0), (string)($d['diff'] ?? ''), (string)($d['mode'] ?? 'campaign'), (int)($d['days'] ?? 7)]);
    out(['ok' => true]);
}
$rows = $pdo->query("SELECT p.nickname AS name, l.trust, l.avg_calibration AS avg, l.diff, l.mode, l.days, DATE(l.played_at) AS date
  FROM leaderboard l JOIN players p ON p.id = l.player_id
  ORDER BY l.trust DESC, l.avg_calibration DESC LIMIT 10")->fetchAll();
out(['ok' => true, 'records' => $rows]);
