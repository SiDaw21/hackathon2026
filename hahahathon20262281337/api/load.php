<?php
require __DIR__ . '/config.php';
// GET ?player_id=1  или  ?nickname=...  -> прогресс и ачивки игрока из базы
$pid = (int)($_GET['player_id'] ?? 0);
if ($pid <= 0 && !empty($_GET['nickname'])) {
    $q = $pdo->prepare("SELECT id FROM players WHERE nickname = ?");
    $q->execute([trim((string)$_GET['nickname'])]);
    $pid = (int)($q->fetchColumn() ?: 0);
}
if ($pid <= 0) out(['ok' => false, 'error' => 'not_found'], 404);

$s = $pdo->prepare("SELECT state_json, updated_at FROM saves WHERE player_id = ?");
$s->execute([$pid]);
$row = $s->fetch();
$a = $pdo->prepare("SELECT achievement_id, DATE(unlocked_at) AS d FROM player_achievements WHERE player_id = ?");
$a->execute([$pid]);
$ach = [];
foreach ($a->fetchAll() as $r) $ach[$r['achievement_id']] = $r['d'];

out(['ok' => true, 'player_id' => $pid,
     'save' => $row ? json_decode($row['state_json'], true) : null,
     'updated_at' => $row['updated_at'] ?? null,
     'achievements' => $ach]);
