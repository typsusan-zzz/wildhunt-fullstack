import { request } from './http';
import type { LeaderboardEntry } from '../types/match';

export function fetchLeaderboard(type = 'TROPHY') {
  return request<LeaderboardEntry[]>(`/api/leaderboard/top?type=${encodeURIComponent(type)}&limit=50`);
}
