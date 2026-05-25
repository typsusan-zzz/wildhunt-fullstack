USE wildhunt;

ALTER TABLE wh_room
  ADD COLUMN room_type VARCHAR(32) NOT NULL DEFAULT 'PLAYER' COMMENT 'PLAYER 玩家自建房间，SYSTEM 系统匹配房间' AFTER status,
  ADD COLUMN current_match_id BIGINT NULL AFTER public_room,
  ADD COLUMN closed_at DATETIME(3) NULL AFTER updated_at,
  ADD COLUMN version INT NOT NULL DEFAULT 0 AFTER closed_at;

CREATE INDEX idx_room_type_status ON wh_room (room_type, status, deleted);
CREATE INDEX idx_room_owner_status ON wh_room (owner_user_id, status, deleted);

ALTER TABLE wh_room_member
  ADD COLUMN seat_no INT NULL AFTER user_id,
  ADD COLUMN joined_at DATETIME(3) NULL AFTER connected,
  ADD COLUMN left_at DATETIME(3) NULL AFTER joined_at,
  ADD COLUMN leave_reason VARCHAR(32) NULL AFTER left_at;

CREATE INDEX idx_room_member_active ON wh_room_member (room_id, deleted, left_at);
CREATE INDEX idx_room_member_user_active ON wh_room_member (user_id, deleted, left_at);

ALTER TABLE wh_match_queue
  ADD COLUMN preferred_role VARCHAR(32) NOT NULL DEFAULT 'AUTO' AFTER queue_type,
  ADD COLUMN matched_room_id BIGINT NULL AFTER room_id,
  ADD COLUMN matched_match_id BIGINT NULL AFTER matched_room_id,
  ADD COLUMN matched_at DATETIME(3) NULL AFTER matched_match_id,
  ADD COLUMN cancelled_at DATETIME(3) NULL AFTER matched_at;

CREATE INDEX idx_queue_waiting_role ON wh_match_queue (status, preferred_role, created_at, deleted);

CREATE TABLE IF NOT EXISTS wh_room_chat_message (
  id BIGINT PRIMARY KEY,
  room_id BIGINT NOT NULL,
  user_id BIGINT NULL,
  message_type VARCHAR(32) NOT NULL DEFAULT 'USER',
  content VARCHAR(500) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  KEY idx_room_chat_room_time (room_id, created_at, deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS wh_room_kick_log (
  id BIGINT PRIMARY KEY,
  room_id BIGINT NOT NULL,
  operator_user_id BIGINT NOT NULL,
  target_user_id BIGINT NOT NULL,
  reason VARCHAR(255) NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  KEY idx_room_kick_room (room_id, created_at),
  KEY idx_room_kick_target (target_user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE wh_user
  ADD COLUMN user_type VARCHAR(32) NOT NULL DEFAULT 'GUEST' AFTER status,
  ADD COLUMN last_login_ip VARCHAR(64) NULL AFTER last_login_at;

CREATE INDEX idx_user_type_status ON wh_user (user_type, status, deleted);

ALTER TABLE wh_player_profile
  ADD COLUMN trophies INT NOT NULL DEFAULT 0 AFTER rating,
  ADD COLUMN total_matches INT NOT NULL DEFAULT 0 AFTER trophies,
  ADD COLUMN total_wins INT NOT NULL DEFAULT 0 AFTER total_matches,
  ADD COLUMN guide_version INT NOT NULL DEFAULT 0 AFTER preferred_role,
  ADD COLUMN guide_completed TINYINT NOT NULL DEFAULT 0 AFTER guide_version;

ALTER TABLE wh_match_player
  ADD COLUMN exp_delta INT NOT NULL DEFAULT 0 AFTER score_delta,
  ADD COLUMN trophy_delta INT NOT NULL DEFAULT 0 AFTER exp_delta,
  ADD COLUMN kill_count INT NOT NULL DEFAULT 0 AFTER survived,
  ADD COLUMN food_eaten INT NOT NULL DEFAULT 0 AFTER kill_count,
  ADD COLUMN skill_use_count INT NOT NULL DEFAULT 0 AFTER food_eaten;

ALTER TABLE wh_notification
  ADD COLUMN title VARCHAR(128) NULL AFTER type,
  ADD COLUMN read_at DATETIME(3) NULL AFTER read_flag;

CREATE TABLE IF NOT EXISTS wh_daily_checkin (
  id BIGINT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  checkin_date DATE NOT NULL,
  streak_days INT NOT NULL DEFAULT 1,
  reward_exp INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_checkin_user_date (user_id, checkin_date),
  KEY idx_checkin_user_time (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS wh_activity (
  id BIGINT PRIMARY KEY,
  activity_code VARCHAR(64) NOT NULL,
  title VARCHAR(128) NOT NULL,
  description VARCHAR(500) NULL,
  reward_json JSON NULL,
  starts_at DATETIME(3) NULL,
  ends_at DATETIME(3) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_activity_code (activity_code),
  KEY idx_activity_status_time (status, starts_at, ends_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS wh_activity_claim (
  id BIGINT PRIMARY KEY,
  activity_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  reward_json JSON NULL,
  claimed_at DATETIME(3) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_activity_claim_user (activity_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS wh_user_asset (
  id BIGINT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  asset_type VARCHAR(32) NOT NULL,
  asset_code VARCHAR(64) NOT NULL,
  equipped TINYINT NOT NULL DEFAULT 0,
  source VARCHAR(64) NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_user_asset (user_id, asset_type, asset_code),
  KEY idx_user_asset_user (user_id, asset_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO wh_system_config (id, config_key, config_value, created_at, updated_at, deleted)
VALUES
  (2001, 'match.ai_deer_count', '16', NOW(3), NOW(3), 0),
  (2002, 'match.deer_wait_seconds', '20', NOW(3), NOW(3), 0),
  (2003, 'room.disconnect_timeout_seconds', '60', NOW(3), NOW(3), 0),
  (2004, 'guide.version', '1', NOW(3), NOW(3), 0),
  (2005, 'match.level_gap.initial', '10', NOW(3), NOW(3), 0),
  (2006, 'match.trophy_gap.initial', '200', NOW(3), NOW(3), 0),
  (2007, 'room.private_count_trophy', 'false', NOW(3), NOW(3), 0),
  (2008, 'checkin.7day_rewards', '50,60,70,80,90,100,180', NOW(3), NOW(3), 0),
  (2009, 'asset.default.avatar', 'DEFAULT_DEER', NOW(3), NOW(3), 0),
  (2010, 'leaderboard.default_season', 'S0_PRESEASON', NOW(3), NOW(3), 0)
ON DUPLICATE KEY UPDATE config_value = VALUES(config_value), updated_at = VALUES(updated_at);

INSERT INTO wh_activity (id, activity_code, title, description, reward_json, starts_at, ends_at, status, created_at, updated_at, deleted)
VALUES
  (3001, 'WELCOME_2026', '荒野初猎礼', '完成首场对局领取经验和默认头像框。', JSON_OBJECT('exp', 200, 'asset', 'FRAME_WOODLAND'), NOW(3), DATE_ADD(NOW(3), INTERVAL 365 DAY), 'ACTIVE', NOW(3), NOW(3), 0),
  (3002, 'FIRST_MATCH', '完成首场对局', '完成任意一场追猎后领取经验。', JSON_OBJECT('exp', 120), NOW(3), DATE_ADD(NOW(3), INTERVAL 365 DAY), 'ACTIVE', NOW(3), NOW(3), 0),
  (3003, 'FRIEND_ROOM', '好友同行', '邀请好友完成房间对局后领取称号。', JSON_OBJECT('assetType', 'TITLE', 'assetCode', 'PACK_LEADER'), NOW(3), DATE_ADD(NOW(3), INTERVAL 365 DAY), 'ACTIVE', NOW(3), NOW(3), 0)
ON DUPLICATE KEY UPDATE updated_at = VALUES(updated_at);
