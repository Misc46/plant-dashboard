class WebSocketService {
  private socket: WebSocket | null = null;
  private callbacks: ((payload: any) => void)[] = [];

  private brokerUrl = process.env.NEXT_PUBLIC_WS_BROKER_URL || 'ws://localhost:1880/ws/esp';
  private reconnectInterval = 3000;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private intentionallyClosed = false;

  connect() {
    console.log('[WebSocketService] connect() called. Current readyState:', this.socket?.readyState);
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      console.log('[WebSocketService] Already connected or connecting. Aborting new connection attempt.');
      return;
    }

    console.log('[WebSocketService] Cleaning up old socket and preparing new connection.');
    this.cleanupSocket();
    this.intentionallyClosed = false;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    try {
      const ws = new WebSocket(this.brokerUrl);
      this.socket = ws;
      console.log('[WebSocketService] Created new WebSocket instance.');

      ws.onopen = () => {
        if (this.socket !== ws) {
          console.log('[WebSocketService] onopen fired for stale socket. Closing it.');
          return ws.close();
        }
        console.log('[WebSocketService] Connected to Node-RED WebSocket at', this.brokerUrl);
      };

      ws.onmessage = (event) => {
        if (this.socket !== ws) {
          console.log('[WebSocketService] onmessage fired for stale socket. Closing it.');
          return ws.close();
        }
        
        try {
          const data = JSON.parse(event.data);
          console.log(`[WebSocketService] Received message. Dispatching to ${this.callbacks.length} callbacks.`, data);
          this.callbacks.forEach((cb) => cb(data));
        } catch (err) {
          console.log('[WebSocketService] Raw text received:', event.data);
        }
      };

      ws.onclose = () => {
        console.log('[WebSocketService] onclose fired.');
        if (this.socket !== ws) {
          console.log('[WebSocketService] onclose fired for stale socket. Ignoring.');
          return;
        }

        this.socket = null;

        if (this.intentionallyClosed) {
          console.log('[WebSocketService] WebSocket closed intentionally. No reconnect.');
          return;
        }

        console.warn(`[WebSocketService] WebSocket closed unexpectedly. Reconnecting in ${this.reconnectInterval}ms...`);
        this.reconnectTimer = setTimeout(() => this.connect(), this.reconnectInterval);
      };

      ws.onerror = (err) => {
        console.error('[WebSocketService] WebSocket error:', err);
        if (this.socket !== ws) return;
        ws.close();
      };
    } catch (err) {
      console.error('[WebSocketService] Failed to establish WebSocket:', err);
      if (!this.intentionallyClosed) {
        this.reconnectTimer = setTimeout(() => this.connect(), this.reconnectInterval);
      }
    }
  }

  private cleanupSocket() {
    if (this.socket) {
      console.log('[WebSocketService] Cleaning up socket (readyState:', this.socket.readyState, ')');
      this.socket.onclose = null;
      this.socket.onmessage = null;
      this.socket.onerror = null;
      this.socket.onopen = null;
      if (this.socket.readyState !== WebSocket.CLOSED) {
        this.socket.close();
      }
      this.socket = null;
    }
  }

  subscribe(callback: (payload: any) => void) {
    console.log('[WebSocketService] subscribe() called.');
    if (!this.callbacks.includes(callback)) {
      this.callbacks.push(callback);
      console.log(`[WebSocketService] Callback added. Total callbacks: ${this.callbacks.length}`);
    } else {
      console.log('[WebSocketService] Callback already exists.');
    }

    if (!this.socket || this.socket.readyState === WebSocket.CLOSED || this.socket.readyState === WebSocket.CLOSING) {
      console.log('[WebSocketService] Socket not open. Initiating connection.');
      this.connect();
    }
  }

  disconnect() {
    console.log('[WebSocketService] disconnect() called.');
    this.intentionallyClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.cleanupSocket();
  }

  unsubscribe(callback: (payload: any) => void) {
    console.log('[WebSocketService] unsubscribe() called.');
    this.callbacks = this.callbacks.filter((cb) => cb !== callback);
    console.log(`[WebSocketService] Callback removed. Total callbacks: ${this.callbacks.length}`);
    if (this.callbacks.length === 0) {
      console.log('[WebSocketService] No more callbacks. Disconnecting.');
      this.disconnect();
    }
  }

  sendDeviceCommand(payload: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
    } else {
      console.warn('[WebSocketService] WebSocket is not connected yet.');
    }
  }
}

const globalForWs = globalThis as unknown as { wsService: WebSocketService };

export const wsService = globalForWs.wsService || new WebSocketService();

if (process.env.NODE_ENV !== 'production') {
  globalForWs.wsService = wsService;
}
