import { request } from './http';
import type { Activity, CheckinStatus, NotificationItem, SeasonPassStatus, UserAsset } from '../types/rewards';
import type { EntityId, UserProfile } from '../types/user';

export function fetchCheckinStatus() {
  return request<CheckinStatus>('/api/checkin/status');
}

export function claimCheckin() {
  return request<CheckinStatus>('/api/checkin/claim', { method: 'POST' });
}

export function fetchActivities() {
  return request<Activity[]>('/api/activities');
}

export function claimActivity(activityId: EntityId) {
  return request<Activity>(`/api/activities/${String(activityId)}/claim`, { method: 'POST' });
}

export function fetchSeasonPass() {
  return request<SeasonPassStatus>('/api/season-pass');
}

export function claimSeasonPassReward(track: 'FREE' | 'PREMIUM', level: number) {
  return request<SeasonPassStatus>(`/api/season-pass/rewards/${track}/${String(level)}/claim`, { method: 'POST' });
}

export function unlockSeasonPassPremium() {
  return request<SeasonPassStatus>('/api/season-pass/premium/unlock', { method: 'POST' });
}

export function fetchNotifications() {
  return request<NotificationItem[]>('/api/notifications');
}

export function fetchUnreadCount() {
  return request<{ count: number }>('/api/notifications/unread-count');
}

export function markNotificationRead(notificationId: EntityId) {
  return request<NotificationItem>(`/api/notifications/${String(notificationId)}/read`, { method: 'POST' });
}

export function markAllNotificationsRead() {
  return request<void>('/api/notifications/read-all', { method: 'POST' });
}

export function markGuideSeen() {
  return request<UserProfile>('/api/users/me/guide-seen', { method: 'POST' });
}

export function fetchUserAssets() {
  return request<UserAsset[]>('/api/users/me/assets');
}
