# WildHunt REST API

- `GET /api/health`
- `POST /api/auth/guest`
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/bind-account`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/users/me/profile`
- `PUT /api/users/me/profile`
- `GET /api/users/{userId}/profile`
- `POST /api/users/me/guide-seen`
- `GET /api/users/me/assets`
- `POST /api/users/me/assets/equip`
- `GET /api/lobby/summary`
- `GET /api/rooms`
- `GET /api/rooms/current`
- `POST /api/rooms`
- `POST /api/rooms/{roomId}/join`
- `POST /api/rooms/join-by-code/{code}`
- `POST /api/rooms/{roomId}/ready`
- `POST /api/rooms/{roomId}/start`
- `POST /api/rooms/{roomId}/leave`
- `POST /api/rooms/{roomId}/kick`
- `GET /api/rooms/{roomId}/chat?limit=30`
- `POST /api/rooms/{roomId}/chat`
- `POST /api/matchmaking/queue`
- `GET /api/matchmaking/status`
- `POST /api/matchmaking/cancel`
- `GET /api/matches/current`
- `POST /api/matches/current/leave`
- `GET /api/leaderboard/top?type=TROPHY|WINS|RATING&limit=10`
- `GET /api/friends`
- `GET /api/friends/search?keyword={keyword}`
- `GET /api/friends/requests`
- `POST /api/friends/requests`
- `POST /api/friends/requests/{requesterUserId}/accept`
- `POST /api/friends/requests/{requesterUserId}/reject`
- `POST /api/friends/room-requests`
- `GET /api/chats/friends`
- `GET /api/chats/friends/{friendUserId}?limit=50`
- `POST /api/chats/friends/{friendUserId}`
- `POST /api/chats/friends/{friendUserId}/read`
- `POST /api/invites/friend`
- `POST /api/invites/{inviteCode}/accept`
- `POST /api/invites/{inviteCode}/reject`
- `POST /api/invites/wechat`
- `GET /api/checkin/status`
- `POST /api/checkin/claim`
- `GET /api/checkin/history`
- `GET /api/admin/checkin/config`
- `PUT /api/admin/checkin/config`
- `GET /api/admin/checkin/users/{userId}/status`
- `GET /api/admin/checkin/users/{userId}/records?limit=30`
- `POST /api/admin/checkin/users/{userId}/grant`
- `POST /api/admin/checkin/users/{userId}/reset`
- `POST /api/admin/checkin/reset-all`
- `GET /api/activities`
- `GET /api/activities/my-progress`
- `POST /api/activities/{activityId}/claim`
- `GET /api/admin/activities`
- `POST /api/admin/activities`
- `PUT /api/admin/activities/{activityId}`
- `POST /api/admin/activities/{activityId}/disable`
- `POST /api/admin/activities/claims/reset?userId={userId}`
- `GET /api/season-pass`
- `POST /api/season-pass/rewards/{track}/{level}/claim`
- `POST /api/season-pass/premium/unlock`
- `GET /api/admin/season-pass/config`
- `PUT /api/admin/season-pass/config`
- `GET /api/admin/season-pass/users/{userId}`
- `POST /api/admin/season-pass/users/{userId}/exp`
- `POST /api/admin/season-pass/users/{userId}/premium`
- `POST /api/admin/season-pass/users/{userId}/reset`
- `GET /api/notifications`
- `GET /api/notifications/unread-count`
- `POST /api/notifications/{notificationId}/read`
- `POST /api/notifications/read-all`
- `POST /api/admin/cleanup/rooms`
- `POST /api/admin/cleanup/friends`
- `POST /api/admin/cleanup/leaderboard`
- `POST /api/admin/cleanup/all`

All responses use `ApiResponse<T>`.

Admin cleanup endpoints require JSON body `{ "confirm": "CLEAR" }`. Room cleanup closes/deletes room runtime data and cancels waiting queues; friend cleanup clears runtime friend relations; leaderboard cleanup resets profile ranking stats.

Leaderboard responses include `leaderboardType`, `score`, `rating`, `level`, `trophies`, and `wins`. The lobby uses `TROPHY` and `WINS` for the two visible switch tabs.

`POST /api/matches/current/leave` ends the caller's active match. If the caller leaves before settlement, the opposite camp wins; the service clears the active match and realtime playing presence for all real players in that match.

Admin checkin reset endpoints require JSON body `{ "confirm": "CLEAR" }`. Checkin grant accepts `{ "checkinDate": "2026-05-25", "streakDays": 1, "rewardExp": 50, "grantReward": true }`; missing fields are computed by the service.

Admin activity claim reset and season pass reset endpoints require JSON body `{ "confirm": "CLEAR" }`. Activity create/update accepts `{ "code": "LOGIN_BONUS", "title": "...", "activityType": "LOGIN|MATCH_COMPLETE|FRIEND_INVITE|WIN_COUNT|TROPHY_COUNT", "conditionValue": 1, "conditionText": "...", "reward": { "exp": 100, "assetType": "FRAME", "assetCode": "FRAME_PINE" }, "startsAt": "2026-05-25T00:00:00", "endsAt": "2026-06-25T00:00:00", "status": "ACTIVE" }`.

Season pass rewards use `FREE` or `PREMIUM` tracks. Admin season pass config accepts `{ "seasonCode": "S1_FOREST", "seasonName": "S1 Forest Hunt", "maxLevel": 50, "freeRewards": [{ "level": 1, "token": "EXP_100" }], "premiumRewards": [{ "level": 1, "token": "AVATAR_WOLF" }] }`; supported tokens include `EXP_100`, `TROPHY_30`, `FRAME_*`, `TITLE_*`, `AVATAR_*`, and `EMOTE_*`.

Friend list `onlineState` can be `ONLINE`, `MATCHING`, `IN_ROOM`, `PLAYING`, or `OFFLINE`.

Friend relations require an explicit request flow. `POST /api/friends/requests` creates a pending request by username/nickname, `/accept` turns it into an accepted bidirectional relation, and `/room-requests` only works when both users are active members of the same room. New received requests are pushed through lobby WebSocket event `FRIEND_REQUEST_RECEIVED` so the message center badge and notice tab update immediately; accepted requests push `FRIEND_RELATION_UPDATED` to the original requester so both browsers refresh friend panels without a page reload. `POST /api/invites/friend` requires the inviter to be in the room and the target to already be an accepted friend.

Friend chat endpoints require an accepted friend relation. Messages are capped at 500 characters, filtered by `ContentGuard`, rate-limited, persisted to `wh_friend_chat_message`, and delivered through lobby WebSocket event `FRIEND_CHAT_MESSAGE`.

Common user-facing error codes include `UNAUTHORIZED`, `ROOM_NOT_FOUND`, `ROOM_FULL`, `ROOM_ALREADY_STARTED`, `NOT_ROOM_OWNER`, `ALREADY_IN_ROOM`, `MATCH_ALREADY_QUEUED`, `CHAT_RATE_LIMITED`, and `REWARD_ALREADY_CLAIMED`.
