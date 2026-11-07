import { useState, useEffect } from "react";
import { SHARED_BTC_PRICE } from "./mock-data";

type PriceListener = (prices: Record<string, number>) => void;

class LivePriceManager {
  private prices: Record<string, number> = {
    BTC: SHARED_BTC_PRICE,
    ETH: 2800,
    SPX: 6120,
    SOL: 178.5,
    HYPE: 24.8,
    DOGE: 0.22,
  };
  private changes24h: Record<string, number> = {
    BTC: 2.45,
    ETH: 1.82,
    SPX: 0.42,
    SOL: 3.15,
    HYPE: 4.88,
    DOGE: -1.25,
  };
  private listeners: Set<PriceListener> = new Set();
  private isLivePolling: boolean = false;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startLiveFeed();
  }

  public getPrice(symbol: string = "BTC"): number {
    return this.prices[symbol] ?? (symbol === "BTC" ? SHARED_BTC_PRICE : 100);
  }

  public getAllPrices(): Record<string, number> {
    return { ...this.prices };
  }

  public getChange24h(symbol: string = "BTC"): number {
    return this.changes24h[symbol] ?? 0;
  }

  public getFormattedPrice(symbol: string = "BTC"): string {
    const p = this.getPrice(symbol);
    const decimals = symbol === "DOGE" ? 4 : symbol === "SPX" ? 1 : 2;
    return `$${p.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`;
  }

  public subscribe(listener: PriceListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.prices);
      } catch (err) {
        console.error("Price listener error", err);
      }
    }
  }

  public setPrice(symbol: string, newPrice: number, change?: number) {
    if (newPrice > 0) {
      this.prices[symbol] = newPrice;
      if (typeof change === "number") {
        this.changes24h[symbol] = change;
      }
      this.notify();
    }
  }

  private startLiveFeed() {
    if (typeof window === "undefined" || this.isLivePolling) return;
    this.isLivePolling = true;

    // Fetch real live prices from Hyperliquid allMids or Binance
    const fetchLatest = async () => {
      // 1. Try Hyperliquid info endpoint (POST { type: "allMids" })
      try {
        const hlRes = await fetch("https://api.hyperliquid.xyz/info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "allMids" }),
        });
        if (hlRes.ok) {
          const mids = (await hlRes.json()) as Record<string, string>;
          if (mids && typeof mids === "object") {
            let updated = false;
            for (const sym of ["BTC", "ETH", "SOL", "HYPE", "DOGE"]) {
              if (mids[sym]) {
                const val = parseFloat(mids[sym]);
                if (!isNaN(val) && val > 0) {
                  this.prices[sym] = val;
                  updated = true;
                }
              }
            }
            if (updated) {
              this.notify();
              return;
            }
          }
        }
      } catch {
        // Fallback to Binance
      }

      // 2. Fallback to Binance public ticker
      try {
        const res = await fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT");
        if (res.ok) {
          const data = await res.json();
          if (data && data.lastPrice) {
            const p = parseFloat(data.lastPrice);
            const ch = parseFloat(data.priceChangePercent);
            if (!isNaN(p) && p > 1000) {
              this.prices.BTC = p;
              if (!isNaN(ch)) this.changes24h.BTC = ch;
              this.notify();
            }
          }
        }
      } catch {
        // Gracefully keep current prices
      }
    };

    fetchLatest();
    this.timer = setInterval(fetchLatest, 4000); // 4-second poll for snappy real-time prices
  }
}

export const livePriceManager = new LivePriceManager();

export function useLiveBtcPrice(): {
  price: number;
  priceFormatted: string;
  change24h: string;
  isUp: boolean;
} {
  const [price, setPrice] = useState<number>(() => livePriceManager.getPrice("BTC"));

  useEffect(() => {
    const unsub = livePriceManager.subscribe((prices) => {
      if (prices.BTC) setPrice(prices.BTC);
    });
    return unsub;
  }, []);

  const change = livePriceManager.getChange24h("BTC");

  return {
    price,
    priceFormatted: `$${price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
    change24h: `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`,
    isUp: change >= 0,
  };
}

export function useLiveMarketPrice(symbol: string): {
  price: number;
  priceFormatted: string;
  change24h: number;
  isUp: boolean;
} {
  const [price, setPrice] = useState<number>(() => livePriceManager.getPrice(symbol));

  useEffect(() => {
    const unsub = livePriceManager.subscribe((prices) => {
      if (prices[symbol]) setPrice(prices[symbol]);
    });
    return unsub;
  }, [symbol]);

  const change = livePriceManager.getChange24h(symbol);
  const decimals = symbol === "DOGE" ? 4 : symbol === "SPX" ? 1 : 2;

  return {
    price,
    priceFormatted: `$${price.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`,
    change24h: change,
    isUp: change >= 0,
  };
}
