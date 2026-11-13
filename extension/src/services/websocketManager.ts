type MessageListener = (data: unknown) => void;

export class HyperliquidWebSocketManager {
  private ws: WebSocket | null = null;
  private currentWallet: string | null = null;
  private listeners: Set<MessageListener> = new Set();
  private reconnectTimer: number | null = null;
  private isExplicitlyClosed = false;

  private static instance: HyperliquidWebSocketManager;

  static getInstance(): HyperliquidWebSocketManager {
    if (!this.instance) {
      this.instance = new HyperliquidWebSocketManager();
    }
    return this.instance;
  }

  connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isExplicitlyClosed = false;
    try {
      this.ws = new WebSocket("wss://api.hyperliquid.xyz/ws");

      this.ws.onopen = () => {
        if (this.currentWallet) {
          this.sendSubscriptions(this.currentWallet);
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          for (const listener of this.listeners) {
            listener(parsed);
          }
        } catch {
          // ignore non-json
        }
      };

      this.ws.onclose = () => {
        if (!this.isExplicitlyClosed) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (err) => {
        console.warn("WebSocket error:", err);
      };
    } catch (e) {
      console.warn("Failed to create WebSocket:", e);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 4000);
  }

  subscribeWallet(wallet: string): void {
    const normalized = wallet.toLowerCase();
    if (this.currentWallet === normalized) return;

    if (this.currentWallet && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.unsubscribeWallet(this.currentWallet);
    }

    this.currentWallet = normalized;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendSubscriptions(normalized);
    } else {
      this.connect();
    }
  }

  private sendSubscriptions(wallet: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    // Sub clearinghouseState
    this.ws.send(JSON.stringify({
      method: "subscribe",
      subscription: {
        type: "clearinghouseState",
        user: wallet,
        dex: ""
      }
    }));

    // Sub userFills
    this.ws.send(JSON.stringify({
      method: "subscribe",
      subscription: {
        type: "userFills",
        user: wallet
      }
    }));

    // Sub spotState
    this.ws.send(JSON.stringify({
      method: "subscribe",
      subscription: {
        type: "spotState",
        user: wallet
      }
    }));
  }

  private unsubscribeWallet(wallet: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    this.ws.send(JSON.stringify({
      method: "unsubscribe",
      subscription: {
        type: "clearinghouseState",
        user: wallet,
        dex: ""
      }
    }));

    this.ws.send(JSON.stringify({
      method: "unsubscribe",
      subscription: {
        type: "userFills",
        user: wallet
      }
    }));
  }

  addListener(cb: MessageListener): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  destroy(): void {
    this.isExplicitlyClosed = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }
}
