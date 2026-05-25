import type { ApiResponse } from '../types/api';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';
const TOKEN_KEY = 'wildhunt.token';

export function getToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export async function request<T>(path: string, init: RequestInit = {}) {
  const token = getToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const payload = await response.json() as ApiResponse<T>;
  if (!payload.success) throw new Error(userFacingError(payload.code, payload.message));
  return payload.data;
}

function userFacingError(code: string, fallback: string) {
  const messages: Record<string, string> = {
    UNAUTHORIZED: '请重新登录',
    ROOM_NOT_FOUND: '房间不存在或已关闭',
    NOT_FOUND: '房间不存在或已关闭',
    ROOM_FULL: '房间已满',
    ROOM_ALREADY_STARTED: '房间已开始游戏',
    NOT_ROOM_OWNER: '只有房主可以操作',
    NOT_ROOM_MEMBER: '请先进入房间',
    ROOM_NOT_READY: '还有玩家未准备',
    ALREADY_IN_ROOM: '你已在房间内',
    MATCH_ALREADY_QUEUED: '你已在匹配队列中',
    CHAT_RATE_LIMITED: '发送太快了',
    REWARD_ALREADY_CLAIMED: '奖励已领取',
  };
  return messages[code] ?? fallback ?? '请求失败';
}
