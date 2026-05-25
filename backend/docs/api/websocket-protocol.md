# WildHunt WebSocket Protocol

## Endpoints

- `/ws/room?roomId={roomId}&token={jwt}`: room member, snapshot, and chat broadcast. The handshake rejects non-members.
- `/ws/lobby?token={jwt}`: lobby notification and friend presence updates. The handshake rejects invalid tokens.
- `/ws/game?matchId={matchId}&token={jwt}`: authorized game input and snapshot broadcast for current match members.

## Permission Matrix

- Room socket: requires a valid JWT and active membership in the requested room.
- Lobby socket: requires a valid JWT; presence changes are only sent to the changed user and users who can see that player in the friend panel.
- Room chat send: requires the same active room membership and is rate-limited by room and user.
- Game socket: requires a valid JWT and an active current match for the user.

## Client Messages

- `JOIN_ROOM`
- `ROOM_CHAT_SEND`
- `PLAYER_INPUT`

## Server Messages

- `ROOM_SNAPSHOT`
- `ROOM_CHAT_MESSAGE`
- `ROOM_OWNER_TRANSFERRED`
- `ROOM_MEMBER_EVENT`
- `ROOM_KICKED`
- `ROOM_CLOSED`
- `ROOM_INVITE_RECEIVED`
- `FRIEND_REQUEST_RECEIVED`
- `FRIEND_RELATION_UPDATED`
- `FRIEND_ONLINE_CHANGED`
- `FRIEND_CHAT_MESSAGE`
- `FRIEND_CHAT_READ`
- `GAME_START`
- `GAME_SNAPSHOT`
- `MATCH_END`
- `ERROR`

`PLAYER_INPUT` carries `matchId`, monotonic `seq`, and an input payload. The server drops duplicate or older `seq` values per user and match.

`FRIEND_ONLINE_CHANGED.message` includes `userId`, `onlineState` (`ONLINE`, `MATCHING`, `IN_ROOM`, `PLAYING`, or `OFFLINE`), `inGame`, and optional `roomId`/`matchId`.

`FRIEND_REQUEST_RECEIVED.message` includes the pending request peer fields returned by `GET /api/friends/requests`, including `requesterUserId`, `targetUserId`, `nickname`, `username`, `status`, `direction`, and `source`. It is delivered on `/ws/lobby` to the target user so the message center badge can increment immediately.

`FRIEND_RELATION_UPDATED.message` includes the accepted friend fields returned by `GET /api/friends`. It is delivered on `/ws/lobby` to the original requester after their request is accepted so the friend panel refreshes without a page reload.

`FRIEND_CHAT_MESSAGE.message` includes `id`, `senderUserId`, `receiverUserId`, `peerUserId`, `senderNickname`, `receiverNickname`, `content`, `read`, and `createdAt`. It is delivered on `/ws/lobby` to the receiving friend.

`FRIEND_CHAT_READ.message` includes `friendUserId` and `readCount`.

`GAME_SNAPSHOT` is scoped to the same `matchId` and can include `snapshot.players`, `snapshot.serverTimeLeft`, `snapshot.foundReal`, `snapshot.realTotal`, `snapshot.mistakes`, and `snapshot.skillConfirm`.

`snapshot.skillConfirm.type` can be `WOLF_SCENT`, `WOLF_POUNCE`, `DEER_LOOK`, `DEER_EAT`, or `DEER_CAMOUFLAGE`. The client may play local presentation effects, but formal match result must wait for `MATCH_END`.

`MATCH_END.result` includes `title`, `detail`, `wolfWin`, `expDelta`, and `trophyDelta`.
