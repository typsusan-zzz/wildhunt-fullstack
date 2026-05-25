import { request } from './http';
import type { MatchSnapshot } from '../types/match';

export function fetchCurrentMatch() {
  return request<MatchSnapshot | null>('/api/matches/current');
}

export function leaveCurrentMatch() {
  return request<MatchSnapshot | null>('/api/matches/current/leave', { method: 'POST' });
}
