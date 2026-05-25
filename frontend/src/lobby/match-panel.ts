import quickMatchTitleUrl from '../assets/ppdat/kspp.png';
import wolfUrl from '../assets/ppdat/lang.png';
import deerUrl from '../assets/ppdat/milu.png';
import wolfTagUrl from '../assets/ppdat/lang-tag.png';
import deerTagUrl from '../assets/ppdat/milu-tag.png';
import createRoomIconUrl from '../assets/ppdat/cjfj.png';
import joinRoomIconUrl from '../assets/ppdat/jrfj.png';

export function matchPanelTemplate() {
  return `
    <section class="quick-match-card wood-panel">
      <img class="quick-title-image" src="${quickMatchTitleUrl}" alt="快速匹配" />
      <button id="match-wolf-btn" class="role-card wolf-card" type="button">
        <img class="role-portrait role-portrait-image" src="${wolfUrl}" alt="" />
        <span class="role-copy">
          <strong>匹配为狼</strong>
          <small>寻找鹿群，找出所有真人鹿</small>
          <em>在线玩家：1280</em>
        </span>
        <img class="role-tag-image" src="${wolfTagUrl}" alt="" />
      </button>
      <button id="match-deer-btn" class="role-card deer-card" type="button">
        <img class="role-portrait role-portrait-image deer-portrait-image" src="${deerUrl}" alt="" />
        <span class="role-copy">
          <strong>匹配为鹿</strong>
          <small>隐藏在鹿群中，存活到时间结束</small>
          <em>在线玩家：3420</em>
        </span>
        <img class="role-tag-image" src="${deerTagUrl}" alt="" />
      </button>
      <div class="custom-room-card">
        <h3>自定义房间</h3>
        <div class="custom-actions">
          <button id="create-room-btn" class="blue-action" type="button">
            <img class="mini-icon" src="${createRoomIconUrl}" alt="" />
            <span><strong>创建房间</strong><small>创建属于你的狩猎房间</small></span>
          </button>
          <button id="join-room-code-btn" class="purple-action" type="button">
            <img class="mini-icon" src="${joinRoomIconUrl}" alt="" />
            <span><strong>加入房间</strong><small>输入房间号，加入游戏</small></span>
          </button>
        </div>
      </div>
      <p id="match-status" class="match-status"></p>
    </section>
  `;
}
