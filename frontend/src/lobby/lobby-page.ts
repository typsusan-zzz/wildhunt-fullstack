import { createRoom, fetchCurrentRoom, fetchRoomChat, joinRoom, joinRoomByCode, kickRoomMember, leaveRoom, sendRoomChat, setReady, startRoom } from '../api/room-api';
import { fetchLeaderboardTop, fetchLobbySummary, fetchPublicRooms } from '../api/lobby-api';
import { cancelMatchmaking, enqueueMatchmaking } from '../api/matchmaking-api';
import { fetchCurrentMatch } from '../api/match-api';
import {
  acceptFriendRequest,
  acceptInvite,
  fetchFriendRequests,
  fetchFriends,
  inviteFriend,
  rejectFriendRequest,
  rejectInvite,
  searchFriends,
  sendFriendRequest,
  sendRoomFriendRequest,
  type Friend,
  type FriendRequests,
} from '../api/friend-api';
import { fetchFriendChat, fetchFriendConversations, markFriendChatRead, sendFriendChat } from '../api/chat-api';
import { claimActivity, claimCheckin, claimSeasonPassReward, fetchActivities, fetchCheckinStatus, fetchNotifications, fetchSeasonPass, fetchUnreadCount, markAllNotificationsRead, markGuideSeen, markNotificationRead, unlockSeasonPassPremium } from '../api/rewards-api';
import { logout } from '../api/auth-api';
import { fetchUserProfile } from '../api/user-api';
import { toast } from '../ui/toast';
import { setLoading } from '../ui/loading';
import { setRoute } from '../ui/router';
import { audioManager, getAudioSettings, setAudioSettings, type AudioSettings } from '../audio/audio-manager';
import type { GameRoom, RoomChatMessage, RoomSnapshot } from '../types/room';
import type { LeaderboardEntry } from '../types/match';
import type { EntityId, UserProfile } from '../types/user';
import type { FriendChatMessage, FriendConversation } from '../types/chat';
import type { Activity, CheckinStatus, NotificationItem, SeasonPassReward, SeasonPassStatus } from '../types/rewards';
import { connectRoomChannel } from '../net/room-channel';
import { connectLobbyChannel } from '../net/lobby-channel';
import type { WsClient } from '../net/ws-client';
import type { FriendPresenceMessage } from '../net/protocol';
import { roomListTemplate } from './room-list';
import { matchPanelTemplate } from './match-panel';
import { createRoomDialogTemplate } from './create-room-dialog';
import { invitePanelTemplate } from './invite-panel';
import { leaderboardPanelTemplate, type LeaderboardType } from './leaderboard-panel';
import logoUrl from '../assets/logo.png';
import roomListTitleUrl from '../assets/ppdat/fjlb.png';
import lobbyTabIconUrl from '../assets/ppdat/top-tab/dating.svg';
import roomTabIconUrl from '../assets/ppdat/top-tab/fj.svg';
import settingsTabIconUrl from '../assets/ppdat/top-tab/shez.svg';
import checkinIconUrl from '../assets/ppdat/qiandao.png';
import eventIconUrl from '../assets/ppdat/huodong.png';
import guideIconUrl from '../assets/ppdat/xingshouzhinan.png';
import messageIconUrl from '../assets/ppdat/xiaoxi.png';

let rooms: GameRoom[] = [];
let leaderboard: LeaderboardEntry[] = [];
let activeLeaderboardType: LeaderboardType = 'TROPHY';
let activeRoom: RoomSnapshot | null = null;
let currentView: 'lobby' | 'room' = 'lobby';
let currentUser: UserProfile | null = null;
let roomMessages: RoomChatMessage[] = [];
let roomChannel: WsClient | null = null;
let lobbyChannel: WsClient | null = null;
let friends: Friend[] = [];
let checkinStatus: CheckinStatus | null = null;
let activities: Activity[] = [];
let seasonPass: SeasonPassStatus | null = null;
let notifications: NotificationItem[] = [];
let friendConversations: FriendConversation[] = [];
let friendRequests: FriendRequests = { received: [], sent: [] };
let activeChatFriendId: string | null = null;
let activeFriendChatMessages: FriendChatMessage[] = [];
let uiDialog: HTMLDialogElement | null = null;
const MATCH_OPTIONS_KEY = 'wildhunt.match.options';
const HANDLED_INVITES_KEY = 'wildhunt.handledInvites';

export async function renderLobbyPage(user?: UserProfile) {
  currentUser = user ?? currentUser;
  setRoute('lobby');
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) throw new Error('Missing #app root');
  const messageCount = totalMessageBadgeCount();
  app.innerHTML = `
    <main class="lobby-root">
      <div id="toast-root"></div>
      <header class="lobby-topbar">
        <div class="brand-mark" aria-label="WildHunt 荒野追猎">
          <img src="${logoUrl}" alt="WildHunt 荒野追猎" />
        </div>
        <nav class="top-nav" aria-label="大厅导航">
          <button id="lobby-tab-btn" class="active" type="button"><img class="nav-icon" src="${lobbyTabIconUrl}" alt="" />大厅</button>
          <button id="room-tab-btn" type="button"><img class="nav-icon" src="${roomTabIconUrl}" alt="" />房间<span id="room-stay-badge" class="room-stay-badge"></span></button>
          <button id="settings-btn" type="button"><img class="nav-icon" src="${settingsTabIconUrl}" alt="" />设置</button>
        </nav>
        <section class="player-card">
          <span class="player-avatar icon-sprite icon-deer"></span>
          <div>
            <strong>${escapeHtml(currentUser?.nickname ?? 'Hunter_001')}</strong>
            <small>Lv.${currentUser?.level ?? 1} · ${escapeHtml(currentUser?.title ?? '新晋猎手')}</small>
            <i><span style="width: ${Math.min(100, ((currentUser?.exp ?? 0) % 1000) / 10)}%"></span></i>
          </div>
          <b>${currentUser?.exp ?? 0}/1000 · ${currentUser?.trophies ?? 0} 杯</b>
          <button id="message-panel-btn" class="icon-button message-button ${messageCount > 0 ? 'has-dot' : ''}" type="button" aria-label="消息"><img src="${messageIconUrl}" alt="" /><span id="message-count">${messageCount}</span></button>
        </section>
      </header>
      <section class="lobby-shell">
        <section id="room-scene-view" class="room-scene-view">${roomSceneTemplate(activeRoom)}</section>
        <aside class="left-column">
          ${matchPanelTemplate()}
        </aside>
        <section class="center-column">
          <div class="room-title-row">
            <img class="room-title-image" src="${roomListTitleUrl}" alt="房间列表" />
            <button id="refresh-lobby-btn" class="refresh-btn" type="button" aria-label="刷新房间">↻</button>
          </div>
          <section class="rooms-card parchment-panel">
            <div id="room-list" class="room-list">${roomListTemplate(rooms)}</div>
          </section>
        </section>
        <aside class="right-column">
          <div id="leaderboard-panel">${leaderboardPanelTemplate(leaderboard, activeLeaderboardType)}</div>
          <section class="friends-card parchment-panel">
            <div class="friends-card-header">
              <h2>好友在线 <small>（${friends.length}）</small></h2>
              <button id="add-friend-btn" type="button">加好友</button>
            </div>
            ${friendsTemplate()}
          </section>
          <section class="room-waiting" id="room-waiting">${roomWaitingTemplate(activeRoom)}</section>
        </aside>
      </section>
      <section class="bottom-dock">
        <button id="season-pass-btn" class="season-pass" type="button">
          <span>${seasonPass?.level ?? 1}</span>
          <strong>赛季通行证</strong>
          <small>${seasonPass ? `${seasonPass.expIntoLevel}/${seasonPass.expForNextLevel || 'MAX'}` : '--/--'}</small>
          <i><b style="width: ${seasonPass?.progressPercent ?? 0}%"></b></i>
        </button>
        <button id="checkin-btn" class="dock-item" type="button"><img src="${checkinIconUrl}" alt="" /><strong>每日签到</strong><small>${checkinStatus?.claimedToday ? '已签到' : '可领取'}</small></button>
        <button id="activity-btn" class="dock-item" type="button"><span class="dock-icon has-dot"><img src="${eventIconUrl}" alt="" /></span><strong>活动中心</strong><small>${activities.filter((item) => item.claimable).length} 个可领</small></button>
        <button id="guide-btn" class="dock-item" type="button"><img src="${guideIconUrl}" alt="" /><strong>新手指南</strong><small>${currentUser?.guideSeen ? '已查看' : '了解玩法'}</small></button>
        <button id="local-game-btn" class="start-game-btn" type="button" aria-label="开始游戏"></button>
      </section>
      ${createRoomDialogTemplate()}
      <dialog id="lobby-modal" class="lobby-modal"></dialog>
      <section class="lobby-stats" id="lobby-stats" aria-live="polite">
        <span>在线 --</span><span>等待 --</span><span>对局 --</span>
      </section>
    </main>
  `;
  bindLobbyEvents();
  audioManager.unlockOnFirstGesture();
  syncLobbyBgm();
  await bootstrapLobby();
}

async function bootstrapLobby() {
  try {
    uiDialog = document.querySelector<HTMLDialogElement>('#lobby-modal');
    await refreshLobbyData();
    await refreshSocialAndRewards();
    const activeMatch = await fetchCurrentMatch().catch(() => null);
    if (activeMatch && currentUser) {
      const me = activeMatch.players.find((player) => !player.ai && String(player.userId) === String(currentUser?.userId));
      if (me?.roleType === 'WOLF' || me?.roleType === 'DEER') {
        await startLocalGame(me.roleType === 'WOLF' ? 'wolf' : 'deer', {
          userId: currentUser.userId,
          matchId: activeMatch.matchId,
          roomId: activeMatch.roomId,
          assignedRole: me.roleType,
          matchSeed: activeMatch.matchSeed,
          gameConfig: activeMatch.gameConfig,
        });
        return;
      }
    }
    activeRoom = await fetchCurrentRoom();
    if (activeRoom) {
      await loadRoomMessages(activeRoom.id);
      connectActiveRoomChannel(activeRoom.id);
    }
    connectLobbyRealtime();
    const inviteCode = new URLSearchParams(window.location.search).get('invite');
    if (inviteCode) await enterRoom(await joinRoomByCode(inviteCode), 'room');
    if (currentUser && !currentUser.guideSeen) showGuideDialog(true);
    renderDynamicPanels();
  } catch (error) {
    toast(`后端暂未连接，已进入离线大厅：${error instanceof Error ? error.message : 'unknown'}`);
    renderDynamicPanels();
  }
}

async function refreshLobbyData() {
  const [summary, nextRooms, top] = await Promise.all([
    fetchLobbySummary(),
    fetchPublicRooms(),
    fetchLeaderboardTop(activeLeaderboardType),
  ]);
  rooms = nextRooms;
  leaderboard = top;
  const stats = document.querySelector<HTMLElement>('#lobby-stats');
  if (stats) {
    stats.innerHTML = `
      <span>在线 ${summary.onlinePlayers}</span>
      <span>等待 ${summary.waitingRooms}</span>
      <span>对局 ${summary.playingRooms}</span>
      <span>狼队列 ${summary.queueWolf}</span>
      <span>鹿队列 ${summary.queueDeer}</span>
    `;
  }
}

async function refreshSocialAndRewards() {
  const [nextFriends, nextCheckin, nextActivities, nextSeasonPass, nextNotifications, nextConversations, nextRequests, unread] = await Promise.all([
    fetchFriends().catch(() => []),
    fetchCheckinStatus().catch(() => null),
    fetchActivities().catch(() => []),
    fetchSeasonPass().catch(() => null),
    fetchNotifications().catch(() => []),
    fetchFriendConversations().catch(() => []),
    fetchFriendRequests().catch(() => friendRequests),
    fetchUnreadCount().catch(() => ({ count: currentUser?.unreadNotifications ?? 0 })),
  ]);
  friends = nextFriends;
  checkinStatus = nextCheckin;
  activities = nextActivities;
  seasonPass = nextSeasonPass;
  notifications = nextNotifications;
  friendConversations = nextConversations;
  friendRequests = nextRequests;
  if (currentUser) currentUser = { ...currentUser, unreadNotifications: unread.count };
}

function totalMessageBadgeCount() {
  return (currentUser?.unreadNotifications ?? 0)
    + friendRequests.received.length
    + friendConversations.reduce((sum, item) => sum + item.unreadCount, 0);
}

async function refreshNotificationsAndUnread() {
  const [nextNotifications, unread] = await Promise.all([
    fetchNotifications().catch(() => notifications),
    fetchUnreadCount().catch(() => ({ count: currentUser?.unreadNotifications ?? 0 })),
  ]);
  notifications = nextNotifications;
  if (currentUser) currentUser = { ...currentUser, unreadNotifications: unread.count };
}

function roomInviteCode(item: NotificationItem) {
  const code = item.payload?.inviteCode;
  if (typeof code === 'string' || typeof code === 'number') return String(code);
  return '';
}

function handledInviteCodes() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(HANDLED_INVITES_KEY) ?? '[]');
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    return new Set<string>();
  }
}

function rememberHandledInvite(inviteCode: string) {
  if (!inviteCode) return;
  const handled = handledInviteCodes();
  handled.add(inviteCode);
  window.localStorage.setItem(HANDLED_INVITES_KEY, JSON.stringify([...handled].slice(-100)));
}

function isInviteHandled(inviteCode: string) {
  return handledInviteCodes().has(inviteCode);
}

function showActiveRoomBlocked() {
  if (!activeRoom) return false;
  toast('你已在房间内，请先退出当前房间');
  currentView = 'room';
  renderDynamicPanels();
  return true;
}

function bindLobbyEvents() {
  document.querySelector('.lobby-root')?.addEventListener('click', (event) => {
    if ((event.target as HTMLElement).closest('button')) audioManager.playSfx('ui_click');
  });
  document.querySelector('#local-game-btn')?.addEventListener('click', () => {
    if (showActiveRoomBlocked()) return;
    queueMatch('AUTO');
  });
  document.querySelector('#lobby-tab-btn')?.addEventListener('click', () => {
    currentView = 'lobby';
    renderDynamicPanels();
  });
  document.querySelector('#room-tab-btn')?.addEventListener('click', () => {
    if (!activeRoom) {
      toast('请先加入房间');
      return;
    }
    currentView = 'room';
    renderDynamicPanels();
  });
  document.querySelector('#refresh-lobby-btn')?.addEventListener('click', async () => {
    await refreshLobbyData();
    renderDynamicPanels();
  });
  document.querySelector('#checkin-btn')?.addEventListener('click', () => showCheckinDialog());
  document.querySelector('#activity-btn')?.addEventListener('click', () => showActivityDialog());
  document.querySelector('#guide-btn')?.addEventListener('click', () => showGuideDialog(false));
  document.querySelector('#season-pass-btn')?.addEventListener('click', () => showSeasonPassDialog());
  document.querySelector('#message-panel-btn')?.addEventListener('click', () => showNotificationDialog());
  document.querySelector('#add-friend-btn')?.addEventListener('click', () => void showAddFriendDialog());
  document.querySelector('#settings-btn')?.addEventListener('click', () => showSettingsDialog());
  document.querySelector('#match-wolf-btn')?.addEventListener('click', () => {
    if (showActiveRoomBlocked()) return;
    queueMatch('WOLF');
  });
  document.querySelector('#match-deer-btn')?.addEventListener('click', () => {
    if (showActiveRoomBlocked()) return;
    queueMatch('DEER');
  });
  document.querySelector('#create-room-btn')?.addEventListener('click', () => {
    if (activeRoom) {
      toast('你已在房间内，请先退出当前房间');
      currentView = 'room';
      renderDynamicPanels();
      return;
    }
    document.querySelector<HTMLDialogElement>('#create-room-dialog')?.showModal();
  });
  document.querySelector('#join-room-code-btn')?.addEventListener('click', async () => {
    if (showActiveRoomBlocked()) return;
    const code = window.prompt('请输入房间号');
    if (!code) return;
    try {
      await enterRoom(await joinRoomByCode(code), 'room');
    } catch (error) {
      toast(error instanceof Error ? error.message : '加入房间失败');
    }
  });
  document.querySelector('#confirm-create-room')?.addEventListener('click', async (event) => {
    const target = event.currentTarget as HTMLButtonElement;
    if (activeRoom) {
      toast('你已在房间内，请先退出当前房间');
      document.querySelector<HTMLDialogElement>('#create-room-dialog')?.close();
      currentView = 'room';
      renderDynamicPanels();
      return;
    }
    setLoading(target, true);
    try {
      const name = document.querySelector<HTMLInputElement>('#room-name-input')?.value.trim() || 'WildHunt 房间';
      const room = await createRoom(name);
      document.querySelector<HTMLDialogElement>('#create-room-dialog')?.close();
      await refreshLobbyData();
      await enterRoom(room, 'room');
    } catch (error) {
      toast(error instanceof Error ? error.message : '创建房间失败');
    } finally {
      setLoading(target, false);
    }
  });
  document.addEventListener('click', async (event) => {
    const target = event.target as HTMLElement;
    const roomTarget = target.closest<HTMLElement>('.room-row');
    const roomId = roomTarget?.dataset.roomId;
    if (roomTarget && roomId) {
      if (activeRoom) {
        showActiveRoomBlocked();
        return;
      }
      try {
        await enterRoom(await joinRoom(roomId), 'room');
      } catch (error) {
        toast(error instanceof Error ? error.message : '加入房间失败');
      }
    }
  });
  document.addEventListener('click', async (event) => {
    const target = event.target as HTMLElement;
    if (target.closest('#leave-room-btn')) {
      if (!activeRoom) return;
      try {
        await leaveRoom(activeRoom.id);
        audioManager.playSfx('room_leave');
        activeRoom = null;
        roomMessages = [];
        roomChannel?.close();
        roomChannel = null;
        currentView = 'lobby';
        await refreshLobbyData();
        renderDynamicPanels();
      } catch (error) {
        toast(error instanceof Error ? error.message : '退出房间失败');
      }
    }
  });
  document.addEventListener('contextmenu', (event) => {
    const friend = (event.target as HTMLElement).closest<HTMLElement>('.friend-item');
    if (!friend) return;
    event.preventDefault();
    showFriendMenu(friend.dataset.userId ?? '', friend.dataset.name ?? '好友');
  });
  document.addEventListener('click', (event) => {
    const friendButton = (event.target as HTMLElement).closest<HTMLElement>('.friend-more-btn');
    const friend = friendButton?.closest<HTMLElement>('.friend-item');
    if (friend) showFriendMenu(friend.dataset.userId ?? '', friend.dataset.name ?? '好友');
  });
  document.addEventListener('click', async (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('.add-room-friend-btn');
    if (!button || !activeRoom) return;
    try {
      await sendRoomFriendRequest(String(activeRoom.id), button.dataset.userId ?? '');
      toast('好友申请已发送');
      button.disabled = true;
      button.textContent = '已申请';
    } catch (error) {
      toast(error instanceof Error ? error.message : '好友申请失败');
    }
  });
  window.addEventListener('wildhunt:toast', (event) => toast((event as CustomEvent<string>).detail));
}

function renderDynamicPanels() {
  document.querySelector<HTMLElement>('.lobby-root')?.classList.toggle('is-room-scene', currentView === 'room' && Boolean(activeRoom));
  syncLobbyBgm();
  document.querySelector<HTMLElement>('#lobby-tab-btn')?.classList.toggle('active', currentView === 'lobby');
  document.querySelector<HTMLElement>('#room-tab-btn')?.classList.toggle('active', currentView === 'room');
  const badge = document.querySelector<HTMLElement>('#room-stay-badge');
  if (badge) {
    badge.textContent = activeRoom ? activeRoom.roomCode : '';
    badge.classList.toggle('is-visible', Boolean(activeRoom));
  }
  const roomList = document.querySelector<HTMLElement>('#room-list');
  const roomScene = document.querySelector<HTMLElement>('#room-scene-view');
  const roomWaiting = document.querySelector<HTMLElement>('#room-waiting');
  const invitePanel = document.querySelector<HTMLElement>('#invite-panel');
  const leaderboardPanel = document.querySelector<HTMLElement>('#leaderboard-panel');
  const friendList = document.querySelector<HTMLElement>('.friend-list');
  const friendCount = document.querySelector<HTMLElement>('.friends-card-header small');
  const messageCount = document.querySelector<HTMLElement>('#message-count');
  const messageButton = document.querySelector<HTMLElement>('#message-panel-btn');
  const bottomDock = document.querySelector<HTMLElement>('.bottom-dock');
  const localGameButton = document.querySelector<HTMLButtonElement>('#local-game-btn');
  const hasActiveRoom = Boolean(activeRoom);
  bottomDock?.classList.toggle('has-active-room', hasActiveRoom);
  document.querySelector<HTMLElement>('.quick-match-card')?.classList.toggle('is-room-locked', hasActiveRoom);
  document.querySelectorAll<HTMLButtonElement>('#match-wolf-btn, #match-deer-btn, #create-room-btn, #join-room-code-btn')
    .forEach((button) => {
      button.disabled = hasActiveRoom;
    });
  if (localGameButton) {
    localGameButton.classList.toggle('is-hidden', hasActiveRoom);
    localGameButton.disabled = hasActiveRoom;
    localGameButton.setAttribute('aria-hidden', String(hasActiveRoom));
  }
  if (roomList) {
    roomList.innerHTML = roomListTemplate(rooms);
    roomList.querySelectorAll<HTMLButtonElement>('.join-room-btn').forEach((button) => {
      button.disabled = hasActiveRoom;
    });
  }
  if (roomScene) roomScene.innerHTML = currentView === 'room' ? roomSceneTemplate(activeRoom) : '';
  if (roomWaiting) roomWaiting.innerHTML = roomWaitingTemplate(activeRoom);
  if (invitePanel) invitePanel.innerHTML = invitePanelTemplate(activeRoom?.inviteLink ?? '');
  if (friendList) friendList.outerHTML = friendsTemplate();
  if (friendCount) friendCount.textContent = `（${friends.length}）`;
  if (messageCount) messageCount.textContent = String(totalMessageBadgeCount());
  messageButton?.classList.toggle('has-dot', totalMessageBadgeCount() > 0);
  if (leaderboardPanel) {
    leaderboardPanel.innerHTML = leaderboardPanelTemplate(leaderboard, activeLeaderboardType);
    bindLeaderboardEvents();
  }
  bindRoomEvents();
}

function bindLeaderboardEvents() {
  document.querySelectorAll<HTMLButtonElement>('[data-leaderboard-type]').forEach((button) => {
    button.addEventListener('click', async () => {
      const nextType = button.dataset.leaderboardType as LeaderboardType;
      if (!nextType || nextType === activeLeaderboardType) return;
      activeLeaderboardType = nextType;
      try {
        leaderboard = await fetchLeaderboardTop(activeLeaderboardType);
      } catch {
        leaderboard = [];
      }
      const leaderboardPanel = document.querySelector<HTMLElement>('#leaderboard-panel');
      if (leaderboardPanel) {
        leaderboardPanel.innerHTML = leaderboardPanelTemplate(leaderboard, activeLeaderboardType);
        bindLeaderboardEvents();
      }
    });
  });
}

function syncLobbyBgm() {
  void audioManager.playBgm(currentView === 'room' && activeRoom ? 'room_loop' : 'lobby_loop');
}

function roomSceneTemplate(room: RoomSnapshot | null) {
  if (!room) return '';
  const members = room.members ?? [];
  const selfMember = currentRoomMember(room);
  const isOwner = Boolean(selfMember?.owner);
  const canStart = isOwner && allRoomMembersReady(room);
  const memberSlots = members.map((member) => {
    const isSelf = String(member.userId) === String(currentUser?.userId);
    const showAddFriend = !isSelf && !isAcceptedFriend(member.userId);
    return `
    <article class="room-player-slot ${member.owner ? 'owner' : ''}">
      ${member.owner ? '<span class="room-crown">房主</span>' : ''}
      <span class="room-player-avatar icon-sprite ${member.roleType === 'WOLF' ? 'icon-wolf' : 'icon-deer'}"></span>
      <em>${member.ready ? '已准备' : '未准备'}</em>
      <strong>${escapeHtml(member.nickname)}</strong>
      <small>${member.roleType === 'WOLF' ? '狼位待定' : '鹿位待定'}</small>
      ${showAddFriend ? `<button class="add-room-friend-btn" data-user-id="${member.userId}" type="button">加好友</button>` : ''}
      ${isOwner && !member.owner ? `<button class="kick-member-btn" data-user-id="${member.userId}" type="button">踢人</button>` : ''}
    </article>
  `;
  });
  const emptySlots = Array.from({ length: Math.max(0, room.maxPlayers - members.length) }, () => `
      <article class="room-player-slot empty">
        <button class="invite-slot-btn" type="button" aria-label="邀请玩家">+</button>
        <strong>等待玩家加入</strong>
      </article>
    `);
  const slots = [...memberSlots, ...emptySlots].join('');
  const chatItems = roomMessages.length ? roomMessages.map((message) => `
    <p class="${message.messageType === 'SYSTEM' ? 'system' : ''}">
      <span>${formatChatTime(message.createdAt)}</span>
      <b>${escapeHtml(message.nickname)}：</b>${escapeHtml(message.content)}
    </p>
  `).join('') : '<p class="system"><span>--:--</span><b>系统：</b>房间聊天已就绪</p>';
  return `
    <div class="room-scene-main">
      <div class="room-scene-top">
        <button id="leave-room-btn" class="back-lobby-btn danger" type="button">退出房间</button>
        <div class="room-code-bar">
          <strong>房间号：${room.roomCode.replace('#', '')}</strong>
          <button id="copy-invite-btn" class="copy-room-btn" type="button" aria-label="复制房间号">⧉</button>
          <span></span>
          <b>经典模式 - ${escapeHtml(room.name)}</b>
        </div>
      </div>
      <section class="room-stage-card parchment-panel">
        <div class="room-slot-grid">${slots}</div>
        <p class="room-start-tip">房主可在所有玩家准备后开始游戏；其他玩家准备后仍可在大厅浏览。</p>
        <div class="room-stage-actions">
          <button id="wechat-invite-btn" class="invite-friends-btn" type="button">邀请好友</button>
          ${isOwner
            ? `<button id="start-room-btn" class="room-start-btn" type="button" ${canStart ? '' : 'disabled'}>开始游戏</button>`
            : `<button id="ready-btn" class="room-ready-btn ${selfMember?.ready ? 'is-ready' : ''}" type="button">${selfMember?.ready ? '取消准备' : '准备'}</button>`}
        </div>
      </section>
    </div>
    <aside class="room-scene-side">
      <section class="room-side-card parchment-panel">
        <h3>房间信息</h3>
        <dl>
          <dt>房间号</dt><dd>${room.roomCode.replace('#', '')}</dd>
          <dt>游戏模式</dt><dd>经典模式</dd>
          <dt>游戏地图</dt><dd>${escapeHtml(room.name)}</dd>
          <dt>玩家人数</dt><dd>${room.memberCount}/${room.maxPlayers}</dd>
          <dt>房主</dt><dd>${escapeHtml(members.find((member) => member.owner)?.nickname ?? '待定')}</dd>
          <dt>AI 鹿</dt><dd>${room.aiDeerCount}</dd>
        </dl>
      </section>
      <section class="room-side-card parchment-panel chat">
        <h3>聊天区</h3>
        <div id="room-chat-list" class="room-chat-list">${chatItems}</div>
        <form id="room-chat-form" class="room-chat-form">
          <input id="room-chat-input" maxlength="500" placeholder="输入聊天内容" />
          <button type="submit">发送</button>
        </form>
      </section>
    </aside>
  `;
}

function currentRoomMember(room: RoomSnapshot | null = activeRoom) {
  const userId = String(currentUser?.userId ?? '');
  if (!room || !userId) return null;
  return room.members?.find((member) => String(member.userId) === userId) ?? null;
}

function allRoomMembersReady(room: RoomSnapshot | null = activeRoom) {
  const members = room?.members ?? [];
  return members.filter((member) => !member.owner).every((member) => member.ready);
}

function isAcceptedFriend(userId: EntityId) {
  const id = String(userId);
  return friends.some((friend) => String(friend.userId) === id && friend.status === 'ACCEPTED');
}

function friendsTemplate() {
  const normalizedFriends = friends.length ? friends.map((friend, index) => {
    const state = friendState(friend);
    return [
      index % 3 === 0 ? 'icon-wolf' : index % 3 === 1 ? 'icon-deer' : 'icon-squirrel',
      friend.nickname,
      state.label,
      state.className,
      String(friend.userId),
    ];
  }) : [
    ['icon-deer', '暂无好友', '可添加', 'offline', ''],
  ];
  return `
    <ul class="friend-list">
      ${normalizedFriends.map(([icon, name, state, stateClass, userId]) => `
        <li class="friend-item" data-user-id="${userId}" data-name="${escapeHtml(name)}" tabindex="0">
          <span class="friend-avatar icon-sprite ${icon}" aria-hidden="true"></span>
          <strong>${name}</strong>
          <b class="${stateClass}">${state}</b>
          <button class="friend-more-btn" type="button" aria-label="好友操作">⋯</button>
        </li>
      `).join('')}
    </ul>
  `;
}

function friendState(friend: Friend) {
  if (friend.onlineState === 'MATCHING') return { label: '匹配中', className: 'matching' };
  if (friend.onlineState === 'IN_ROOM') return { label: '房间中', className: 'room' };
  if (friend.onlineState === 'PLAYING' || friend.inGame) return { label: '游戏中', className: 'playing' };
  if (friend.onlineState === 'OFFLINE') return { label: '离线', className: 'offline' };
  return { label: '在线', className: 'online' };
}

function friendNameById(friendUserId: EntityId) {
  const id = String(friendUserId);
  return friends.find((friend) => String(friend.userId) === id)?.nickname
    ?? friendConversations.find((conversation) => String(conversation.friendUserId) === id)?.nickname
    ?? '好友';
}

function bindRoomEvents() {
  document.querySelector('#ready-btn')?.addEventListener('click', async () => {
    if (!activeRoom) return;
    const member = currentRoomMember(activeRoom);
    if (!member || member.owner) return;
    activeRoom = await setReady(activeRoom.id, !member.ready);
    audioManager.playSfx('ready_toggle');
    renderDynamicPanels();
  });
  document.querySelectorAll('#start-room-btn').forEach((button) => button.addEventListener('click', async () => {
    if (!activeRoom) return;
    if (!allRoomMembersReady(activeRoom)) {
      toast('还有玩家未准备');
      renderDynamicPanels();
      return;
    }
    try {
      const start = await startRoom(activeRoom.id);
      startLocalGame(start.assignedRole === 'WOLF' ? 'wolf' : 'deer', {
        userId: currentUser?.userId,
        matchId: start.matchId,
        roomId: activeRoom.id,
        assignedRole: start.assignedRole,
        matchSeed: Number(start.matchId),
      });
    } catch (error) {
      toast(error instanceof Error ? error.message : '开始游戏失败');
    }
  }));
  document.querySelector('#copy-invite-btn')?.addEventListener('click', async () => copyInvite());
  document.querySelector('#wechat-invite-btn')?.addEventListener('click', () => showRoomFriendInviteDialog());
  document.querySelectorAll('.invite-slot-btn').forEach((button) => button.addEventListener('click', async () => {
    await showRoomFriendInviteDialog();
  }));
  document.querySelectorAll<HTMLButtonElement>('.kick-member-btn').forEach((button) => button.addEventListener('click', async () => {
    if (!activeRoom) return;
    const targetUserId = button.dataset.userId;
    if (!targetUserId) return;
    try {
      await enterRoom(await kickRoomMember(activeRoom.id, targetUserId, '房主移出'), 'room');
      toast('已移出该玩家');
    } catch (error) {
      toast(error instanceof Error ? error.message : '踢人失败');
    }
  }));
  document.querySelector('#room-chat-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!activeRoom) return;
    const input = document.querySelector<HTMLInputElement>('#room-chat-input');
    const content = input?.value.trim() ?? '';
    if (!content) return;
    try {
      const message = await sendRoomChat(activeRoom.id, content);
      roomMessages = [...roomMessages, message];
      if (input) input.value = '';
      renderDynamicPanels();
      scrollChatToBottom();
    } catch (error) {
      toast(error instanceof Error ? error.message : '发送失败');
    }
  });
  scrollChatToBottom();
}

async function queueMatch(queueType: 'WOLF' | 'DEER' | 'AUTO') {
  if (showActiveRoomBlocked()) return;
  const status = document.querySelector<HTMLElement>('#match-status');
  const startedAt = Date.now();
  let timerId = 0;
  const renderMatchingStatus = () => {
    if (status) status.innerHTML = `匹配中 ${formatMatchElapsed(startedAt)} <button id="cancel-match-btn" type="button">取消</button>`;
    document.querySelector('#cancel-match-btn')?.addEventListener('click', async () => {
      window.clearInterval(timerId);
      await cancelMatchmaking();
      setMatchButtonsDisabled(false);
      if (status) status.textContent = '已取消匹配';
    });
  };
  setMatchButtonsDisabled(true);
  renderMatchingStatus();
  timerId = window.setInterval(renderMatchingStatus, 1000);
  try {
    const result = await enqueueMatchmaking(queueType);
    if (result.status === 'MATCHED' && result.assignedRole) {
      window.clearInterval(timerId);
      audioManager.playSfx('match_found');
      if (status) status.textContent = '匹配成功，正在进入对局...';
      startLocalGame(result.assignedRole === 'WOLF' ? 'wolf' : 'deer', {
        userId: currentUser?.userId,
        matchId: result.matchId,
        roomId: result.roomId,
        assignedRole: result.assignedRole,
        matchSeed: Number(result.matchId ?? Date.now()),
      });
      return;
    }
    renderMatchingStatus();
  } catch (error) {
    window.clearInterval(timerId);
    toast(error instanceof Error ? error.message : '匹配失败');
    setMatchButtonsDisabled(false);
    if (status) status.textContent = '匹配失败，请重试';
  }
}

function formatMatchElapsed(startedAt: number) {
  const totalSeconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function setMatchButtonsDisabled(disabled: boolean) {
  ['#match-wolf-btn', '#match-deer-btn', '#local-game-btn'].forEach((selector) => {
    const button = document.querySelector<HTMLButtonElement>(selector);
    if (button) button.disabled = disabled || Boolean(activeRoom);
  });
}

async function copyInvite() {
  const link = activeRoom?.inviteLink || `${window.location.origin}?invite=${activeRoom?.roomCode ?? ''}`;
  await navigator.clipboard?.writeText(link);
  toast('邀请链接已复制');
}

async function enterRoom(room: RoomSnapshot, view: 'lobby' | 'room' = 'room') {
  activeRoom = room;
  currentView = view;
  audioManager.playSfx('room_join');
  await loadRoomMessages(room.id);
  connectActiveRoomChannel(room.id);
  renderDynamicPanels();
}

async function loadRoomMessages(roomId: EntityId) {
  try {
    roomMessages = await fetchRoomChat(roomId);
  } catch {
    roomMessages = [];
  }
}

function connectActiveRoomChannel(roomId: EntityId) {
  roomChannel?.close();
  roomChannel = connectRoomChannel(roomId, (message) => {
    if (message.type === 'ROOM_CHAT_MESSAGE' && 'message' in message) {
      roomMessages = [...roomMessages, message.message as RoomChatMessage];
      renderDynamicPanels();
    }
    if (message.type === 'ROOM_SNAPSHOT' && 'message' in message && message.message) {
      activeRoom = message.message as RoomSnapshot;
      renderDynamicPanels();
    }
    if (message.type === 'ROOM_KICKED') {
      activeRoom = null;
      roomMessages = [];
      currentView = 'lobby';
      toast('你已被房主移出房间');
      renderDynamicPanels();
    }
    if (message.type === 'ROOM_CLOSED') {
      activeRoom = null;
      roomMessages = [];
      currentView = 'lobby';
      toast('房间已关闭');
      renderDynamicPanels();
    }
    if (message.type === 'GAME_START' && 'message' in message && message.message) {
      const start = message.message as { matchId: EntityId; assignedRole: 'WOLF' | 'DEER' };
      startLocalGame(start.assignedRole === 'WOLF' ? 'wolf' : 'deer', {
        userId: currentUser?.userId,
        matchId: start.matchId,
        roomId,
        assignedRole: start.assignedRole,
        matchSeed: Number(start.matchId),
      });
    }
  });
}

function connectLobbyRealtime() {
  lobbyChannel?.close();
  lobbyChannel = connectLobbyChannel(async (message) => {
    if (message.type === 'FRIEND_ONLINE_CHANGED' && message.message) {
      applyFriendPresenceUpdate(message.message as FriendPresenceMessage);
    }
    if (message.type === 'FRIEND_CHAT_MESSAGE' && message.message) {
      await handleFriendChatMessage(message.message as FriendChatMessage);
    }
    if (message.type === 'ROOM_INVITE_RECEIVED') {
      audioManager.playSfx('invite_received');
      toast('收到新的房间邀请');
      await refreshNotificationsAndUnread();
      const noticePanelOpen = Boolean(uiDialog?.open && uiDialog.querySelector('[data-message-panel="notice"].active'));
      if (noticePanelOpen) showNotificationDialog('notice');
      renderDynamicPanels();
    }
    if (message.type === 'FRIEND_REQUEST_RECEIVED') {
      audioManager.playSfx('notification');
      friendRequests = await fetchFriendRequests().catch(() => friendRequests);
      const request = message.message as Partial<Friend> | undefined;
      toast(request?.nickname ? `收到 ${request.nickname} 的好友申请` : '收到新的好友申请');
      const noticePanelOpen = Boolean(uiDialog?.open && uiDialog.querySelector('[data-message-panel="notice"].active'));
      if (noticePanelOpen) showNotificationDialog('notice');
      renderDynamicPanels();
    }
    if (message.type === 'FRIEND_RELATION_UPDATED') {
      const relation = message.message as Partial<Friend> | undefined;
      friends = await fetchFriends().catch(() => friends);
      friendRequests = await fetchFriendRequests().catch(() => friendRequests);
      friendConversations = await fetchFriendConversations().catch(() => friendConversations);
      toast(relation?.nickname ? `${relation.nickname} 已成为好友` : '好友列表已更新');
      const noticePanelOpen = Boolean(uiDialog?.open && uiDialog.querySelector('[data-message-panel="notice"].active'));
      if (noticePanelOpen) showNotificationDialog('notice');
      renderDynamicPanels();
    }
  });
}

function applyFriendPresenceUpdate(update: FriendPresenceMessage) {
  const targetUserId = String(update.userId ?? '');
  if (!targetUserId || !update.onlineState) return;
  let changed = false;
  friends = friends.map((friend) => {
    if (String(friend.userId) !== targetUserId) return friend;
    changed = true;
    return {
      ...friend,
      onlineState: update.onlineState,
      inGame: update.inGame ?? update.onlineState === 'PLAYING',
      roomId: update.roomId,
      matchId: update.matchId,
    };
  });
  if (changed) renderDynamicPanels();
}

async function handleFriendChatMessage(message: FriendChatMessage) {
  audioManager.playSfx('notification');
  friendConversations = await fetchFriendConversations().catch(() => friendConversations);
  if (activeChatFriendId && String(message.peerUserId) === activeChatFriendId) {
    activeFriendChatMessages = [...activeFriendChatMessages, message];
    await markFriendChatRead(activeChatFriendId).catch(() => undefined);
    renderFriendChatDialog(activeChatFriendId, friendNameById(activeChatFriendId));
    scrollFriendChatToBottom();
  } else {
    toast(`收到 ${message.senderNickname} 的消息`);
    renderDynamicPanels();
  }
}

function scrollChatToBottom() {
  const list = document.querySelector<HTMLElement>('#room-chat-list');
  if (list) list.scrollTop = list.scrollHeight;
}

function openLobbyModal(html: string) {
  uiDialog = document.querySelector<HTMLDialogElement>('#lobby-modal');
  if (!uiDialog) return;
  if (uiDialog.open) uiDialog.close();
  uiDialog.innerHTML = html;
  uiDialog.showModal();
  uiDialog.querySelectorAll('[data-close-modal]').forEach((button) => button.addEventListener('click', () => uiDialog?.close()));
}

function showCheckinDialog() {
  const rows = checkinStatus?.rewards.map((reward) => `
    <li class="${reward.claimed ? 'claimed' : ''}">
      <strong>第 ${reward.day} 天</strong>
      <span>+${reward.exp} EXP${reward.assetCode ? ` · ${reward.assetCode}` : ''}</span>
    </li>
  `).join('') ?? '<li><strong>签到加载中</strong><span>稍后重试</span></li>';
  openLobbyModal(`
    <form method="dialog" class="modal-panel reward-panel">
      <header><h2>每日签到</h2><button data-close-modal type="button">×</button></header>
      <p>连续 ${checkinStatus?.streakDays ?? 0} 天 · 累计 ${checkinStatus?.totalDays ?? 0} 天</p>
      <ol class="reward-grid">${rows}</ol>
      <button id="claim-checkin-btn" class="modal-primary" type="button" ${checkinStatus?.claimedToday ? 'disabled' : ''}>${checkinStatus?.claimedToday ? '今日已领取' : '领取今日奖励'}</button>
    </form>
  `);
  uiDialog?.querySelector('#claim-checkin-btn')?.addEventListener('click', async () => {
    try {
      checkinStatus = await claimCheckin();
      audioManager.playSfx('checkin_claim');
      currentUser = await import('../api/auth-api').then((api) => api.fetchMe()).catch(() => currentUser);
      toast('签到奖励已领取');
      uiDialog?.close();
      renderLobbyPage(currentUser ?? undefined);
    } catch (error) {
      toast(error instanceof Error ? error.message : '签到失败');
    }
  });
}

function showActivityDialog() {
  const rows = activities.map((activity) => `
    <article class="activity-row">
      <div>
        <strong>${escapeHtml(activity.title)}</strong>
        <span>${escapeHtml(activity.description)}</span>
        <small>${escapeHtml(activity.condition)} · ${activity.progress}/${activity.target} · ${formatReward(activity.reward)}</small>
      </div>
      <button class="claim-activity-btn" data-activity-id="${activity.id}" type="button" ${activity.claimable ? '' : 'disabled'}>${activityActionLabel(activity)}</button>
    </article>
  `).join('') || '<p>暂无活动</p>';
  openLobbyModal(`
    <form method="dialog" class="modal-panel activity-panel">
      <header><h2>活动中心</h2><button data-close-modal type="button">×</button></header>
      <div class="activity-list">${rows}</div>
    </form>
  `);
  uiDialog?.querySelectorAll<HTMLButtonElement>('.claim-activity-btn').forEach((button) => button.addEventListener('click', async () => {
    try {
      await claimActivity(button.dataset.activityId ?? '');
      audioManager.playSfx('activity_claim');
      activities = await fetchActivities();
      currentUser = await import('../api/auth-api').then((api) => api.fetchMe()).catch(() => currentUser);
      toast('活动奖励已到账');
      uiDialog?.close();
      renderLobbyPage(currentUser ?? undefined);
    } catch (error) {
      toast(error instanceof Error ? error.message : '领取失败');
    }
  }));
}

function showSeasonPassDialog() {
  if (seasonPass) {
    const nextText = seasonPass.expForNextLevel === 0
      ? '已达到本赛季满级'
      : `距离 ${seasonPass.level + 1} 级还需 ${seasonPass.expForNextLevel - seasonPass.expIntoLevel} EXP`;
    openLobbyModal(`
      <form method="dialog" class="modal-panel season-panel">
        <header><h2>赛季通行证</h2><button data-close-modal type="button">×</button></header>
        <p>${escapeHtml(seasonPass.seasonName)} · 当前 ${seasonPass.level}/${seasonPass.maxLevel} 级 · ${seasonPass.expIntoLevel}/${seasonPass.expForNextLevel || 'MAX'} EXP</p>
        <div class="season-progress"><i><b style="width: ${seasonPass.progressPercent}%"></b></i><span>${escapeHtml(nextText)}</span></div>
        <div class="season-tracks">${seasonTrackTemplate('免费奖励', seasonPass.freeRewards)}${seasonTrackTemplate('高级奖励', seasonPass.premiumRewards)}</div>
        ${seasonPass.premiumUnlocked ? '' : '<button id="unlock-season-premium-btn" class="modal-secondary" type="button">解锁高级奖励轨</button>'}
      </form>
    `);
    bindSeasonPassDialogEvents();
    return;
  }
  const free = [
    ['1', '+100 EXP'],
    ['5', '松林头像框'],
    ['10', '追猎者称号'],
    ['15', '+300 EXP'],
  ];
  const premium = [
    ['1', '月影狼头像'],
    ['5', '月光头像框'],
    ['10', '夜行猎手称号'],
    ['15', '赛季专属动作'],
  ];
  const track = (title: string, rewards: string[][]) => `
    <section class="season-track">
      <h3>${title}</h3>
      ${rewards.map(([level, reward]) => `<article><strong>${level}</strong><span>${reward}</span></article>`).join('')}
    </section>
  `;
  openLobbyModal(`
    <form method="dialog" class="modal-panel season-panel">
      <header><h2>赛季通行证</h2><button data-close-modal type="button">×</button></header>
      <p>S1 林间追猎 · 当前 15 级 · 820/1000</p>
      <div class="season-progress"><i><b style="width: 82%"></b></i><span>距离 16 级还需 180 EXP</span></div>
      <div class="season-tracks">${track('免费奖励', free)}${track('高级奖励', premium)}</div>
    </form>
  `);
}

function activityActionLabel(activity: Activity) {
  if (activity.claimed) return '已领取';
  if (activity.expired) return '已结束';
  if (!activity.claimable) return `${activity.progress}/${activity.target}`;
  return '领取';
}

function seasonTrackTemplate(title: string, rewards: SeasonPassReward[]) {
  return `
    <section class="season-track">
      <h3>${title}</h3>
      ${rewards.map((reward) => `
        <article class="${reward.claimed ? 'claimed' : ''} ${reward.claimable ? 'claimable' : ''} ${reward.locked ? 'locked' : ''}">
          <strong>${reward.level}</strong>
          <span>${escapeHtml(reward.label)}</span>
          <button class="claim-season-reward-btn" data-track="${reward.track}" data-level="${reward.level}" type="button" ${reward.claimable ? '' : 'disabled'}>${seasonRewardActionLabel(reward)}</button>
        </article>
      `).join('')}
    </section>
  `;
}

function seasonRewardActionLabel(reward: SeasonPassReward) {
  if (reward.claimed) return '已领取';
  if (reward.locked) return '未解锁';
  if (reward.claimable) return '领取';
  return '未达成';
}

function bindSeasonPassDialogEvents() {
  uiDialog?.querySelectorAll<HTMLButtonElement>('.claim-season-reward-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        seasonPass = await claimSeasonPassReward((button.dataset.track as 'FREE' | 'PREMIUM') ?? 'FREE', Number(button.dataset.level ?? 0));
        currentUser = await import('../api/auth-api').then((api) => api.fetchMe()).catch(() => currentUser);
        toast('赛季奖励已领取');
        uiDialog?.close();
        renderLobbyPage(currentUser ?? undefined);
      } catch (error) {
        toast(error instanceof Error ? error.message : '赛季奖励领取失败');
      }
    });
  });
  uiDialog?.querySelector<HTMLButtonElement>('#unlock-season-premium-btn')?.addEventListener('click', async () => {
    try {
      seasonPass = await unlockSeasonPassPremium();
      toast('高级奖励轨已解锁');
      uiDialog?.close();
      showSeasonPassDialog();
    } catch (error) {
      toast(error instanceof Error ? error.message : '高级奖励轨解锁失败');
    }
  });
}

function showGuideDialog(auto: boolean) {
  openLobbyModal(`
    <form method="dialog" class="modal-panel guide-panel">
      <header><h2>新手指南</h2><button data-close-modal type="button">×</button></header>
      <div class="guide-tabs">
        <section><h3>狼方目标</h3><p>在倒计时内找出真人鹿。利用气味、观察移动习惯，避免误伤 AI 鹿。</p></section>
        <section><h3>鹿方目标</h3><p>混入 AI 鹿群，进食维持状态，环顾判断狼的位置，伪装躲开追猎。</p></section>
        <section><h3>房间与匹配</h3><p>玩家房间可邀请好友；系统匹配会按当前人数用 AI 补齐目标，不暴露真人等待状态。</p></section>
        <section><h3>奖杯规则</h3><p>胜利、快速完成目标、低可疑度表现会增加奖杯；中途退出会扣除奖杯。</p></section>
      </div>
      <button id="guide-seen-btn" class="modal-primary" type="button">我知道了</button>
    </form>
  `);
  uiDialog?.querySelector('#guide-seen-btn')?.addEventListener('click', async () => {
    currentUser = await markGuideSeen().catch(() => currentUser);
    uiDialog?.close();
    if (!auto) toast('新手指南已读');
    renderDynamicPanels();
  });
}

function notificationRowTemplate(item: NotificationItem) {
  const actions = roomInviteActionsTemplate(item);
  return `
    <article class="notification-row ${item.read ? 'read' : ''} ${actions ? 'actionable' : ''}">
      <div>
        <strong>${escapeHtml(item.title)}</strong>
        <span>${escapeHtml(item.content)}</span>
        <small>${escapeHtml(item.type)} · ${formatChatTime(item.createdAt)}</small>
      </div>
      ${actions}
    </article>
  `;
}

function roomInviteActionsTemplate(item: NotificationItem) {
  if (item.type !== 'ROOM_INVITE') return '';
  const inviteCode = roomInviteCode(item);
  if (!inviteCode) return '';
  if (isInviteHandled(inviteCode)) {
    return `
      <div class="notification-actions">
        <button type="button" disabled>已处理</button>
      </div>
    `;
  }
  return `
    <div class="notification-actions">
      <button class="accept-room-invite-btn" data-invite-code="${escapeHtml(inviteCode)}" data-notification-id="${escapeHtml(String(item.id))}" type="button">同意</button>
      <button class="reject-room-invite-btn" data-invite-code="${escapeHtml(inviteCode)}" data-notification-id="${escapeHtml(String(item.id))}" type="button">拒绝</button>
    </div>
  `;
}

function showNotificationDialog(activeTab: 'notice' | 'chat' = 'notice') {
  activeChatFriendId = null;
  activeFriendChatMessages = [];
  const friendRequestRows = friendRequests.received.map((item) => {
    const source = friendRequestSourceLabel(item.source);
    const meta = [item.username, source].filter(Boolean).join(' / ');
    return `
      <article class="friend-request-row friend-request-notice">
        <div>
          <strong>${escapeHtml(item.nickname)}</strong>
          <span>${escapeHtml(meta || '好友申请')}</span>
        </div>
        <div class="friend-request-actions">
          <button class="accept-friend-request-btn" data-user-id="${escapeHtml(String(item.requesterUserId ?? item.userId))}" type="button">接受</button>
          <button class="reject-friend-request-btn" data-user-id="${escapeHtml(String(item.requesterUserId ?? item.userId))}" type="button">拒绝</button>
        </div>
      </article>
    `;
  }).join('');
  const notificationRows = notifications.map(notificationRowTemplate).join('') || '<p class="muted">暂无通知</p>';
  const renderedNotificationRows = friendRequestRows && notifications.length === 0
    ? friendRequestRows
    : `${friendRequestRows}${notificationRows}`;
  const chatRows = friendConversations.map((item) => `
    <article class="chat-conversation-row ${item.unreadCount > 0 ? 'unread' : ''}" data-chat-user-id="${item.friendUserId}" data-chat-name="${escapeHtml(item.nickname)}">
      <div>
        <strong>${escapeHtml(item.nickname)}</strong>
        <span>${item.lastMessage ? escapeHtml(item.lastMessage) : '暂无消息'}</span>
      </div>
      <small>${item.unreadCount > 0 ? `${item.unreadCount} 条未读` : formatChatTime(item.lastMessageAt ?? '')}</small>
      <button class="open-chat-btn" type="button">打开</button>
    </article>
  `).join('') || '<p class="muted">暂无会话</p>';
  openLobbyModal(`
    <form method="dialog" class="modal-panel notification-panel">
      <header><h2>消息中心</h2><button data-close-modal type="button">×</button></header>
      <div class="message-tabs" role="tablist">
        <button class="${activeTab === 'notice' ? 'active' : ''}" data-message-tab="notice" type="button">通知</button>
        <button class="${activeTab === 'chat' ? 'active' : ''}" data-message-tab="chat" type="button">聊天</button>
      </div>
      <section class="message-tab-panel ${activeTab === 'notice' ? 'active' : ''}" data-message-panel="notice">
        <div class="notification-list">${renderedNotificationRows}</div>
        <button id="read-all-btn" class="modal-primary" type="button">全部已读</button>
      </section>
      <section class="message-tab-panel ${activeTab === 'chat' ? 'active' : ''}" data-message-panel="chat">
        <div class="chat-conversation-list">${chatRows}</div>
        <button id="refresh-chat-btn" class="modal-secondary" type="button">刷新聊天</button>
      </section>
    </form>
  `);
  bindMessageCenterEvents();
}

function bindMessageCenterEvents() {
  uiDialog?.querySelectorAll<HTMLButtonElement>('[data-message-tab]').forEach((button) => {
    button.addEventListener('click', () => showNotificationDialog((button.dataset.messageTab as 'notice' | 'chat') ?? 'notice'));
  });
  uiDialog?.querySelector('#read-all-btn')?.addEventListener('click', async () => {
    await markAllNotificationsRead().catch(() => undefined);
    notifications = notifications.map((item) => ({ ...item, read: true }));
    if (currentUser) currentUser = { ...currentUser, unreadNotifications: 0 };
    toast('通知已全部标记为已读');
    showNotificationDialog('notice');
    renderDynamicPanels();
  });
  uiDialog?.querySelector('#refresh-chat-btn')?.addEventListener('click', async () => {
    friendConversations = await fetchFriendConversations().catch(() => friendConversations);
    showNotificationDialog('chat');
    renderDynamicPanels();
  });
  uiDialog?.querySelectorAll<HTMLButtonElement>('.accept-room-invite-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      button.disabled = true;
      await handleRoomInviteAction(button.dataset.inviteCode ?? '', 'accept', button.dataset.notificationId);
    });
  });
  uiDialog?.querySelectorAll<HTMLButtonElement>('.reject-room-invite-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      button.disabled = true;
      await handleRoomInviteAction(button.dataset.inviteCode ?? '', 'reject', button.dataset.notificationId);
    });
  });
  uiDialog?.querySelectorAll<HTMLButtonElement>('.accept-friend-request-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await acceptFriendRequest(button.dataset.userId ?? '');
        friends = await fetchFriends().catch(() => friends);
        friendRequests = await fetchFriendRequests().catch(() => friendRequests);
        friendConversations = await fetchFriendConversations().catch(() => friendConversations);
        toast('已添加好友');
        showNotificationDialog('notice');
        renderDynamicPanels();
      } catch (error) {
        toast(error instanceof Error ? error.message : '接受申请失败');
      }
    });
  });
  uiDialog?.querySelectorAll<HTMLButtonElement>('.reject-friend-request-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await rejectFriendRequest(button.dataset.userId ?? '');
        friendRequests = await fetchFriendRequests().catch(() => friendRequests);
        toast('已拒绝申请');
        showNotificationDialog('notice');
        renderDynamicPanels();
      } catch (error) {
        toast(error instanceof Error ? error.message : '拒绝申请失败');
      }
    });
  });
  uiDialog?.querySelectorAll<HTMLElement>('.chat-conversation-row').forEach((row) => {
    row.addEventListener('click', () => {
      const friendUserId = row.dataset.chatUserId;
      if (friendUserId) void showFriendChatDialog(friendUserId, row.dataset.chatName ?? friendNameById(friendUserId));
    });
  });
}

async function handleRoomInviteAction(inviteCode: string, action: 'accept' | 'reject', notificationId?: EntityId) {
  if (!inviteCode) {
    toast('邀请信息不完整');
    showNotificationDialog('notice');
    return;
  }
  try {
    if (action === 'accept') {
      if (showActiveRoomBlocked()) return;
      const result = await acceptInvite(inviteCode);
      rememberHandledInvite(inviteCode);
      if (notificationId) await markNotificationRead(notificationId).catch(() => undefined);
      await refreshNotificationsAndUnread();
      uiDialog?.close();
      await enterRoom(result.room, 'room');
      toast('已加入房间');
      return;
    }
    await rejectInvite(inviteCode);
    rememberHandledInvite(inviteCode);
    if (notificationId) await markNotificationRead(notificationId).catch(() => undefined);
    await refreshNotificationsAndUnread();
    toast('已拒绝房间邀请');
    showNotificationDialog('notice');
    renderDynamicPanels();
  } catch (error) {
    toast(error instanceof Error ? error.message : '处理房间邀请失败');
    showNotificationDialog('notice');
  }
}

async function showFriendChatDialog(friendUserId: EntityId, friendName: string) {
  const id = String(friendUserId);
  activeChatFriendId = id;
  activeFriendChatMessages = await fetchFriendChat(id).catch(() => []);
  await markFriendChatRead(id).catch(() => undefined);
  friendConversations = await fetchFriendConversations().catch(() => friendConversations);
  renderFriendChatDialog(id, friendName || friendNameById(id));
  scrollFriendChatToBottom();
  renderDynamicPanels();
}

function renderFriendChatDialog(friendUserId: EntityId, friendName: string) {
  const id = String(friendUserId);
  const rows = activeFriendChatMessages.map((message) => {
    const mine = String(message.senderUserId) === String(currentUser?.userId);
    return `
      <p class="friend-chat-message ${mine ? 'mine' : 'theirs'}">
        <strong>${escapeHtml(mine ? '我' : message.senderNickname)}</strong>
        <span>${escapeHtml(message.content)}</span>
        <small>${formatChatTime(message.createdAt)}</small>
      </p>
    `;
  }).join('') || '<p class="muted">还没有聊天记录</p>';
  openLobbyModal(`
    <form method="dialog" class="modal-panel friend-chat-panel">
      <header>
        <button id="back-message-center-btn" type="button">‹</button>
        <h2>${escapeHtml(friendName)}</h2>
        <button data-close-modal type="button">×</button>
      </header>
      <div id="friend-chat-list" class="friend-chat-list">${rows}</div>
      <div class="friend-chat-form">
        <input id="friend-chat-input" maxlength="500" placeholder="输入私聊内容" autocomplete="off" />
        <button id="send-friend-chat-btn" type="button">发送</button>
      </div>
    </form>
  `);
  uiDialog?.querySelector('#back-message-center-btn')?.addEventListener('click', () => showNotificationDialog('chat'));
  uiDialog?.querySelector('#send-friend-chat-btn')?.addEventListener('click', async () => sendActiveFriendChat(id, friendName));
  uiDialog?.querySelector('#friend-chat-input')?.addEventListener('keydown', async (event) => {
    if ((event as KeyboardEvent).key === 'Enter') {
      event.preventDefault();
      await sendActiveFriendChat(id, friendName);
    }
  });
}

async function sendActiveFriendChat(friendUserId: string, friendName: string) {
  const input = uiDialog?.querySelector<HTMLInputElement>('#friend-chat-input');
  const content = input?.value.trim() ?? '';
  if (!content) return;
  try {
    const sent = await sendFriendChat(friendUserId, content);
    activeFriendChatMessages = [...activeFriendChatMessages, sent];
    friendConversations = await fetchFriendConversations().catch(() => friendConversations);
    if (input) input.value = '';
    renderFriendChatDialog(friendUserId, friendName);
    scrollFriendChatToBottom();
    renderDynamicPanels();
  } catch (error) {
    toast(error instanceof Error ? error.message : '私聊发送失败');
  }
}

function scrollFriendChatToBottom() {
  const list = uiDialog?.querySelector<HTMLElement>('#friend-chat-list');
  if (list) list.scrollTop = list.scrollHeight;
}

async function showAddFriendDialog() {
  friendRequests = await fetchFriendRequests().catch(() => ({ received: [], sent: [] } as FriendRequests));
  renderDynamicPanels();
  openLobbyModal(addFriendTemplate(friendRequests, []));
  bindAddFriendDialog(friendRequests);
}

function addFriendTemplate(requests: FriendRequests, results: Friend[]) {
  const receivedRows = requests.received.map((item) => `
    <article class="friend-request-row">
      <div>
        <strong>${escapeHtml(item.nickname)}</strong>
        <span>${escapeHtml(item.username ?? '')}${item.source ? ` · ${escapeHtml(item.source)}` : ''}</span>
      </div>
      <div class="friend-request-actions">
        <button class="accept-friend-request-btn" data-user-id="${item.requesterUserId ?? item.userId}" type="button">接受</button>
        <button class="reject-friend-request-btn" data-user-id="${item.requesterUserId ?? item.userId}" type="button">拒绝</button>
      </div>
    </article>
  `).join('') || '<p class="muted">暂无收到的申请</p>';
  const sentRows = requests.sent.map((item) => `
    <article class="friend-request-row muted-row">
      <div>
        <strong>${escapeHtml(item.nickname)}</strong>
        <span>等待对方通过</span>
      </div>
      <b>已发送</b>
    </article>
  `).join('') || '<p class="muted">暂无发出的申请</p>';
  const resultRows = results.map((item) => {
    const disabled = item.status === 'ACCEPTED' || item.status === 'PENDING_SENT';
    const label = item.status === 'ACCEPTED' ? '已是好友' : item.status === 'PENDING_SENT' ? '已申请' : item.status === 'PENDING_RECEIVED' ? '去处理' : '申请';
    return `
      <article class="friend-request-row">
        <div>
          <strong>${escapeHtml(item.nickname)}</strong>
          <span>${escapeHtml(item.username ?? '')}</span>
        </div>
        <button class="send-friend-request-btn" data-username="${escapeHtml(item.username ?? item.nickname)}" type="button" ${disabled ? 'disabled' : ''}>${label}</button>
      </article>
    `;
  }).join('') || '<p class="muted">输入昵称或账号后搜索</p>';
  return `
    <form method="dialog" class="modal-panel add-friend-panel">
      <header><h2>添加好友</h2><button data-close-modal type="button">×</button></header>
      <div class="friend-search-bar">
        <input id="friend-search-input" maxlength="64" placeholder="搜索账号或昵称" autocomplete="off" />
        <button id="friend-search-btn" type="button">搜索</button>
      </div>
      <section class="friend-request-list">
        <h3>搜索结果</h3>
        <div id="friend-search-results">${resultRows}</div>
      </section>
      <section class="friend-request-list">
        <h3>收到的申请</h3>
        ${receivedRows}
      </section>
      <section class="friend-request-list">
        <h3>发出的申请</h3>
        ${sentRows}
      </section>
    </form>
  `;
}

function bindAddFriendDialog(requests: FriendRequests) {
  const runSearch = async () => {
    const keyword = uiDialog?.querySelector<HTMLInputElement>('#friend-search-input')?.value.trim() ?? '';
    const results = keyword ? await searchFriends(keyword).catch((error) => {
      toast(error instanceof Error ? error.message : '搜索失败');
      return [] as Friend[];
    }) : [];
    openLobbyModal(addFriendTemplate(requests, results));
    bindAddFriendDialog(requests);
    const input = uiDialog?.querySelector<HTMLInputElement>('#friend-search-input');
    if (input) {
      input.value = keyword;
      input.focus();
    }
  };
  uiDialog?.querySelector('#friend-search-btn')?.addEventListener('click', () => void runSearch());
  uiDialog?.querySelector('#friend-search-input')?.addEventListener('keydown', (event) => {
    if ((event as KeyboardEvent).key === 'Enter') {
      event.preventDefault();
      void runSearch();
    }
  });
  uiDialog?.querySelectorAll<HTMLButtonElement>('.send-friend-request-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await sendFriendRequest(button.dataset.username ?? '');
        friendRequests = await fetchFriendRequests().catch(() => friendRequests);
        toast('好友申请已发送');
        void showAddFriendDialog();
      } catch (error) {
        toast(error instanceof Error ? error.message : '好友申请失败');
      }
    });
  });
  uiDialog?.querySelectorAll<HTMLButtonElement>('.accept-friend-request-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await acceptFriendRequest(button.dataset.userId ?? '');
        friends = await fetchFriends().catch(() => friends);
        friendRequests = await fetchFriendRequests().catch(() => friendRequests);
        toast('已添加好友');
        void showAddFriendDialog();
        renderDynamicPanels();
      } catch (error) {
        toast(error instanceof Error ? error.message : '接受申请失败');
      }
    });
  });
  uiDialog?.querySelectorAll<HTMLButtonElement>('.reject-friend-request-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await rejectFriendRequest(button.dataset.userId ?? '');
        friendRequests = await fetchFriendRequests().catch(() => friendRequests);
        toast('已拒绝申请');
        renderDynamicPanels();
        void showAddFriendDialog();
      } catch (error) {
        toast(error instanceof Error ? error.message : '拒绝申请失败');
      }
    });
  });
}

function friendRequestSourceLabel(source?: string) {
  if (source === 'ROOM') return '房间成员';
  if (source === 'SEARCH') return '搜索添加';
  return source ?? '';
}

function showSettingsDialog() {
  const saved = JSON.parse(window.localStorage.getItem('wildhunt.settings') || '{}') as Record<string, string>;
  const audio = getAudioSettings();
  openLobbyModal(`
    <form method="dialog" class="modal-panel settings-panel">
      <header><h2>设置</h2><button data-close-modal type="button">×</button></header>
      <div class="settings-grid">
        <label>主音量<input id="setting-main-volume" type="range" min="0" max="100" value="${Math.round(audio.mainVolume * 100)}" /></label>
        <label>背景音乐<input id="setting-bgm-volume" type="range" min="0" max="100" value="${Math.round(audio.bgmVolume * 100)}" /></label>
        <label>音效音量<input id="setting-sfx-volume" type="range" min="0" max="100" value="${Math.round(audio.sfxVolume * 100)}" /></label>
        <label class="settings-check"><input id="setting-muted" type="checkbox" ${audio.muted ? 'checked' : ''} /> 静音</label>
      </div>
      <label>画质<select id="setting-quality"><option value="low">低</option><option value="medium">中</option><option value="high">高</option><option value="custom">自定义</option></select></label>
      <label>鼠标灵敏度<input id="setting-sensitivity" type="range" min="1" max="100" value="${saved.sensitivity ?? '50'}" /></label>
      <label class="settings-check"><input id="setting-invert-camera" type="checkbox" ${saved.invertCamera === 'on' ? 'checked' : ''} /> 镜头反转</label>
      <label>UI 缩放<input id="setting-ui-scale" type="range" min="80" max="120" value="${saved.uiScale ?? '100'}" /></label>
      <label>字体大小<input id="setting-font-size" type="range" min="12" max="20" value="${saved.fontSize ?? '16'}" /></label>
      <label>聊天字号<input id="setting-chat-font-size" type="range" min="12" max="20" value="${saved.chatFontSize ?? '14'}" /></label>
      <label><input id="setting-tips" type="checkbox" ${saved.tips === 'off' ? '' : 'checked'} /> 显示新手提示</label>
      <label><input id="setting-room-signal" type="checkbox" ${saved.roomSignal === 'off' ? '' : 'checked'} /> 显示房间信号说明</label>
      <button id="save-settings-btn" class="modal-primary" type="button">保存设置</button>
      <button id="logout-btn" type="button">退出登录</button>
    </form>
  `);
  const quality = uiDialog?.querySelector<HTMLSelectElement>('#setting-quality');
  if (quality) quality.value = saved.quality ?? 'medium';
  const readAudioDialogSettings = (): AudioSettings => ({
    mainVolume: readRangePercent('#setting-main-volume', 70),
    bgmVolume: readRangePercent('#setting-bgm-volume', 58),
    sfxVolume: readRangePercent('#setting-sfx-volume', 78),
    muted: uiDialog?.querySelector<HTMLInputElement>('#setting-muted')?.checked ?? false,
  });
  ['#setting-main-volume', '#setting-bgm-volume', '#setting-sfx-volume'].forEach((selector) => {
    uiDialog?.querySelector(selector)?.addEventListener('input', () => setAudioSettings(readAudioDialogSettings()));
  });
  uiDialog?.querySelector('#setting-muted')?.addEventListener('change', () => setAudioSettings(readAudioDialogSettings()));
  uiDialog?.querySelector('#save-settings-btn')?.addEventListener('click', () => {
    const audioSettings = readAudioDialogSettings();
    setAudioSettings(audioSettings);
    const next = {
      volume: String(Math.round(audioSettings.mainVolume * 100)),
      mainVolume: String(Math.round(audioSettings.mainVolume * 100)),
      bgmVolume: String(Math.round(audioSettings.bgmVolume * 100)),
      sfxVolume: String(Math.round(audioSettings.sfxVolume * 100)),
      muted: audioSettings.muted ? 'on' : 'off',
      quality: uiDialog?.querySelector<HTMLSelectElement>('#setting-quality')?.value ?? 'medium',
      sensitivity: uiDialog?.querySelector<HTMLInputElement>('#setting-sensitivity')?.value ?? '50',
      invertCamera: uiDialog?.querySelector<HTMLInputElement>('#setting-invert-camera')?.checked ? 'on' : 'off',
      uiScale: uiDialog?.querySelector<HTMLInputElement>('#setting-ui-scale')?.value ?? '100',
      fontSize: uiDialog?.querySelector<HTMLInputElement>('#setting-font-size')?.value ?? '16',
      chatFontSize: uiDialog?.querySelector<HTMLInputElement>('#setting-chat-font-size')?.value ?? '14',
      tips: uiDialog?.querySelector<HTMLInputElement>('#setting-tips')?.checked ? 'on' : 'off',
      roomSignal: uiDialog?.querySelector<HTMLInputElement>('#setting-room-signal')?.checked ? 'on' : 'off',
    };
    window.localStorage.setItem('wildhunt.settings', JSON.stringify(next));
    toast('设置已保存');
    uiDialog?.close();
  });
  uiDialog?.querySelector('#logout-btn')?.addEventListener('click', async () => {
    try {
      if (activeRoom) await leaveRoom(activeRoom.id).catch(() => undefined);
      roomChannel?.close();
      lobbyChannel?.close();
      await logout();
      window.sessionStorage.removeItem(MATCH_OPTIONS_KEY);
      window.location.reload();
    } catch (error) {
      toast(error instanceof Error ? error.message : '退出登录失败');
    }
  });
}

async function showRoomFriendInviteDialog() {
  if (!activeRoom) {
    toast('请先进入房间再邀请好友');
    return;
  }
  const room = await ensureCurrentRoomForInvite();
  if (!room) return;
  activeRoom = room;
  friends = await fetchFriends().catch(() => friends);
  const rows = friends.map((friend) => {
    const state = friendState(friend);
    return `
      <article class="room-friend-invite-row">
        <div>
          <strong>${escapeHtml(friend.nickname)}</strong>
          <span class="${state.className}">${state.label}</span>
        </div>
        <button class="invite-room-friend-btn" data-user-id="${friend.userId}" type="button">邀请</button>
      </article>
    `;
  }).join('') || '<p class="muted">暂无可邀请好友</p>';
  openLobbyModal(`
    <form method="dialog" class="modal-panel room-invite-panel">
      <header><h2>邀请好友</h2><button data-close-modal type="button">×</button></header>
      <div class="room-friend-invite-list">${rows}</div>
      <button id="copy-room-link-action" class="modal-secondary" type="button">复制房间链接</button>
    </form>
  `);
  uiDialog?.querySelector('#copy-room-link-action')?.addEventListener('click', async () => {
    await copyInvite();
    toast('邀请链接已复制');
  });
  uiDialog?.querySelectorAll<HTMLButtonElement>('.invite-room-friend-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await inviteFriend(String(activeRoom!.id), button.dataset.userId ?? '');
        toast('房间邀请已发送');
      } catch (error) {
        toast(error instanceof Error ? error.message : '邀请失败');
      }
    });
  });
}

async function ensureCurrentRoomForInvite() {
  const room = await fetchCurrentRoom().catch(() => null);
  if (!room || !activeRoom || String(room.id) !== String(activeRoom.id)) {
    activeRoom = room;
    currentView = room ? 'room' : 'lobby';
    renderDynamicPanels();
    toast('请先进入当前房间再邀请好友');
    return null;
  }
  return room;
}

function showFriendMenu(friendUserId: string, friendName: string) {
  if (!friendUserId) {
    toast('好友资料暂不可用');
    return;
  }
  openLobbyModal(`
    <form method="dialog" class="modal-panel friend-menu-panel">
      <header><h2>${escapeHtml(friendName)}</h2><button data-close-modal type="button">×</button></header>
      <button id="chat-friend-action" class="modal-primary" type="button">发送消息</button>
      <button id="invite-friend-action" class="modal-secondary" type="button" ${activeRoom ? '' : 'disabled'}>邀请加入房间</button>
      <button id="view-friend-profile-action" class="modal-secondary" type="button">查看资料</button>
    </form>
  `);
  uiDialog?.querySelector('#chat-friend-action')?.addEventListener('click', () => {
    void showFriendChatDialog(friendUserId, friendName);
  });
  uiDialog?.querySelector('#view-friend-profile-action')?.addEventListener('click', () => {
    void showFriendProfileDialog(friendUserId, friendName);
  });
  uiDialog?.querySelector('#invite-friend-action')?.addEventListener('click', async () => {
    if (!activeRoom) {
      toast('请先进入房间再邀请好友');
      return;
    }
    try {
      const room = await ensureCurrentRoomForInvite();
      if (!room) return;
      await inviteFriend(String(room.id), friendUserId);
      toast('房间邀请已发送');
      uiDialog?.close();
    } catch (error) {
      toast(error instanceof Error ? error.message : '邀请失败');
    }
  });
}

async function showFriendProfileDialog(friendUserId: EntityId, fallbackName: string) {
  try {
    const profile = await fetchUserProfile(friendUserId);
    const totalMatches = Number(profile.totalMatches ?? 0);
    const totalWins = Number(profile.totalWins ?? 0);
    const winRate = totalMatches > 0 ? `${Math.round((totalWins / totalMatches) * 100)}%` : '0%';
    openLobbyModal(`
      <form method="dialog" class="modal-panel friend-profile-panel">
        <header><h2>${escapeHtml(profile.nickname || fallbackName)}</h2><button data-close-modal type="button">×</button></header>
        <section class="friend-profile-summary">
          <span class="friend-avatar icon-sprite icon-deer" aria-hidden="true"></span>
          <div>
            <strong>${escapeHtml(profile.nickname || fallbackName)}</strong>
            <span>${escapeHtml(profile.username ?? '')}</span>
            <small>Lv.${profile.level ?? 1} · ${escapeHtml(profile.title ?? '新晋猎手')}</small>
          </div>
        </section>
        <dl class="friend-profile-stats">
          <div><dt>奖杯</dt><dd>${profile.trophies ?? 0}</dd></div>
          <div><dt>评分</dt><dd>${profile.rating ?? 0}</dd></div>
          <div><dt>对局</dt><dd>${totalMatches}</dd></div>
          <div><dt>胜率</dt><dd>${winRate}</dd></div>
        </dl>
      </form>
    `);
  } catch (error) {
    toast(error instanceof Error ? error.message : '查看资料失败');
  }
}

function formatReward(reward: Record<string, unknown>) {
  const parts = [];
  if (typeof reward.exp === 'number') parts.push(`+${reward.exp} EXP`);
  if (typeof reward.trophies === 'number') parts.push(`+${reward.trophies} 奖杯`);
  if (typeof reward.assetCode === 'string') parts.push(reward.assetCode);
  return parts.join(' · ') || '奖励';
}

function readRangePercent(selector: string, fallback: number) {
  const value = Number(uiDialog?.querySelector<HTMLInputElement>(selector)?.value ?? fallback);
  return Math.max(0, Math.min(1, value / 100));
}

function formatChatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--:--';
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }[char] ?? char));
}

function roomWaitingTemplate(room: RoomSnapshot | null) {
  if (!room) {
    return '';
  }
  const selfMember = currentRoomMember(room);
  const isOwner = Boolean(selfMember?.owner);
  const canStart = isOwner && allRoomMembersReady(room);
  const members = room.members?.map((member) => `
    <li>
      <strong>${member.nickname}</strong>
      <span>${member.owner ? '房主' : member.roleType} · ${member.ready ? '已准备' : '未准备'}</span>
    </li>
  `).join('') ?? '';
  return `
    <p class="section-label">房间 ${room.roomCode}</p>
    <h2>${room.name}</h2>
    <p class="muted">${room.memberCount}/${room.maxPlayers} 真人玩家 · AI 鹿 ${room.aiDeerCount}</p>
    <ul class="member-list">${members}</ul>
    <div class="room-actions">
      ${isOwner
        ? `<button id="start-room-btn" type="button" ${canStart ? '' : 'disabled'}>开始游戏</button>`
        : `<button id="ready-btn" type="button">${selfMember?.ready ? '取消准备' : '准备'}</button>`}
    </div>
  `;
}

type GameStartOptions = {
  userId?: EntityId;
  matchId?: EntityId;
  roomId?: EntityId;
  assignedRole: 'WOLF' | 'DEER';
  matchSeed?: number;
  gameConfig?: Record<string, unknown>;
};

async function startLocalGame(role: 'wolf' | 'deer', options?: GameStartOptions) {
  audioManager.stopBgm(300);
  setRoute('game');
  const nextOptions = options ?? {
    userId: currentUser?.userId,
    assignedRole: role === 'wolf' ? 'WOLF' : 'DEER',
    matchSeed: Date.now(),
  };
  window.sessionStorage.setItem(MATCH_OPTIONS_KEY, JSON.stringify(nextOptions));
  window.dispatchEvent(new CustomEvent('wildhunt:game-start', { detail: nextOptions }));
  (window as unknown as { __wildhuntGameOptions?: GameStartOptions }).__wildhuntGameOptions = nextOptions;
  await import('../game/game-scene.ts');
}
