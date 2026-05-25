import type { GameRoom } from '../types/room';

export function roomListTemplate(rooms: GameRoom[]) {
  if (rooms.length === 0) {
    return `
      <article class="room-empty-state">
        <strong>暂无玩家自建房间</strong>
        <span>创建房间后会显示在这里，系统匹配房间不会进入大厅列表。</span>
      </article>
    `;
  }
  return rooms.map((room, index) => `
    <article class="room-row" data-room-id="${room.id}" data-room-code="${room.roomCode}" data-room-name="${escapeHtml(room.name)}" data-member-count="${room.memberCount}" data-max-players="${room.maxPlayers}" data-ai-deer-count="${room.aiDeerCount}">
      <span class="room-thumb icon-sprite icon-room-${(index % 3) + 1}" aria-hidden="true"></span>
      <div>
        <strong>${escapeHtml(room.name)} ${room.roomCode}</strong>
        <span>${room.status === 'WAITING' ? '经典模式' : room.status}</span>
      </div>
      <b>${room.memberCount}/${room.maxPlayers}</b>
      <i class="signal-bars" aria-hidden="true"><span></span><span></span><span></span></i>
      <button class="join-room-btn" data-room-id="${room.id}" type="button">加入</button>
    </article>
  `).join('');
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
