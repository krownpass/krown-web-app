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
  event_id?: string;
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
  private messageQueue: any[] = [];

  connect(token: string) {
    console.log("[WS Client] Connect requested with token");
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log("[WS Client] Already connected");
      return;
    }
    if (this.isConnecting) {
      console.log("[WS Client] Already connecting");
      return;
    }

    this.token = token;
    this.isConnecting = true;

    try {
      console.log("[WS Client] Initializing new WebSocket connection to:", WS_URL);
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        console.log("[WS Client] Connection opened successfully");
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.send({ type: "AUTH", token });
        this.startPing();

        // Flush any queued messages now that we're connected
        if (this.messageQueue.length > 0) {
          console.log(`[WS Client] Flushing ${this.messageQueue.length} queued messages`);
          while (this.messageQueue.length > 0) {
            const msg = this.messageQueue.shift();
            this.send(msg);
          }
        }
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data as string) as WsMessage;
          
          // If server sends PING, we MUST reply with PONG to keep connection alive
          if (message.type === "PING") {
            this.send({ type: "PONG" });
            return;
          }
          
          if (message.type === "PONG") return;
          console.log("[WS Client] Received message:", message);
          this.emit(message.type, message);
          this.emit("*", message);
        } catch {
          console.log("[WS Client] Failed to parse incoming message:", event.data);
          // ignore parse errors
        }
      };

      this.ws.onclose = (event) => {
        console.log("[WS Client] Connection closed:", event.code, event.reason);
        this.isConnecting = false;
        this.stopPing();
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error("[WS Client] WebSocket Error:", error);
        this.isConnecting = false;
      };
    } catch (err) {
      console.error("[WS Client] Caught error during connect:", err);
      this.isConnecting = false;
    }
  }

  disconnect() {
    console.log("[WS Client] Disconnect requested");
    this.stopPing();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.ws?.close();
    this.ws = null;
    this.reconnectAttempts = this.maxReconnects; // prevent reconnect
  }

  send(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log("[WS Client] Sending:", message);
      this.ws.send(JSON.stringify(message));
    } else {
      console.log("[WS Client] Warning: Socket not open, queuing message:", message);
      this.messageQueue.push(message);
    }
  }

  joinRoom(event_id: string) {
    // The server expects event_id, not room
    this.send({ type: "JOIN_ROOM", event_id });
  }

  leaveRoom(event_id: string) {
    this.send({ type: "LEAVE_ROOM", event_id });
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
      // The server expects PONG from clients to keep things alive
      this.send({ type: "PONG" });
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
