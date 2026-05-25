export function createRoomDialogTemplate() {
  return `
    <dialog id="create-room-dialog">
      <form method="dialog" class="wild-dialog">
        <p class="section-label">新建房间</p>
        <h2>房间设置</h2>
        <label>
          房间名
          <input id="room-name-input" maxlength="32" value="WildHunt 房间" />
        </label>
        <menu>
          <button value="cancel" type="submit">取消</button>
          <button id="confirm-create-room" value="default" type="button">创建</button>
        </menu>
      </form>
    </dialog>
  `;
}
