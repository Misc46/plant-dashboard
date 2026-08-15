import { toast } from "@/components/ui";

/** Payload exchanged with the Node-RED broker for ESP hardware plants. */
export interface EspTelemetryPayload {
  temp?: number;
  processVariable?: number;
  output?: number;
  controlOutput?: number;
  type?: string;
  activePlants?: unknown;
  [key: string]: unknown;
}

const BROKER_UNREACHABLE_MSG_PREFIX = "Can't reach the Node-RED WebSocket broker";

class WebSocketService {
  private socket: WebSocket | null = null;
  private callbacks: ((payload: EspTelemetryPayload) => void)[] = [];
  
  // Resolved by the browser, not the server — Node-RED must be reachable from
  // the machine opening the app. Overridable via env for tunnel/cloud setups
  // (see README "ESP Hardware Mode").
  private brokerUrl = process.env.NEXT_PUBLIC_WS_BROKER_URL || 'ws://localhost:1880/ws/esp';
  private reconnectInterval = 3000;
  private isConnecting = false;
  private intentionallyClosed = false;
  private errorToastShown = false;

  private notifyBrokerUnreachable() {
    if (this.errorToastShown) return;
    this.errorToastShown = true;
    toast(
      `${BROKER_UNREACHABLE_MSG_PREFIX} (${this.brokerUrl}). ESP plants won't update live — start Node-RED (or set NEXT_PUBLIC_WS_BROKER_URL) and open this app from a machine that can reach the broker.`,
      "error"
    );
  }

  connect() {
    if (this.socket && this.socket.readyState !== WebSocket.CLOSED) return;
    if (this.isConnecting) return;

    this.isConnecting = true;
    this.intentionallyClosed = false;
    try {
      this.socket = new WebSocket(this.brokerUrl);

      this.socket.onopen = () => {
        console.log('Connected to Node-RED WebSocket at', this.brokerUrl);
        this.isConnecting = false;
        this.errorToastShown = false;
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as EspTelemetryPayload;
          // Only process it if it contains expected fields or just pass it through
          if (data.temp !== undefined || data.type === 'plant_data' || data.activePlants !== undefined) {
            console.log('Received plant update:', data);
            this.callbacks.forEach((cb) => cb(data));
          } else {
             // Fallback for general dashboard data
             this.callbacks.forEach((cb) => cb(data));
          }
        } catch {
          console.log('Raw text received:', event.data);
        }
      };

      this.socket.onclose = () => {
        this.socket = null;
        this.isConnecting = false;
        
        if (this.intentionallyClosed) {
          console.log('WebSocket closed intentionally.');
          return;
        }
        
        console.warn('WebSocket closed. Reconnecting in 3s...');
        setTimeout(() => this.connect(), this.reconnectInterval);
      };

      this.socket.onerror = () => {
        this.notifyBrokerUnreachable();
        this.socket?.close();
      };
    } catch {
      this.isConnecting = false;
      this.notifyBrokerUnreachable();
      setTimeout(() => this.connect(), this.reconnectInterval);
    }
  }

  subscribe(callback: (payload: EspTelemetryPayload) => void) {
    this.callbacks.push(callback);
    
    if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
      this.connect();
    }
  }

  disconnect() {
    this.intentionallyClosed = true;
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnecting = false;
  }

  unsubscribe(callback: (payload: EspTelemetryPayload) => void) {
    this.callbacks = this.callbacks.filter((cb) => cb !== callback);
    // Optional: close connection if no more listeners
    if (this.callbacks.length === 0) {
      this.disconnect();
    }
  }

  sendDeviceCommand(commandValue: Record<string, unknown>) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const payload = {
        type: 'control',
        command: commandValue
      };
      this.socket.send(JSON.stringify(payload));
    } else {
      console.warn('WebSocket is not connected yet.');
    }
  }
}

const globalForWs = globalThis as unknown as { wsService: WebSocketService };

export const wsService = globalForWs.wsService || new WebSocketService();

if (process.env.NODE_ENV !== 'production') {
  globalForWs.wsService = wsService;
}
