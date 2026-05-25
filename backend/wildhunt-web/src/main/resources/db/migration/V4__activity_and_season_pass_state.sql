USE wildhunt;

ALTER TABLE wh_activity
  ADD COLUMN activity_type VARCHAR(32) NOT NULL DEFAULT 'LOGIN' AFTER description,
  ADD COLUMN condition_value INT NOT NULL DEFAULT 1 AFTER activity_type,
  ADD COLUMN condition_text VARCHAR(128) NULL AFTER condition_value;

CREATE TABLE IF NOT EXISTS wh_season_pass_progress (
  id BIGINT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  season_code VARCHAR(32) NOT NULL,
  season_exp INT NOT NULL DEFAULT 0,
  level INT NOT NULL DEFAULT 1,
  premium_unlocked TINYINT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_season_pass_progress_user (user_id, season_code),
  KEY idx_season_pass_progress_season (season_code, level, season_exp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS wh_season_pass_claim (
  id BIGINT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  season_code VARCHAR(32) NOT NULL,
  reward_track VARCHAR(16) NOT NULL,
  reward_level INT NOT NULL,
  reward_json JSON NULL,
  claimed_at DATETIME(3) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_season_pass_claim_user (user_id, season_code, reward_track, reward_level),
  KEY idx_season_pass_claim_user (user_id, season_code, claimed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

UPDATE wh_activity
SET title = '荒野初猎礼',
    description = '登录即可领取经验和默认头像框。',
    activity_type = 'LOGIN',
    condition_value = 1,
    condition_text = '登录领取',
    reward_json = JSON_OBJECT('exp', 200, 'assetType', 'FRAME', 'assetCode', 'FRAME_WOODLAND'),
    status = 'ACTIVE',
    updated_at = NOW(3),
    deleted = 0
WHERE activity_code = 'WELCOME_2026';

UPDATE wh_activity
SET title = '完成首场对局',
    description = '完成任意一场追猎后领取经验。',
    activity_type = 'MATCH_COMPLETE',
    condition_value = 1,
    condition_text = '完成 1 场对局',
    reward_json = JSON_OBJECT('exp', 120),
    status = 'ACTIVE',
    updated_at = NOW(3),
    deleted = 0
WHERE activity_code = 'FIRST_MATCH';

UPDATE wh_activity
SET title = '好友同行',
    description = '添加 1 名好友后领取称号。',
    activity_type = 'FRIEND_INVITE',
    condition_value = 1,
    condition_text = '添加 1 名好友',
    reward_json = JSON_OBJECT('assetType', 'TITLE', 'assetCode', 'PACK_LEADER'),
    status = 'ACTIVE',
    updated_at = NOW(3),
    deleted = 0
WHERE activity_code = 'FRIEND_ROOM';

INSERT INTO wh_activity (id, activity_code, title, description, activity_type, condition_value, condition_text,
                         reward_json, starts_at, ends_at, status, created_at, updated_at, deleted)
VALUES
  (3004, 'FIRST_WIN', '首胜补给', '赢得 1 场对局领取奖杯补给。', 'WIN_COUNT', 1, '赢得 1 场对局',
   JSON_OBJECT('trophies', 30, 'exp', 80), NOW(3), DATE_ADD(NOW(3), INTERVAL 365 DAY), 'ACTIVE', NOW(3), NOW(3), 0)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description),
  activity_type = VALUES(activity_type),
  condition_value = VALUES(condition_value),
  condition_text = VALUES(condition_text),
  reward_json = VALUES(reward_json),
  status = VALUES(status),
  updated_at = VALUES(updated_at),
  deleted = 0;

INSERT INTO wh_system_config (id, config_key, config_value, created_at, updated_at, deleted)
VALUES
  (2142, 'season.pass.name', 'S1 Forest Hunt', NOW(3), NOW(3), 0),
  (2143, 'season.pass.free_rewards', '1:EXP_100,3:TROPHY_30,5:FRAME_PINE,10:TITLE_TRACKER,15:EXP_300', NOW(3), NOW(3), 0),
  (2144, 'season.pass.premium_rewards', '1:AVATAR_WOLF,3:EXP_200,5:FRAME_MOON,10:TITLE_NIGHT_HUNTER,15:EMOTE_HOWL', NOW(3), NOW(3), 0)
ON DUPLICATE KEY UPDATE config_value = VALUES(config_value), updated_at = VALUES(updated_at), deleted = 0;
