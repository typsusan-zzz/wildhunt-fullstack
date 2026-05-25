USE wildhunt;

CREATE TABLE IF NOT EXISTS wh_friend_chat_message (
  id BIGINT PRIMARY KEY,
  sender_user_id BIGINT NOT NULL,
  receiver_user_id BIGINT NOT NULL,
  content VARCHAR(500) NOT NULL,
  read_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  KEY idx_friend_chat_pair_time (sender_user_id, receiver_user_id, created_at, deleted),
  KEY idx_friend_chat_receiver_unread (receiver_user_id, read_at, deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
