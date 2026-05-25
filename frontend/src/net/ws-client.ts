import type { ClientMessage, ServerMessage } from './protocol';

const WS_BASE = import.meta.env.VITE_WS_BASE_URL ?? 'ws://localhost:8080';

export class WsClient {
  private socket?: WebSocket;
  private path = '';
  private onMessage?: (message: ServerMessage) => void;
  private closedByClient = false;

  connect(path: string, onMessage: (message: ServerMessage) => void) {
    this.socket?.close();
    this.path = path;
    this.onMessage = onMessage;
    this.closedByClient = false;
    this.socket = new WebSocket(`${WS_BASE}${path}`);
    this.socket.addEventListener('message', (event) => onMessage(JSON.parse(event.data) as ServerMessage));
    this.socket.addEventListener('close', () => {
      if (!this.closedByClient && this.path && this.onMessage) {
        window.setTimeout(() => this.connect(this.path, this.onMessage!), 1200);
      }
    });
    return this.socket;
  }

  send(message: ClientMessage) {
    if (this.socket?.readyState !== WebSocket.OPEN) return false;
    this.socket.send(JSON.stringify(message));
    return true;
  }

  close() {
    this.closedByClient = true;
    this.socket?.close();
  }
}
