import { clearToken, request, setToken } from './http';
import type { AuthSession, UserProfile } from '../types/user';

const USER_KEY = 'wildhunt.user';

export async function loginAsGuest() {
  const session = await request<AuthSession>('/api/auth/guest', { method: 'POST' });
  persistSession(session);
  return session;
}

export async function loginWithPassword(username: string, password: string) {
  const session = await request<AuthSession>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  persistSession(session);
  return session;
}

export async function registerAccount(username: string, password: string, nickname: string) {
  const session = await request<AuthSession>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password, nickname }),
  });
  persistSession(session);
  return session;
}

export function fetchMe() {
  return request<UserProfile>('/api/auth/me');
}

export async function logout() {
  try {
    return await request<void>('/api/auth/logout', { method: 'POST' });
  } finally {
    clearToken();
    clearStoredUser();
  }
}

export function getStoredUser() {
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    clearStoredUser();
    return null;
  }
}

function persistSession(session: AuthSession) {
  setToken(session.token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

function clearStoredUser() {
  window.localStorage.removeItem(USER_KEY);
}
