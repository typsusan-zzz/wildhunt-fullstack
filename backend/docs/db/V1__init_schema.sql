CREATE DATABASE IF NOT EXISTS wildhunt DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_0900_ai_ci;
USE wildhunt;

CREATE TABLE IF NOT EXISTS wh_user (
  id BIGINT PRIMARY KEY,
  username VARCHAR(64) NOT NULL,
  nickname VARCHAR(64) NOT NULL,
  avatar_url VARCHAR(512) NULL,
  password_hash VARCHAR(255) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  last_login_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_user_username (username),
  KEY idx_user_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS wh_user_auth_binding (
  id BIGINT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  provider VARCHAR(32) NOT NULL,
  open_id VARCHAR(128) NOT NULL,
  union_id VARCHAR(128) NULL,
  nickname VARCHAR(128) NULL,
  avatar_url VARCHAR(512) NULL,
  raw_json JSON NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_provider_openid (provider, open_id),
  KEY idx_binding_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS wh_player_profile (
  id BIGINT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  level INT NOT NULL DEFAULT 1,
  exp INT NOT NULL DEFAULT 0,
  rating INT NOT NULL DEFAULT 1000,
  title VARCHAR(64) NULL,
  preferred_role VARCHAR(32) NULL,
  total_play_seconds BIGINT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_profile_user (user_id),
  KEY idx_profile_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS wh_friend_relation (
  id BIGINT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  friend_user_id BIGINT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_friend_pair (user_id, friend_user_id),
  KEY idx_friend_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS wh_friend_request (
  id BIGINT PRIMARY KEY,
  from_user_id BIGINT NOT NULL,
  to_user_id BIGINT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  message VARCHAR(255) NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  KEY idx_friend_request_to (to_user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS wh_room (
  id BIGINT PRIMARY KEY,
  room_code VARCHAR(16) NOT NULL,
  name VARCHAR(64) NOT NULL,
  owner_user_id BIGINT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'WAITING',
  max_players INT NOT NULL DEFAULT 10,
  ai_deer_count INT NOT NULL DEFAULT 16,
  public_room TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_room_code (room_code),
  KEY idx_room_status (status, public_room)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS wh_room_member (
  id BIGINT PRIMARY KEY,
  room_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  role_type VARCHAR(32) NOT NULL DEFAULT 'DEER',
  ready TINYINT NOT NULL DEFAULT 0,
  owner_flag TINYINT NOT NULL DEFAULT 0,
  connected TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_room_member (room_id, user_id),
  KEY idx_room_member_room (room_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS wh_room_invite (
  id BIGINT PRIMARY KEY,
  room_id BIGINT NOT NULL,
  inviter_user_id BIGINT NOT NULL,
  invitee_user_id BIGINT NULL,
  invite_code VARCHAR(32) NOT NULL,
  channel VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  expires_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_invite_code (invite_code),
  KEY idx_invite_room (room_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS wh_match_queue (
  id BIGINT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  queue_type VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'WAITING',
  room_id BIGINT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_queue_user_status (user_id, status),
  KEY idx_queue_type (queue_type, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS wh_game_match (
  id BIGINT PRIMARY KEY,
  room_id BIGINT NOT NULL,
  status VARCHAR(32) NOT NULL,
  wolf_user_id BIGINT NULL,
  ai_deer_count INT NOT NULL DEFAULT 16,
  started_at DATETIME(3) NULL,
  finished_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  KEY idx_match_room (room_id),
  KEY idx_match_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS wh_match_player (
  id BIGINT PRIMARY KEY,
  match_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  role_type VARCHAR(32) NOT NULL,
  result VARCHAR(32) NULL,
  score_delta INT NOT NULL DEFAULT 0,
  survived TINYINT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_match_player (match_id, user_id),
  KEY idx_match_player_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS wh_match_event (
  id BIGINT PRIMARY KEY,
  match_id BIGINT NOT NULL,
  user_id BIGINT NULL,
  event_type VARCHAR(64) NOT NULL,
  payload JSON NULL,
  event_at DATETIME(3) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  KEY idx_event_match (match_id, event_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS wh_match_snapshot (
  id BIGINT PRIMARY KEY,
  match_id BIGINT NOT NULL,
  tick BIGINT NOT NULL,
  payload JSON NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  KEY idx_snapshot_match (match_id, tick)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS wh_player_stat (
  id BIGINT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  matches INT NOT NULL DEFAULT 0,
  wins INT NOT NULL DEFAULT 0,
  wolf_wins INT NOT NULL DEFAULT 0,
  deer_survivals INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_stat_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS wh_leaderboard_season (
  id BIGINT PRIMARY KEY,
  season_code VARCHAR(32) NOT NULL,
  name VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_season_code (season_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS wh_leaderboard_entry (
  id BIGINT PRIMARY KEY,
  season_code VARCHAR(32) NOT NULL,
  user_id BIGINT NOT NULL,
  rating INT NOT NULL DEFAULT 1000,
  wins INT NOT NULL DEFAULT 0,
  wolf_wins INT NOT NULL DEFAULT 0,
  deer_survivals INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_leaderboard_user (season_code, user_id),
  KEY idx_leaderboard_rating (season_code, rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS wh_notification (
  id BIGINT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  type VARCHAR(64) NOT NULL,
  payload JSON NULL,
  read_flag TINYINT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  KEY idx_notification_user (user_id, read_flag)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS wh_system_config (
  id BIGINT PRIMARY KEY,
  config_key VARCHAR(128) NOT NULL,
  config_value VARCHAR(1024) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_config_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO wh_leaderboard_season (id, season_code, name, status, created_at, updated_at, deleted)
VALUES (1, 'S0_PRESEASON', 'Preseason', 'ACTIVE', NOW(3), NOW(3), 0)
ON DUPLICATE KEY UPDATE updated_at = VALUES(updated_at);
