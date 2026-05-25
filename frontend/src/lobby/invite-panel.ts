export function invitePanelTemplate(inviteLink = '') {
  return `
    <section class="invite-copy-panel parchment-panel">
      <h2>房间邀请</h2>
      <div class="invite-copy">
        <input id="invite-link-input" readonly value="${inviteLink}" placeholder="进入房间后生成邀请链接" />
        <button id="copy-invite-btn" type="button">复制</button>
      </div>
    </section>
  `;
}
