import type { MatchSnapshot } from '../types/match';
import type { RoomChatMessage, RoomSnapshot } from '../types/room';
import type { FriendChatMessage } from '../types/chat';

export type PresenceOnlineState = 'ONLINE' | 'MATCHING' | 'IN_ROOM' | 'PLAYING' | 'OFFLINE';

export type FriendPresenceMessage = {
  userId: string | number;
  onlineState: PresenceOnlineState;
  inGame?: boolean;
  roomId?: string | number;
  matchId?: string | number;
};

export type ClientMessage =
  | { type: 'JOIN_ROOM'; roomId: string; token: string }
  | { type: 'ROOM_CHAT_SEND'; roomId: string; content: string }
  | { type: 'PING'; roomId?: string; sentAt: number }
  | { type: 'PLAYER_INPUT'; matchId: string; seq: number; input: Record<string, unknown> };

export type ServerMessage =
  | { type: 'ROOM_SNAPSHOT'; roomId?: string; room?: RoomSnapshot; message?: RoomSnapshot }
  | { type: 'ROOM_CHAT_MESSAGE'; roomId: string; message: RoomChatMessage }
  | { type: 'ROOM_MEMBER_EVENT'; roomId?: string; message?: { content?: string } }
  | { type: 'ROOM_KICKED'; roomId?: string; message?: { roomId?: string | number; reason?: string } }
  | { type: 'ROOM_CLOSED'; roomId?: string; message?: RoomSnapshot }
  | { type: 'ROOM_INVITE_RECEIVED'; roomId?: string; message?: unknown }
  | { type: 'FRIEND_REQUEST_RECEIVED'; roomId?: string; message?: unknown }
  | { type: 'FRIEND_RELATION_UPDATED'; roomId?: string; message?: unknown }
  | { type: 'FRIEND_ONLINE_CHANGED'; roomId?: string; message?: FriendPresenceMessage }
  | { type: 'FRIEND_CHAT_MESSAGE'; roomId?: string; message?: FriendChatMessage }
  | { type: 'FRIEND_CHAT_READ'; roomId?: string; message?: { friendUserId?: string | number; readCount?: number } }
  | { type: 'GAME_START'; roomId?: string; matchId?: string; assignedRole?: 'WOLF' | 'DEER'; message?: { matchId: string | number; assignedRole: 'WOLF' | 'DEER' } }
  | { type: 'GAME_SNAPSHOT'; tick: number; players: unknown[]; match?: MatchSnapshot; snapshot?: Record<string, unknown> }
  | { type: 'PONG'; sentAt: number; serverAt: number }
  | { type: 'MATCH_END'; result: { title?: string; detail?: string; expDelta?: number; trophyDelta?: number; wolfWin?: boolean } }
  | { type: 'ERROR'; message: string };
