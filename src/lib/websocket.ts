import { WS_URL } from "./constants";

type WsEventType =
  | "JOIN_ROOM"
  | "LEAVE_ROOM"
  | "SEAT_LOCKED"
  | "SEAT_UNLOCKED"
  | "REGISTRATION_NEW"
  | "REGISTRATION_COUNT"
  | "BOOKING_UPDATED"
  | "PING"
  | "PONG"
  | "AUTH";

interface WsMessage {
  type: WsEventType;
  payload?: unknown;
  room?: string;
}

type MessageHandler = (message: WsMessage) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private handlers = new Map<string, Set<MessageHandler>>();
  private reconnectAttempts = 0;
  private maxReconnects = 10;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private token: string | null = null;
  private isConnecting = false;

  connect(token: string) {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    if (this.isConnecting) return;

    this.token = token;
    this.isConnecting = true;

    try {
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.send({ type: "AUTH", payload: { token } });
        this.startPing();
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data as string) as WsMessage;
          if (message.type === "PONG") return;
          this.emit(message.type, message);
          this.emit("*", message);
        } catch {
          // ignore parse errors
        }
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.stopPing();
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.isConnecting = false;
      };
    } catch {
      this.isConnecting = false;
    }
  }

  disconnect() {
    this.stopPing();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.ws?.close();
    this.ws = null;
    this.reconnectAttempts = this.maxReconnects; // prevent reconnect
  }

  send(message: WsMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  joinRoom(room: string) {
    this.send({ type: "JOIN_ROOM", room });
  }

  leaveRoom(room: string) {
    this.send({ type: "LEAVE_ROOM", room });
  }

  on(event: string, handler: MessageHandler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  off(event: string, handler: MessageHandler) {
    this.handlers.get(event)?.delete(handler);
  }

  private emit(event: string, message: WsMessage) {
    this.handlers.get(event)?.forEach((h) => h(message));
  }

  private startPing() {
    this.pingInterval = setInterval(() => {
      this.send({ type: "PING" });
    }, 30000);
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnects) return;
    if (!this.token) return;

    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);
    this.reconnectAttempts++;

    this.reconnectTimeout = setTimeout(() => {
      if (this.token) this.connect(this.token);
    }, delay);
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton
export const wsClient = new WebSocketClient();
