<?php
require __DIR__ . '/config.php';
// POST {"nickname":"..."} -> создаёт игрока при первом нике и возвращает его ID.
// Тот же ник всегда получает тот же ID.
$d = body_json();
$nick = trim((string)($d['nickname'] ?? ''));
if ($nick === '') $nick = 'Стажёр';
if (mb_strlen($nick) > 18) $nick = mb_substr($nick, 0, 18);

$stmt = $pdo->prepare("INSERT INTO players (nickname) VALUES (?) ON DUPLICATE KEY UPDATE last_seen = NOW(), id = LAST_INSERT_ID(id)");
$stmt->execute([$nick]);
$id = (int)$pdo->lastInsertId();
out(['ok' => true, 'player_id' => $id, 'nickname' => $nick]);
