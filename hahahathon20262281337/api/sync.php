<?php
require __DIR__ . '/config.php';
// POST {"player_id":1, "save":{...состояние игры...}, "achievements":{"id":"дата"}, "stats":{"forecasts":n,...}}
// Сохраняет прогресс, ачивки и статистику игрока. Вызывается игрой автоматически (локальное сохранение остаётся запасным).
$d = body_json();
$pid = (int)($d['player_id'] ?? 0);
if ($pid <= 0) out(['ok' => false, 'error' => 'no_player'], 400);
$save = $d['save'] ?? null;
if (!is_array($save)) out(['ok' => false, 'error' => 'no_save'], 400);

$stmt = $pdo->prepare("INSERT INTO saves (player_id, mode, diff, day, trust, coins, fuel, streak, state_json)
  VALUES (:pid, :mode, :diff, :day, :trust, :coins, :fuel, :streak, :json)
  ON DUPLICATE KEY UPDATE mode=VALUES(mode), diff=VALUES(diff), day=VALUES(day), trust=VALUES(trust),
    coins=VALUES(coins), fuel=VALUES(fuel), streak=VALUES(streak), state_json=VALUES(state_json)");
$stmt->execute([
    ':pid' => $pid,
    ':mode' => (string)($save['mode'] ?? 'campaign'),
    ':diff' => (string)($save['diff'] ?? 'intern'),
    ':day' => (int)($save['day'] ?? 0),
    ':trust' => (int)($save['trust'] ?? 50),
    ':coins' => (int)($save['coins'] ?? 0),
    ':fuel' => (float)($save['fuel'] ?? 60),
    ':streak' => (int)($save['streak'] ?? 0),
    ':json' => json_encode($save, JSON_UNESCAPED_UNICODE),
]);

$ach = $d['achievements'] ?? [];
if (is_array($ach) && $ach) {
    $ins = $pdo->prepare("INSERT IGNORE INTO player_achievements (player_id, achievement_id, unlocked_at) VALUES (?, ?, ?)");
    foreach ($ach as $aid => $date) {
        $dt = is_string($date) && preg_match('/^\d{4}-\d{2}-\d{2}/', $date) ? $date : date('Y-m-d H:i:s');
        $ins->execute([$pid, (string)$aid, $dt]);
    }
}

$st = $d['stats'] ?? [];
if (is_array($st)) {
    $pdo->prepare("INSERT INTO player_stats (player_id, forecasts, tasks, repairs) VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE forecasts=VALUES(forecasts), tasks=VALUES(tasks), repairs=VALUES(repairs)")
      ->execute([$pid, (int)($st['forecasts'] ?? 0), (int)($st['tasks'] ?? 0), (int)($st['repairs'] ?? 0)]);
}

out(['ok' => true]);
