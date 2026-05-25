import { fetchMe, getStoredUser, loginAsGuest, loginWithPassword, registerAccount } from '../api/auth-api';
import { clearToken, getToken } from '../api/http';
import { setLoading } from '../ui/loading';
import { setRoute } from '../ui/router';
import { toast } from '../ui/toast';
import type { UserProfile } from '../types/user';
import bgUrl from '../assets/logo/bj.png';
import logoUrl from '../assets/logo.png';

type LoginMode = 'login' | 'register';

export async function restoreSession() {
  if (!getToken()) return null;
  try {
    return await fetchMe();
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('HTTP 401') || message.includes('HTTP 403')) {
      clearToken();
      return null;
    }
    return getStoredUser();
  }
}

export function renderLoginPage(onSuccess: (user: UserProfile) => void) {
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) throw new Error('Missing #app root');
  setRoute('login');
  app.innerHTML = `
    <main class="login-root" style="--login-bg: url('${bgUrl}')">
      <div id="toast-root"></div>
      <section class="login-panel" aria-labelledby="login-title">
        <img class="login-logo" src="${logoUrl}" alt="荒野追猎" />
        <p class="login-kicker">多人追猎对局</p>
        <h1 id="login-title">荒野追猎</h1>
        <p class="login-copy">进入大厅，创建房间、邀请好友，或直接匹配为狼与鹿。</p>
        <div class="login-tabs" role="tablist" aria-label="登录方式">
          <button id="login-mode-btn" class="active" type="button">登录</button>
          <button id="register-mode-btn" type="button">注册</button>
        </div>
        <form id="login-form" class="login-form">
          <label>
            <span>账号</span>
            <input id="login-username" name="username" autocomplete="username" placeholder="输入账号" />
          </label>
          <label>
            <span>密码</span>
            <input id="login-password" name="password" type="password" autocomplete="current-password" placeholder="至少 6 位" />
          </label>
          <label id="nickname-field" class="is-hidden">
            <span>昵称</span>
            <input id="login-nickname" name="nickname" autocomplete="nickname" placeholder="游戏内显示昵称" />
          </label>
          <button id="submit-login-btn" class="login-primary" type="submit">登录</button>
        </form>
        <div class="login-alt-actions">
          <button id="guest-login-btn" type="button">游客进入</button>
          <button id="wechat-login-btn" type="button">微信登录</button>
        </div>
      </section>
    </main>
  `;
  bindLoginEvents(onSuccess);
}

function bindLoginEvents(onSuccess: (user: UserProfile) => void) {
  let mode: LoginMode = 'login';
  const loginModeBtn = document.querySelector<HTMLButtonElement>('#login-mode-btn');
  const registerModeBtn = document.querySelector<HTMLButtonElement>('#register-mode-btn');
  const nicknameField = document.querySelector<HTMLElement>('#nickname-field');
  const submitBtn = document.querySelector<HTMLButtonElement>('#submit-login-btn');

  const setMode = (nextMode: LoginMode) => {
    mode = nextMode;
    loginModeBtn?.classList.toggle('active', mode === 'login');
    registerModeBtn?.classList.toggle('active', mode === 'register');
    nicknameField?.classList.toggle('is-hidden', mode !== 'register');
    if (submitBtn) submitBtn.textContent = mode === 'login' ? '登录' : '注册并进入';
  };

  loginModeBtn?.addEventListener('click', () => setMode('login'));
  registerModeBtn?.addEventListener('click', () => setMode('register'));

  document.querySelector('#wechat-login-btn')?.addEventListener('click', () => {
    toast('微信登录入口已预留，当前请先使用账号或游客进入');
  });

  document.querySelector('#guest-login-btn')?.addEventListener('click', async (event) => {
    const target = event.currentTarget as HTMLButtonElement;
    await submit(target, async () => (await loginAsGuest()).user, onSuccess);
  });

  document.querySelector('#login-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.querySelector<HTMLInputElement>('#login-username')?.value.trim() ?? '';
    const password = document.querySelector<HTMLInputElement>('#login-password')?.value ?? '';
    const nickname = document.querySelector<HTMLInputElement>('#login-nickname')?.value.trim() ?? '';
    await submit(submitBtn, async () => {
      if (mode === 'register') return (await registerAccount(username, password, nickname)).user;
      return (await loginWithPassword(username, password)).user;
    }, onSuccess);
  });
}

async function submit(button: HTMLButtonElement | null, action: () => Promise<UserProfile>, onSuccess: (user: UserProfile) => void) {
  if (!button) return;
  setLoading(button, true);
  try {
    const user = await action();
    onSuccess(user);
  } catch (error) {
    toast(error instanceof Error ? error.message : '登录失败');
  } finally {
    setLoading(button, false);
  }
}
