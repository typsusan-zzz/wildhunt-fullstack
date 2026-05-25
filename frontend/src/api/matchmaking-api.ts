import { request } from './http';
import type { RoomSnapshot } from '../types/room';
import type { EntityId } from '../types/user';

export type QueueType = 'WOLF' | 'DEER' | 'AUTO';

export type MatchmakingResult = {
  status: 'IDLE' | 'WAITING' | 'MATCHED' | 'CANCELLED';
  roomId?: EntityId;
  matchId?: EntityId;
  assignedRole?: 'WOLF' | 'DEER';
  room?: RoomSnapshot;
};

export function enqueueMatchmaking(queueType: QueueType) {
  return request<MatchmakingResult>('/api/matchmaking/queue', {
    method: 'POST',
    body: JSON.stringify({ queueType }),
  });
}

export function fetchMatchmakingStatus() {
  return request<MatchmakingResult>('/api/matchmaking/status');
}

export function cancelMatchmaking() {
  return request<void>('/api/matchmaking/cancel', { method: 'POST' });
}
