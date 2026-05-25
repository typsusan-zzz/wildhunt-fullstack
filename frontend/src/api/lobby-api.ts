import { request } from './http';
import type { GameRoom } from '../types/room';
import type { LeaderboardEntry } from '../types/match';

export type LobbySummary = {
  onlinePlayers: number;
  waitingRooms: number;
  playingRooms: number;
  queueWolf: number;
  queueDeer: number;
};

export function fetchLobbySummary() {
  return request<LobbySummary>('/api/lobby/summary');
}

export function fetchPublicRooms() {
  return request<GameRoom[]>('/api/rooms');
}

export function fetchLeaderboardTop(type = 'TROPHY') {
  return request<LeaderboardEntry[]>(`/api/leaderboard/top?type=${encodeURIComponent(type)}&limit=10`);
}
