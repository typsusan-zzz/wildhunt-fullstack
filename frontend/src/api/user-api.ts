import { request } from './http';
import type { EntityId, UserProfile } from '../types/user';

export function fetchUserProfile(userId: EntityId) {
  return request<UserProfile>(`/api/users/${String(userId)}/profile`);
}
