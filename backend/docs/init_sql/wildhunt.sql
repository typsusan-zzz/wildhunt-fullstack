/*
 Navicat Premium Data Transfer

 Source Server         : localhost_3306
 Source Server Type    : MySQL
 Source Server Version : 80408 (8.4.8)
 Source Host           : localhost:3306
 Source Schema         : wildhunt

 Target Server Type    : MySQL
 Target Server Version : 80408 (8.4.8)
 File Encoding         : 65001

 Date: 27/05/2026 18:40:47
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for flyway_schema_history
-- ----------------------------
DROP TABLE IF EXISTS `flyway_schema_history`;
CREATE TABLE `flyway_schema_history`  (
  `installed_rank` int NOT NULL,
  `version` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `description` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `script` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `checksum` int NULL DEFAULT NULL,
  `installed_by` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `installed_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `execution_time` int NOT NULL,
  `success` tinyint(1) NOT NULL,
  PRIMARY KEY (`installed_rank`) USING BTREE,
  INDEX `flyway_schema_history_s_idx`(`success` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for wh_activity
-- ----------------------------
DROP TABLE IF EXISTS `wh_activity`;
CREATE TABLE `wh_activity`  (
  `id` bigint NOT NULL,
  `activity_code` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `title` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `activity_type` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'LOGIN',
  `condition_value` int NOT NULL DEFAULT 1,
  `condition_text` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `reward_json` json NULL,
  `starts_at` datetime(3) NULL DEFAULT NULL,
  `ends_at` datetime(3) NULL DEFAULT NULL,
  `status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  `deleted` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_activity_code`(`activity_code` ASC) USING BTREE,
  INDEX `idx_activity_status_time`(`status` ASC, `starts_at` ASC, `ends_at` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for wh_activity_claim
-- ----------------------------
DROP TABLE IF EXISTS `wh_activity_claim`;
CREATE TABLE `wh_activity_claim`  (
  `id` bigint NOT NULL,
  `activity_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `reward_json` json NULL,
  `claimed_at` datetime(3) NOT NULL,
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  `deleted` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_activity_claim_user`(`activity_id` ASC, `user_id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for wh_daily_checkin
-- ----------------------------
DROP TABLE IF EXISTS `wh_daily_checkin`;
CREATE TABLE `wh_daily_checkin`  (
  `id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `checkin_date` date NOT NULL,
  `streak_days` int NOT NULL DEFAULT 1,
  `reward_exp` int NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  `deleted` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_checkin_user_date`(`user_id` ASC, `checkin_date` ASC) USING BTREE,
  INDEX `idx_checkin_user_time`(`user_id` ASC, `created_at` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for wh_friend_chat_message
-- ----------------------------
DROP TABLE IF EXISTS `wh_friend_chat_message`;
CREATE TABLE `wh_friend_chat_message`  (
  `id` bigint NOT NULL,
  `sender_user_id` bigint NOT NULL,
  `receiver_user_id` bigint NOT NULL,
  `content` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `read_at` datetime(3) NULL DEFAULT NULL,
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  `deleted` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_friend_chat_pair_time`(`sender_user_id` ASC, `receiver_user_id` ASC, `created_at` ASC, `deleted` ASC) USING BTREE,
  INDEX `idx_friend_chat_receiver_unread`(`receiver_user_id` ASC, `read_at` ASC, `deleted` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for wh_friend_relation
-- ----------------------------
DROP TABLE IF EXISTS `wh_friend_relation`;
CREATE TABLE `wh_friend_relation`  (
  `id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `friend_user_id` bigint NOT NULL,
  `status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'PENDING',
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  `deleted` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_friend_pair`(`user_id` ASC, `friend_user_id` ASC) USING BTREE,
  INDEX `idx_friend_user`(`user_id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for wh_friend_request
-- ----------------------------
DROP TABLE IF EXISTS `wh_friend_request`;
CREATE TABLE `wh_friend_request`  (
  `id` bigint NOT NULL,
  `from_user_id` bigint NOT NULL,
  `to_user_id` bigint NOT NULL,
  `status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'PENDING',
  `message` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  `deleted` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_friend_request_to`(`to_user_id` ASC, `status` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for wh_game_match
-- ----------------------------
DROP TABLE IF EXISTS `wh_game_match`;
CREATE TABLE `wh_game_match`  (
  `id` bigint NOT NULL,
  `room_id` bigint NOT NULL,
  `status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `wolf_user_id` bigint NULL DEFAULT NULL,
  `ai_deer_count` int NOT NULL DEFAULT 16,
  `started_at` datetime(3) NULL DEFAULT NULL,
  `finished_at` datetime(3) NULL DEFAULT NULL,
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  `deleted` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_match_room`(`room_id` ASC) USING BTREE,
  INDEX `idx_match_status`(`status` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for wh_leaderboard_entry
-- ----------------------------
DROP TABLE IF EXISTS `wh_leaderboard_entry`;
CREATE TABLE `wh_leaderboard_entry`  (
  `id` bigint NOT NULL,
  `season_code` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `user_id` bigint NOT NULL,
  `rating` int NOT NULL DEFAULT 1000,
  `wins` int NOT NULL DEFAULT 0,
  `wolf_wins` int NOT NULL DEFAULT 0,
  `deer_survivals` int NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  `deleted` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_leaderboard_user`(`season_code` ASC, `user_id` ASC) USING BTREE,
  INDEX `idx_leaderboard_rating`(`season_code` ASC, `rating` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for wh_leaderboard_season
-- ----------------------------
DROP TABLE IF EXISTS `wh_leaderboard_season`;
CREATE TABLE `wh_leaderboard_season`  (
  `id` bigint NOT NULL,
  `season_code` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  `deleted` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_season_code`(`season_code` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for wh_match_event
-- ----------------------------
DROP TABLE IF EXISTS `wh_match_event`;
CREATE TABLE `wh_match_event`  (
  `id` bigint NOT NULL,
  `match_id` bigint NOT NULL,
  `user_id` bigint NULL DEFAULT NULL,
  `event_type` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `payload` json NULL,
  `event_at` datetime(3) NOT NULL,
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  `deleted` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_event_match`(`match_id` ASC, `event_at` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for wh_match_player
-- ----------------------------
DROP TABLE IF EXISTS `wh_match_player`;
CREATE TABLE `wh_match_player`  (
  `id` bigint NOT NULL,
  `match_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `role_type` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `result` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `score_delta` int NOT NULL DEFAULT 0,
  `exp_delta` int NOT NULL DEFAULT 0,
  `trophy_delta` int NOT NULL DEFAULT 0,
  `survived` tinyint NOT NULL DEFAULT 0,
  `kill_count` int NOT NULL DEFAULT 0,
  `food_eaten` int NOT NULL DEFAULT 0,
  `skill_use_count` int NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  `deleted` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_match_player`(`match_id` ASC, `user_id` ASC) USING BTREE,
  INDEX `idx_match_player_user`(`user_id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for wh_match_queue
-- ----------------------------
DROP TABLE IF EXISTS `wh_match_queue`;
CREATE TABLE `wh_match_queue`  (
  `id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `queue_type` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `preferred_role` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'AUTO',
  `status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'WAITING',
  `room_id` bigint NULL DEFAULT NULL,
  `matched_room_id` bigint NULL DEFAULT NULL,
  `matched_match_id` bigint NULL DEFAULT NULL,
  `matched_at` datetime(3) NULL DEFAULT NULL,
  `cancelled_at` datetime(3) NULL DEFAULT NULL,
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  `deleted` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_queue_type`(`queue_type` ASC, `status` ASC) USING BTREE,
  INDEX `idx_queue_waiting_role`(`status` ASC, `preferred_role` ASC, `created_at` ASC, `deleted` ASC) USING BTREE,
  INDEX `idx_queue_user_status_time`(`user_id` ASC, `status` ASC, `created_at` ASC, `deleted` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for wh_match_snapshot
-- ----------------------------
DROP TABLE IF EXISTS `wh_match_snapshot`;
CREATE TABLE `wh_match_snapshot`  (
  `id` bigint NOT NULL,
  `match_id` bigint NOT NULL,
  `tick` bigint NOT NULL,
  `payload` json NOT NULL,
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  `deleted` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_snapshot_match`(`match_id` ASC, `tick` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for wh_notification
-- ----------------------------
DROP TABLE IF EXISTS `wh_notification`;
CREATE TABLE `wh_notification`  (
  `id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `type` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `title` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `payload` json NULL,
  `read_flag` tinyint NOT NULL DEFAULT 0,
  `read_at` datetime(3) NULL DEFAULT NULL,
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  `deleted` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_notification_user`(`user_id` ASC, `read_flag` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for wh_player_profile
-- ----------------------------
DROP TABLE IF EXISTS `wh_player_profile`;
CREATE TABLE `wh_player_profile`  (
  `id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `level` int NOT NULL DEFAULT 1,
  `exp` int NOT NULL DEFAULT 0,
  `rating` int NOT NULL DEFAULT 1000,
  `trophies` int NOT NULL DEFAULT 0,
  `total_matches` int NOT NULL DEFAULT 0,
  `total_wins` int NOT NULL DEFAULT 0,
  `title` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `preferred_role` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `guide_version` int NOT NULL DEFAULT 0,
  `guide_completed` tinyint NOT NULL DEFAULT 0,
  `total_play_seconds` bigint NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  `deleted` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_profile_user`(`user_id` ASC) USING BTREE,
  INDEX `idx_profile_rating`(`rating` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for wh_player_stat
-- ----------------------------
DROP TABLE IF EXISTS `wh_player_stat`;
CREATE TABLE `wh_player_stat`  (
  `id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `matches` int NOT NULL DEFAULT 0,
  `wins` int NOT NULL DEFAULT 0,
  `wolf_wins` int NOT NULL DEFAULT 0,
  `deer_survivals` int NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  `deleted` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_stat_user`(`user_id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for wh_room
-- ----------------------------
DROP TABLE IF EXISTS `wh_room`;
CREATE TABLE `wh_room`  (
  `id` bigint NOT NULL,
  `room_code` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `owner_user_id` bigint NOT NULL,
  `status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'WAITING',
  `room_type` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'PLAYER' COMMENT 'PLAYER 玩家自建房间，SYSTEM 系统匹配房间',
  `max_players` int NOT NULL DEFAULT 10,
  `ai_deer_count` int NOT NULL DEFAULT 16,
  `public_room` tinyint NOT NULL DEFAULT 1,
  `current_match_id` bigint NULL DEFAULT NULL,
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  `closed_at` datetime(3) NULL DEFAULT NULL,
  `version` int NOT NULL DEFAULT 0,
  `deleted` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_room_code`(`room_code` ASC) USING BTREE,
  INDEX `idx_room_status`(`status` ASC, `public_room` ASC) USING BTREE,
  INDEX `idx_room_type_status`(`room_type` ASC, `status` ASC, `deleted` ASC) USING BTREE,
  INDEX `idx_room_owner_status`(`owner_user_id` ASC, `status` ASC, `deleted` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for wh_room_chat_message
-- ----------------------------
DROP TABLE IF EXISTS `wh_room_chat_message`;
CREATE TABLE `wh_room_chat_message`  (
  `id` bigint NOT NULL,
  `room_id` bigint NOT NULL,
  `user_id` bigint NULL DEFAULT NULL,
  `message_type` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'USER',
  `content` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  `deleted` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_room_chat_room_time`(`room_id` ASC, `created_at` ASC, `deleted` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for wh_room_invite
-- ----------------------------
DROP TABLE IF EXISTS `wh_room_invite`;
CREATE TABLE `wh_room_invite`  (
  `id` bigint NOT NULL,
  `room_id` bigint NOT NULL,
  `inviter_user_id` bigint NOT NULL,
  `invitee_user_id` bigint NULL DEFAULT NULL,
  `invite_code` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `channel` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'PENDING',
  `expires_at` datetime(3) NULL DEFAULT NULL,
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  `deleted` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_invite_code`(`invite_code` ASC) USING BTREE,
  INDEX `idx_invite_room`(`room_id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for wh_room_kick_log
-- ----------------------------
DROP TABLE IF EXISTS `wh_room_kick_log`;
CREATE TABLE `wh_room_kick_log`  (
  `id` bigint NOT NULL,
  `room_id` bigint NOT NULL,
  `operator_user_id` bigint NOT NULL,
  `target_user_id` bigint NOT NULL,
  `reason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  `deleted` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_room_kick_room`(`room_id` ASC, `created_at` ASC) USING BTREE,
  INDEX `idx_room_kick_target`(`target_user_id` ASC, `created_at` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for wh_room_member
-- ----------------------------
DROP TABLE IF EXISTS `wh_room_member`;
CREATE TABLE `wh_room_member`  (
  `id` bigint NOT NULL,
  `room_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `seat_no` int NULL DEFAULT NULL,
  `role_type` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'DEER',
  `ready` tinyint NOT NULL DEFAULT 0,
  `owner_flag` tinyint NOT NULL DEFAULT 0,
  `connected` tinyint NOT NULL DEFAULT 1,
  `joined_at` datetime(3) NULL DEFAULT NULL,
  `left_at` datetime(3) NULL DEFAULT NULL,
  `leave_reason` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  `deleted` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_room_member`(`room_id` ASC, `user_id` ASC) USING BTREE,
  INDEX `idx_room_member_room`(`room_id` ASC) USING BTREE,
  INDEX `idx_room_member_active`(`room_id` ASC, `deleted` ASC, `left_at` ASC) USING BTREE,
  INDEX `idx_room_member_user_active`(`user_id` ASC, `deleted` ASC, `left_at` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for wh_season_pass_claim
-- ----------------------------
DROP TABLE IF EXISTS `wh_season_pass_claim`;
CREATE TABLE `wh_season_pass_claim`  (
  `id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `season_code` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `reward_track` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `reward_level` int NOT NULL,
  `reward_json` json NULL,
  `claimed_at` datetime(3) NOT NULL,
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  `deleted` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_season_pass_claim_user`(`user_id` ASC, `season_code` ASC, `reward_track` ASC, `reward_level` ASC) USING BTREE,
  INDEX `idx_season_pass_claim_user`(`user_id` ASC, `season_code` ASC, `claimed_at` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for wh_season_pass_progress
-- ----------------------------
DROP TABLE IF EXISTS `wh_season_pass_progress`;
CREATE TABLE `wh_season_pass_progress`  (
  `id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `season_code` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `season_exp` int NOT NULL DEFAULT 0,
  `level` int NOT NULL DEFAULT 1,
  `premium_unlocked` tinyint NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  `deleted` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_season_pass_progress_user`(`user_id` ASC, `season_code` ASC) USING BTREE,
  INDEX `idx_season_pass_progress_season`(`season_code` ASC, `level` ASC, `season_exp` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for wh_system_config
-- ----------------------------
DROP TABLE IF EXISTS `wh_system_config`;
CREATE TABLE `wh_system_config`  (
  `id` bigint NOT NULL,
  `config_key` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `config_value` varchar(1024) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  `deleted` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_config_key`(`config_key` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for wh_user
-- ----------------------------
DROP TABLE IF EXISTS `wh_user`;
CREATE TABLE `wh_user`  (
  `id` bigint NOT NULL,
  `username` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `nickname` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `avatar_url` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'ACTIVE',
  `user_type` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'GUEST',
  `last_login_at` datetime(3) NULL DEFAULT NULL,
  `last_login_ip` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  `deleted` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_user_username`(`username` ASC) USING BTREE,
  INDEX `idx_user_status`(`status` ASC) USING BTREE,
  INDEX `idx_user_type_status`(`user_type` ASC, `status` ASC, `deleted` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for wh_user_asset
-- ----------------------------
DROP TABLE IF EXISTS `wh_user_asset`;
CREATE TABLE `wh_user_asset`  (
  `id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `asset_type` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `asset_code` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `equipped` tinyint NOT NULL DEFAULT 0,
  `source` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  `deleted` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_user_asset`(`user_id` ASC, `asset_type` ASC, `asset_code` ASC) USING BTREE,
  INDEX `idx_user_asset_user`(`user_id` ASC, `asset_type` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for wh_user_auth_binding
-- ----------------------------
DROP TABLE IF EXISTS `wh_user_auth_binding`;
CREATE TABLE `wh_user_auth_binding`  (
  `id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `provider` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `open_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `union_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `nickname` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `avatar_url` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `raw_json` json NULL,
  `created_at` datetime(3) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  `deleted` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_provider_openid`(`provider` ASC, `open_id` ASC) USING BTREE,
  INDEX `idx_binding_user`(`user_id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;
