import { useEffect } from "react";
import { HyperliquidWebSocketManager } from "../services/websocketManager";

export function useLiveUpdates(address: string | null, onUpdate?: () => void) {
  useEffect(() => {
    if (!address) return;

    const wsManager = HyperliquidWebSocketManager.getInstance();
    wsManager.subscribeWallet(address);

    const unsubscribe = wsManager.addListener((data: unknown) => {
      const msg = data as { channel?: string };
      if (msg && (msg.channel === "clearinghouseState" || msg.channel === "userFills")) {
        onUpdate?.();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [address, onUpdate]);
}
