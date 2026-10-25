-- ============================================================
-- Длинный день на маяке: прогресс, ачивки, рекорды
-- Импорт: phpMyAdmin -> Импорт -> выбрать этот файл
-- База будет создана автоматически: lighthouse_game
-- ============================================================

CREATE DATABASE IF NOT EXISTS `lighthouse_game`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `lighthouse_game`;

-- Игроки: ID создаётся автоматически при первом вводе ника
CREATE TABLE IF NOT EXISTS `players` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nickname` VARCHAR(18) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_seen` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_players_nickname` (`nickname`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Сохранение прогресса: одна актуальная запись на игрока (+ полный снимок состояния JSON)
CREATE TABLE IF NOT EXISTS `saves` (
  `player_id` INT UNSIGNED NOT NULL,
  `mode` VARCHAR(16) NOT NULL DEFAULT 'campaign',
  `diff` VARCHAR(16) NOT NULL DEFAULT 'intern',
  `day` INT NOT NULL DEFAULT 0,
  `trust` INT NOT NULL DEFAULT 50,
  `coins` INT NOT NULL DEFAULT 0,
  `fuel` DECIMAL(7,2) NOT NULL DEFAULT 60.00,
  `streak` INT NOT NULL DEFAULT 0,
  `state_json` LONGTEXT NOT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`player_id`),
  CONSTRAINT `fk_saves_player` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ачивки игрока
CREATE TABLE IF NOT EXISTS `player_achievements` (
  `player_id` INT UNSIGNED NOT NULL,
  `achievement_id` VARCHAR(32) NOT NULL,
  `unlocked_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`player_id`, `achievement_id`),
  CONSTRAINT `fk_ach_player` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица рекордов
CREATE TABLE IF NOT EXISTS `leaderboard` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `player_id` INT UNSIGNED NOT NULL,
  `trust` INT NOT NULL,
  `avg_calibration` INT NOT NULL,
  `diff` VARCHAR(32) NOT NULL,
  `mode` VARCHAR(16) NOT NULL DEFAULT 'campaign',
  `days` INT NOT NULL DEFAULT 7,
  `played_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_leaderboard_score` (`trust` DESC, `avg_calibration` DESC),
  CONSTRAINT `fk_lb_player` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Накопленная статистика за все игры
CREATE TABLE IF NOT EXISTS `player_stats` (
  `player_id` INT UNSIGNED NOT NULL,
  `forecasts` INT NOT NULL DEFAULT 0,
  `tasks` INT NOT NULL DEFAULT 0,
  `repairs` INT NOT NULL DEFAULT 0,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`player_id`),
  CONSTRAINT `fk_stats_player` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Демо-игрок для проверки рекордов (можно удалить)
INSERT INTO `players` (`nickname`) VALUES ('Матвей')
  ON DUPLICATE KEY UPDATE `id` = LAST_INSERT_ID(`id`);
INSERT INTO `leaderboard` (`player_id`, `trust`, `avg_calibration`, `diff`, `mode`, `days`)
VALUES ((SELECT `id` FROM `players` WHERE `nickname` = 'Матвей'), 88, 81, 'Стажёр', 'campaign', 7);
