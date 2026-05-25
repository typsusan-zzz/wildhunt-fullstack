import type { EntityId } from './user';

export type RoleType = 'WOLF' | 'DEER' | 'SPECTATOR';
export type RoomStatus = 'WAITING' | 'READY_CHECK' | 'LOADING' | 'PLAYING' | 'SETTLEMENT' | 'CLOSED';

export type RoomMember = {
  userId: EntityId;
  nickname: string;
  roleType: RoleType;
  ready: boolean;
  owner: boolean;
};

export type GameRoom = {
  id: EntityId;
  roomCode: string;
  name: string;
  status: RoomStatus;
  ownerUserId: EntityId;
  maxPlayers: number;
  aiDeerCount: number;
  currentMatchId?: EntityId;
  memberCount: number;
  members?: RoomMember[];
  networkQuality?: {
    level: 'GOOD' | 'FAIR' | 'POOR' | 'UNKNOWN';
    avgPingMs?: number;
    maxPingMs?: number;
    updatedAt?: string;
  };
};

export type RoomSnapshot = GameRoom & {
  inviteLink: string;
};

export type RoomChatMessage = {
  id: EntityId;
  roomId: EntityId;
  userId?: EntityId;
  nickname: string;
  messageType: 'USER' | 'SYSTEM';
  content: string;
  createdAt: string;
};
