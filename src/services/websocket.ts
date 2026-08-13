class WebSocketService {
  private socket: WebSocket | null = null;
  private callbacks: ((payload: any) => void)[] = [];
  
  // Update to use the user's requested endpoint
  private brokerUrl = process.env.NEXT_PUBLIC_WS_BROKER_URL || 'ws://localhost:1880/ws/esp';
  private reconnectInterval = 3000;
  private isConnecting = false;

  connect() {
    if (this.socket && this.socket.readyState !== WebSocket.CLOSED) return;
    if (this.isConnecting) return;

    this.isConnecting = true;
    try {
      this.socket = new WebSocket(this.brokerUrl);

      this.socket.onopen = () => {
        console.log('Connected to Node-RED WebSocket at', this.brokerUrl);
        this.isConnecting = false;
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Only process it if it contains expected fields or just pass it through
          if (data.temp !== undefined || data.type === 'plant_data' || data.activePlants !== undefined) {
            console.log('Received plant update:', data);
            this.callbacks.forEach((cb) => cb(data));
          } else {
             // Fallback for general dashboard data
             this.callbacks.forEach((cb) => cb(data));
          }
        } catch (err) {
          console.log('Raw text received:', event.data);
        }
      };

      this.socket.onclose = () => {
        console.warn('WebSocket closed. Reconnecting in 3s...');
        this.socket = null;
        this.isConnecting = false;
        setTimeout(() => this.connect(), this.reconnectInterval);
      };

      this.socket.onerror = (err) => {
        console.error('WebSocket error:', err);
        this.socket?.close();
      };
    } catch (err) {
      console.error('Failed to establish WebSocket:', err);
      this.isConnecting = false;
      setTimeout(() => this.connect(), this.reconnectInterval);
    }
  }

  subscribe(callback: (payload: any) => void) {
    this.callbacks.push(callback);
    
    if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
      this.connect();
    }
  }

  unsubscribe(callback: (payload: any) => void) {
    this.callbacks = this.callbacks.filter((cb) => cb !== callback);
    // Optional: close connection if no more listeners
    if (this.callbacks.length === 0 && this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  sendDeviceCommand(commandValue: any) {
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

export const wsService = new WebSocketService();
