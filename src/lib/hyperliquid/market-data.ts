/**
 * Hyperliquid Market Data Layer
 * Handles caching of meta, metaAndAssetCtxs, candleSnapshot, and single WebSocket connection with fan-out.
 */

import type { L2Book, BookLevel } from '../trading';

export interface HlMetaUniverseItem {
  name: string;
  szDecimals: number;
  maxLeverage: number;
  onlyIsolated?: boolean;
}

export interface HlMeta {
  universe: HlMetaUniverseItem[];
}

export interface HlAssetCtx {
  funding: string;
  openInterest: string;
  prevDayPx: string;
  dayNtlVlm: string;
  oraclePx: string;
  markPx: string;
  midPx?: string;
  impactPxs?: [string, string];
}

export interface HlMarketData {
  symbol: string;
  index: number;
  name: string;
  maxLeverage: number;
  szDecimals: number;
  onlyIsolated: boolean;
  midPx: number;
  markPx: number;
  oraclePx: number;
  prevDayPx: number;
  funding: number;
  openInterest: number;
  dayNtlVlm: number;
}

export interface HlCandle {
  t: number; // open time ms
  T: number; // close time ms
  s: string; // symbol
  i: string; // interval
  o: number;
  c: number;
  h: number;
  l: number;
  v: number;
  n: number;
}

export interface HlTrade {
  coin: string;
  side: 'buy' | 'sell';
  px: number;
  sz: number;
  time: number;
  hash?: string;
}

export type Network = "mainnet" | "testnet";

export function getNetwork(): Network {
  if (typeof process !== "undefined" && process.env?.["NEXT_PUBLIC_HL_NETWORK"]) {
    return process.env["NEXT_PUBLIC_HL_NETWORK"].toLowerCase() === "mainnet"
      ? "mainnet"
      : "testnet";
  }
  return "testnet";
}

export function getHlHttpUrl(): string {
  return getNetwork() === "mainnet"
    ? "https://api.hyperliquid.xyz"
    : "https://api.hyperliquid-testnet.xyz";
}

export function getHlWsUrl(): string {
  return getNetwork() === "mainnet"
    ? "wss://api.hyperliquid.xyz/ws"
    : "wss://api.hyperliquid-testnet.xyz/ws";
}

// 5-minute cache for meta
let cachedMeta: HlMeta | null = null;
let metaCacheTimestamp = 0;
const META_CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

export async function fetchHlMeta(forceRefresh = false): Promise<HlMeta> {
  const now = Date.now();
  if (!forceRefresh && cachedMeta && now - metaCacheTimestamp < META_CACHE_TTL_MS) {
    return cachedMeta;
  }

  try {
    const res = await fetch(`${getHlHttpUrl()}/info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "meta" }),
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch HL meta: HTTP ${res.status}`);
    }
    const data: HlMeta = await res.json();
    if (data && Array.isArray(data.universe)) {
      cachedMeta = data;
      metaCacheTimestamp = now;
      return cachedMeta;
    }
    throw new Error("Invalid meta response from Hyperliquid");
  } catch (err) {
    if (cachedMeta) return cachedMeta;
    return getFallbackMeta();
  }
}

export async function fetchHlMetaAndAssetCtxs(): Promise<[HlMeta, HlAssetCtx[]]> {
  try {
    const res = await fetch(`${getHlHttpUrl()}/info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "metaAndAssetCtxs" }),
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch metaAndAssetCtxs: HTTP ${res.status}`);
    }
    const data = (await res.json()) as [HlMeta, HlAssetCtx[]];
    if (data && data[0] && Array.isArray(data[0].universe)) {
      cachedMeta = data[0];
      metaCacheTimestamp = Date.now();
      return data;
    }
    throw new Error("Invalid metaAndAssetCtxs response");
  } catch (err) {
    const meta = cachedMeta ?? getFallbackMeta();
    const ctxs = meta.universe.map((u) => ({
      funding: "0.0000125",
      openInterest: "500000",
      prevDayPx: u.name === "BTC" ? "68000" : "2500",
      dayNtlVlm: "10000000",
      oraclePx: u.name === "BTC" ? "68450" : "2550",
      markPx: u.name === "BTC" ? "68450" : "2550",
      midPx: u.name === "BTC" ? "68450" : "2550",
    }));
    return [meta, ctxs];
  }
}

export async function fetchCandleSnapshot(
  coin: string,
  interval = "15m",
  startTime?: number,
  endTime?: number
): Promise<HlCandle[]> {
  const end = endTime ?? Date.now();
  const start = startTime ?? end - 24 * 60 * 60 * 1000;
  try {
    const res = await fetch(`${getHlHttpUrl()}/info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "candleSnapshot",
        req: { coin, interval, startTime: start, endTime: end },
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      return data.map((c: any) => ({
        t: c.t,
        T: c.T,
        s: c.s,
        i: c.i,
        o: parseFloat(c.o),
        c: parseFloat(c.c),
        h: parseFloat(c.h),
        l: parseFloat(c.l),
        v: parseFloat(c.v),
        n: c.n,
      }));
    }
    return [];
  } catch {
    return [];
  }
}

export async function fetchL2BookSnapshot(coin: string): Promise<L2Book> {
  try {
    const res = await fetch(`${getHlHttpUrl()}/info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "l2Book",
        coin,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data && Array.isArray(data.levels) && data.levels.length >= 2) {
      const bids: BookLevel[] = data.levels[0].map((l: any) => ({
        px: parseFloat(l.px),
        sz: parseFloat(l.sz),
      }));
      const asks: BookLevel[] = data.levels[1].map((l: any) => ({
        px: parseFloat(l.px),
        sz: parseFloat(l.sz),
      }));
      return { bids, asks, time: data.time };
    }
  } catch {}
  return { bids: [], asks: [] };
}

export async function fetchOpenOrders(user: string): Promise<any[]> {
  if (!user) return [];
  try {
    const res = await fetch(`${getHlHttpUrl()}/info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "openOrders",
        user,
      }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function fetchUserFundingHistory(user: string, startTime?: number): Promise<any[]> {
  if (!user) return [];
  try {
    const start = startTime ?? Date.now() - 7 * 24 * 60 * 60 * 1000;
    const res = await fetch(`${getHlHttpUrl()}/info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "userFunding",
        user,
        startTime: start,
      }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// Global WebSocket manager with fan-out
type PriceCallback = (mids: Record<string, number>) => void;
type AssetCallback = (data: Partial<HlMarketData>) => void;
type CandleCallback = (candle: HlCandle) => void;
type BookCallback = (book: L2Book) => void;
type TradesCallback = (trades: HlTrade[]) => void;

class HyperliquidMarketStore {
  private ws: WebSocket | null = null;
  private reconnectTimeout: any = null;
  private backoffMs = 1000;
  private maxBackoffMs = 16000;
  private isConnecting = false;

  private allMidsListeners = new Set<PriceCallback>();
  private assetListeners = new Map<string, Set<AssetCallback>>();
  private candleListeners = new Map<string, Set<CandleCallback>>();
  private bookListeners = new Map<string, Set<BookCallback>>();
  private tradesListeners = new Map<string, Set<TradesCallback>>();

  public latestMids: Record<string, number> = {};
  public latestMarketData: Record<string, HlMarketData> = {};
  public latestBooks: Record<string, L2Book> = {};

  constructor() {
    if (typeof window !== "undefined") {
      this.init();
    }
  }

  public init() {
    if (this.ws || this.isConnecting) return;
    this.connect();
  }

  private connect() {
    if (typeof window === "undefined" || typeof WebSocket === "undefined") return;
    this.isConnecting = true;

    try {
      const url = getHlWsUrl();
      const ws = new WebSocket(url);
      this.ws = ws;

      ws.onopen = () => {
        this.isConnecting = false;
        this.backoffMs = 1000;
        // Subscribe to allMids
        ws.send(JSON.stringify({ method: "subscribe", subscription: { type: "allMids" } }));

        // Re-subscribe any active coin channels
        const activeCoins = new Set<string>([
          ...this.assetListeners.keys(),
          ...this.bookListeners.keys(),
          ...this.tradesListeners.keys(),
        ]);

        for (const coin of activeCoins) {
          ws.send(JSON.stringify({ method: "subscribe", subscription: { type: "l2Book", coin } }));
          ws.send(JSON.stringify({ method: "subscribe", subscription: { type: "trades", coin } }));
        }

        for (const key of this.candleListeners.keys()) {
          const [coin, interval] = key.split(":");
          ws.send(
            JSON.stringify({
              method: "subscribe",
              subscription: { type: "candle", coin, interval },
            })
          );
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch {}
      };

      ws.onerror = () => {
        try {
          ws.close();
        } catch {}
      };

      ws.onclose = () => {
        this.ws = null;
        this.isConnecting = false;
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = setTimeout(() => {
          this.connect();
        }, this.backoffMs);
        this.backoffMs = Math.min(this.backoffMs * 2, this.maxBackoffMs);
      };
    } catch {
      this.isConnecting = false;
      this.ws = null;
    }
  }

  private handleMessage(msg: any) {
    if (!msg || !msg.channel) return;

    if (msg.channel === "allMids" && msg.data?.mids) {
      const mids: Record<string, number> = {};
      for (const [coin, val] of Object.entries(msg.data.mids)) {
        mids[coin] = parseFloat(val as string);
      }
      this.latestMids = { ...this.latestMids, ...mids };
      for (const cb of this.allMidsListeners) {
        cb(this.latestMids);
      }
      for (const [coin, mid] of Object.entries(mids)) {
        const listeners = this.assetListeners.get(coin);
        if (listeners) {
          for (const cb of listeners) {
            cb({ midPx: mid });
          }
        }
      }
    } else if (msg.channel === "candle" && msg.data) {
      const c = msg.data;
      const key = `${c.s}:${c.i}`;
      const listeners = this.candleListeners.get(key);
      if (listeners) {
        const candle: HlCandle = {
          t: c.t,
          T: c.T,
          s: c.s,
          i: c.i,
          o: parseFloat(c.o),
          c: parseFloat(c.c),
          h: parseFloat(c.h),
          l: parseFloat(c.l),
          v: parseFloat(c.v),
          n: c.n,
        };
        for (const cb of listeners) {
          cb(candle);
        }
      }
    } else if (msg.channel === "l2Book" && msg.data) {
      const b = msg.data;
      const coin = b.coin;
      if (coin && Array.isArray(b.levels) && b.levels.length >= 2) {
        const bids: BookLevel[] = b.levels[0].map((l: any) => ({
          px: parseFloat(l.px),
          sz: parseFloat(l.sz),
        }));
        const asks: BookLevel[] = b.levels[1].map((l: any) => ({
          px: parseFloat(l.px),
          sz: parseFloat(l.sz),
        }));
        const book: L2Book = { bids, asks, time: b.time };
        this.latestBooks[coin] = book;

        const listeners = this.bookListeners.get(coin);
        if (listeners) {
          for (const cb of listeners) {
            cb(book);
          }
        }
      }
    } else if (msg.channel === "trades" && Array.isArray(msg.data)) {
      const tradesData = msg.data;
      if (tradesData.length > 0) {
        const coin = tradesData[0].coin;
        const mappedTrades: HlTrade[] = tradesData.map((t: any) => ({
          coin: t.coin,
          side: t.side === "B" ? "buy" : "sell",
          px: parseFloat(t.px),
          sz: parseFloat(t.sz),
          time: t.time,
          hash: t.hash,
        }));

        const listeners = this.tradesListeners.get(coin);
        if (listeners) {
          for (const cb of listeners) {
            cb(mappedTrades);
          }
        }
      }
    }
  }

  public subscribeMids(cb: PriceCallback): () => void {
    this.allMidsListeners.add(cb);
    if (Object.keys(this.latestMids).length > 0) {
      cb(this.latestMids);
    }
    this.init();
    return () => {
      this.allMidsListeners.delete(cb);
    };
  }

  public subscribeAsset(coin: string, cb: AssetCallback): () => void {
    let set = this.assetListeners.get(coin);
    if (!set) {
      set = new Set();
      this.assetListeners.set(coin, set);
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ method: "subscribe", subscription: { type: "l2Book", coin } }));
        this.ws.send(JSON.stringify({ method: "subscribe", subscription: { type: "trades", coin } }));
      }
    }
    set.add(cb);
    this.init();
    return () => {
      set?.delete(cb);
      if (set?.size === 0) {
        this.assetListeners.delete(coin);
      }
    };
  }

  public subscribeCandles(coin: string, interval: string, cb: CandleCallback): () => void {
    const key = `${coin}:${interval}`;
    let set = this.candleListeners.get(key);
    if (!set) {
      set = new Set();
      this.candleListeners.set(key, set);
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(
          JSON.stringify({
            method: "subscribe",
            subscription: { type: "candle", coin, interval },
          })
        );
      }
    }
    set.add(cb);
    this.init();
    return () => {
      set?.delete(cb);
      if (set?.size === 0) {
        this.candleListeners.delete(key);
      }
    };
  }

  public subscribeL2Book(coin: string, cb: BookCallback): () => void {
    let set = this.bookListeners.get(coin);
    if (!set) {
      set = new Set();
      this.bookListeners.set(coin, set);
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ method: "subscribe", subscription: { type: "l2Book", coin } }));
      }
    }
    set.add(cb);
    if (this.latestBooks[coin]) {
      cb(this.latestBooks[coin]);
    }
    this.init();
    return () => {
      set?.delete(cb);
      if (set?.size === 0) {
        this.bookListeners.delete(coin);
      }
    };
  }

  public subscribeTrades(coin: string, cb: TradesCallback): () => void {
    let set = this.tradesListeners.get(coin);
    if (!set) {
      set = new Set();
      this.tradesListeners.set(coin, set);
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ method: "subscribe", subscription: { type: "trades", coin } }));
      }
    }
    set.add(cb);
    this.init();
    return () => {
      set?.delete(cb);
      if (set?.size === 0) {
        this.tradesListeners.delete(coin);
      }
    };
  }
}

export const marketStore = new HyperliquidMarketStore();

function getFallbackMeta(): HlMeta {
  return {
    universe: [
      { name: "BTC", szDecimals: 5, maxLeverage: 50 },
      { name: "ETH", szDecimals: 4, maxLeverage: 50 },
      { name: "SOL", szDecimals: 2, maxLeverage: 20 },
      { name: "HYPE", szDecimals: 2, maxLeverage: 10 },
      { name: "DOGE", szDecimals: 0, maxLeverage: 10 },
    ],
  };
}
