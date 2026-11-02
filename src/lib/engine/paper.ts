/**
 * PaperEngine: Implementation of TradingEngine for "1000x" Paper/Test Trading Mode.
 *
 * Characteristics:
 * - Label: "TEST · PAPER" badge
 * - No wallet required (guest anonymous session or wallet-attached)
 * - Start balance: $10,000 USDC
 * - Reset balance action with cooldown (e.g. 60s)
 * - Leverage: 1x to 1000x on all assets
 * - Presets: 50x, 100x, 250x, 500x, 1000x
 * - Fill price: BBO ±1.5 bps clamped
 * - Isolated margin with MMR = 0.0004
 * - Server-side / background liquidation monitoring
 */

import type {
  TradingEngine,
  TradingMode,
  EngineMarket,
  OrderParams,
  QuoteResult,
  OrderResult,
  CloseResult,
  EnginePosition,
  EngineClosedTrade,
  EngineBalance,
} from "./types";
import {
  paperLiquidationPrice,
  isPaperLiquidated,
  paperPnL,
  paperROI,
  clampBBOFillPrice,
  DEFAULT_MMR,
  DEFAULT_CORRIDOR_BPS,
} from "./paper-math";
import { marketStore } from "../hyperliquid/market-data";
import {
  syncPaperAccount,
  persistPaperPosition,
  persistPaperCloseTrade,
  getSupabase,
} from "../supabase";

const STORAGE_KEY_PREFIX = "godcandle_paper_v3";
const INITIAL_PAPER_BALANCE = 10000;
const RESET_COOLDOWN_MS = 60 * 1000; // 60-second cooldown

export const PAPER_MARKETS: EngineMarket[] = [
  { symbol: "BTC-USD", name: "Bitcoin", index: 0, maxLeverage: 1000, szDecimals: 5, corridorBps: 1.5, defaultPrice: 68420.5 },
  { symbol: "ETH-USD", name: "Ethereum", index: 1, maxLeverage: 1000, szDecimals: 4, corridorBps: 1.5, defaultPrice: 2540.2 },
  { symbol: "SOL-USD", name: "Solana", index: 2, maxLeverage: 1000, szDecimals: 2, corridorBps: 1.5, defaultPrice: 182.4 },
  { symbol: "HYPE-USD", name: "Hyperliquid", index: 3, maxLeverage: 1000, szDecimals: 2, corridorBps: 3.0, defaultPrice: 42.8 },
  { symbol: "SPX-USD", name: "S&P 500", index: 4, maxLeverage: 1000, szDecimals: 2, corridorBps: 1.5, defaultPrice: 6120.0 },
  { symbol: "DOGE-USD", name: "Dogecoin", index: 5, maxLeverage: 1000, szDecimals: 0, corridorBps: 3.0, defaultPrice: 0.164 },
];

export class PaperEngine implements TradingEngine {
  public mode: TradingMode = "paper1000x";
  private sessionId: string;
  private accountId: string | null = null;
  private walletAddress: string | null = null;
  private balance: number = INITIAL_PAPER_BALANCE;
  private positions: EnginePosition[] = [];
  private history: EngineClosedTrade[] = [];
  private lastResetAt: number = 0;
  private listeners = new Set<() => void>();

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.loadState();
    this.initSupabaseSync();
    this.startBackgroundLiquidationMonitor();
  }

  public async attachWallet(walletAddress: string | null) {
    this.walletAddress = walletAddress;
    if (walletAddress) {
      const acct = await syncPaperAccount(this.sessionId, walletAddress);
      if (acct) this.accountId = acct.id;
    }
  }

  private async initSupabaseSync() {
    if (typeof window === "undefined") return;
    try {
      const acct = await syncPaperAccount(this.sessionId, this.walletAddress);
      if (acct) {
        this.accountId = acct.id;
        await this.syncServerState();
      }
    } catch {}
  }

  public async syncServerState() {
    const sb = getSupabase();
    if (!sb || !this.accountId) return;

    try {
      // 1. Fetch any newly closed server-side liquidated trades
      const { data: serverTrades } = await sb
        .from("paper_trades")
        .select("*")
        .eq("account_id", this.accountId)
        .order("closed_at", { ascending: false })
        .limit(30);

      if (serverTrades && serverTrades.length > 0) {
        const liquidatedTrades: EngineClosedTrade[] = serverTrades.map((t: any) => ({
          id: t.position_id || t.id,
          market: t.asset,
          side: t.side,
          stake: parseFloat(t.margin),
          leverage: t.leverage,
          entry: parseFloat(t.entry_price),
          exit: parseFloat(t.exit_price),
          size: parseFloat(t.notional) / (parseFloat(t.entry_price) || 1),
          pnl: parseFloat(t.pnl),
          roiPct: parseFloat(t.roi_pct),
          durationMs: new Date(t.closed_at).getTime() - new Date(t.opened_at).getTime(),
          liquidated: t.liquidated,
          openedAt: new Date(t.opened_at).getTime(),
          closedAt: new Date(t.closed_at).getTime(),
        }));

        // Merge with existing history
        const existingIds = new Set(this.history.map((h) => h.id));
        const newClosed = liquidatedTrades.filter((t) => !existingIds.has(t.id));

        if (newClosed.length > 0) {
          // Remove closed positions from active positions list
          const closedMarkets = new Set(newClosed.map((c) => c.market));
          this.positions = this.positions.filter((p) => !newClosed.some((c) => c.id === p.id));
          this.history = [...newClosed, ...this.history];
          this.saveState();
        }
      }
    } catch (err) {
      console.warn("Paper engine server sync failed:", err);
    }
  }

  private getOrCreateSessionId(): string {
    if (typeof window === "undefined") return "server-session";
    let sid = localStorage.getItem(`${STORAGE_KEY_PREFIX}_session_id`);
    if (!sid) {
      sid = "guest_" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      localStorage.setItem(`${STORAGE_KEY_PREFIX}_session_id`, sid);
    }
    return sid;
  }

  private loadState() {
    if (typeof window === "undefined") return;
    try {
      const storedBal = localStorage.getItem(`${STORAGE_KEY_PREFIX}_balance`);
      if (storedBal) this.balance = parseFloat(storedBal) || INITIAL_PAPER_BALANCE;

      const storedPos = localStorage.getItem(`${STORAGE_KEY_PREFIX}_positions`);
      if (storedPos) this.positions = JSON.parse(storedPos);

      const storedHist = localStorage.getItem(`${STORAGE_KEY_PREFIX}_history`);
      if (storedHist) this.history = JSON.parse(storedHist);

      const storedReset = localStorage.getItem(`${STORAGE_KEY_PREFIX}_last_reset`);
      if (storedReset) this.lastResetAt = parseInt(storedReset, 10) || 0;
    } catch {}
  }

  private saveState() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}_balance`, this.balance.toString());
      localStorage.setItem(`${STORAGE_KEY_PREFIX}_positions`, JSON.stringify(this.positions));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}_history`, JSON.stringify(this.history));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}_last_reset`, this.lastResetAt.toString());
    } catch {}
    this.notify();
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    for (const cb of this.listeners) {
      try {
        cb();
      } catch {}
    }
  }

  public getMarkets(): EngineMarket[] {
    return PAPER_MARKETS;
  }

  public getMaxLeverage(_asset: string): number {
    return 1000;
  }

  public getSzDecimals(asset: string): number {
    const rawAsset = asset.replace("-USD", "");
    const market = PAPER_MARKETS.find((m) => m.symbol.startsWith(rawAsset));
    return market ? market.szDecimals : 4;
  }

  public quote(order: OrderParams, currentPrice: number): QuoteResult {
    const rawAsset = order.asset.replace("-USD", "");
    const market = PAPER_MARKETS.find((m) => m.symbol.startsWith(rawAsset)) || PAPER_MARKETS[0]!;
    const corridor = market.corridorBps || DEFAULT_CORRIDOR_BPS;

    const { execPrice, isClamped } = clampBBOFillPrice(currentPrice, currentPrice, corridor);
    const leverage = Math.min(Math.max(order.leverage, 1), 1000);
    const notional = order.margin * leverage;

    const longBustPrice = paperLiquidationPrice(execPrice, leverage, "long", DEFAULT_MMR);
    const shortBustPrice = paperLiquidationPrice(execPrice, leverage, "short", DEFAULT_MMR);

    // Distance to liquidation: initialMarginRate - mmr
    const imr = 1 / leverage;
    const estBustDistancePct = Math.max(0.001, (imr - DEFAULT_MMR) * 100);
    const estBustDistanceBps = estBustDistancePct * 100;

    const estimatedFeeUsd = 0; // 0 entry fee
    const builderFeeUsd = 0;

    let error: string | null = null;
    const available = this.balance - this.positions.reduce((s, p) => s + p.stake, 0);
    if (order.margin > available) {
      error = "Insufficient available paper balance";
    }

    return {
      asset: order.asset,
      side: order.side,
      margin: order.margin,
      leverage,
      notional,
      execPrice,
      isClamped,
      estBustDistanceBps,
      estBustDistancePct,
      longBustPrice,
      shortBustPrice,
      estimatedFeeUsd,
      builderFeeUsd,
      minNotional: 0,
      error,
    };
  }

  public async placeOrder(order: OrderParams, currentPrice: number): Promise<OrderResult> {
    const available = this.balance - this.positions.reduce((s, p) => s + p.stake, 0);
    if (order.margin > available) {
      return { success: false, error: "Insufficient available paper balance" };
    }
    if (order.margin <= 0) {
      return { success: false, error: "Margin must be greater than zero" };
    }

    const rawAsset = order.asset.replace("-USD", "");
    const market = PAPER_MARKETS.find((m) => m.symbol.startsWith(rawAsset)) || PAPER_MARKETS[0]!;
    const { execPrice } = clampBBOFillPrice(currentPrice, currentPrice, market.corridorBps);
    const leverage = Math.min(Math.max(order.leverage, 1), 1000);
    const notional = order.margin * leverage;
    const liqPrice = paperLiquidationPrice(execPrice, leverage, order.side, DEFAULT_MMR);

    const id = `paper-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const newPos: EnginePosition = {
      id,
      market: rawAsset,
      side: order.side,
      stake: order.margin,
      leverage,
      entry: execPrice,
      size: execPrice > 0 ? notional / execPrice : 0,
      openedAt: Date.now(),
      tp: order.tp ?? null,
      sl: order.sl ?? null,
      liqPrice,
      liquidationPrice: liqPrice,
    };

    this.positions = [newPos, ...this.positions];
    this.saveState();

    if (this.accountId) {
      persistPaperPosition(this.accountId, newPos);
    }

    return { success: true, positionId: id };
  }

  public async closePosition(id: string, currentPrice?: number): Promise<CloseResult> {
    const pos = this.positions.find((p) => p.id === id);
    if (!pos) return { success: false, error: "Position not found" };

    const exitPrice = currentPrice ?? pos.entry;
    const notional = pos.stake * pos.leverage;
    const rawPnl = paperPnL(pos.entry, exitPrice, notional, pos.side);
    const pnl = Math.max(-pos.stake, rawPnl);
    const roiPct = paperROI(pnl, pos.stake);

    const trade: EngineClosedTrade = {
      ...pos,
      exit: exitPrice,
      pnl,
      roiPct,
      durationMs: Date.now() - pos.openedAt,
      liquidated: false,
      closedAt: Date.now(),
    };

    this.positions = this.positions.filter((p) => p.id !== id);
    this.balance += pnl;
    this.history = [trade, ...this.history];
    this.saveState();

    if (this.accountId) {
      persistPaperCloseTrade(this.accountId, trade);
    }

    return { success: true, pnl };
  }

  public getPositions(): EnginePosition[] {
    return this.positions;
  }

  public getHistory(): EngineClosedTrade[] {
    return this.history;
  }

  public async getBalance(): Promise<EngineBalance> {
    const marginUsed = this.positions.reduce((s, p) => s + p.stake, 0);
    const available = Math.max(0, this.balance - marginUsed);
    return {
      balance: this.balance,
      available,
      marginUsed,
    };
  }

  public subscribePrices(asset: string, cb: (price: number) => void): () => void {
    const raw = asset.replace("-USD", "");
    return marketStore.subscribeAsset(raw, (data) => {
      if (data.midPx) cb(data.midPx);
    });
  }

  public async resetBalance(): Promise<{ success: boolean; error?: string; remainingCooldownSec?: number }> {
    const now = Date.now();
    const elapsed = now - this.lastResetAt;
    if (elapsed < RESET_COOLDOWN_MS) {
      const remainingSec = Math.ceil((RESET_COOLDOWN_MS - elapsed) / 1000);
      return {
        success: false,
        error: `Reset cooldown active. Please wait ${remainingSec}s`,
        remainingCooldownSec: remainingSec,
      };
    }

    this.balance = INITIAL_PAPER_BALANCE;
    this.positions = [];
    this.lastResetAt = now;
    this.saveState();
    return { success: true };
  }

  private startBackgroundLiquidationMonitor() {
    if (typeof window === "undefined") return;

    // Monitor live prices from Hyperliquid market store and evaluate liquidations & TP/SL
    marketStore.subscribeMids((mids) => {
      for (const pos of [...this.positions]) {
        const raw = pos.market.replace("-USD", "");
        const price = mids[raw];
        if (!price) continue;

        const liqPrice = pos.liqPrice ?? paperLiquidationPrice(pos.entry, pos.leverage, pos.side, DEFAULT_MMR);
        if (isPaperLiquidated(price, liqPrice, pos.side)) {
          // Liquidate position immediately
          this.executeLiquidation(pos, liqPrice);
        } else if (pos.tp != null && (pos.side === "long" ? price >= pos.tp : price <= pos.tp)) {
          this.closePosition(pos.id, pos.tp);
        } else if (pos.sl != null && (pos.side === "long" ? price <= pos.sl : price >= pos.sl)) {
          this.closePosition(pos.id, pos.sl);
        }
      }
    });
  }

  private executeLiquidation(pos: EnginePosition, exitPrice: number) {
    const trade: EngineClosedTrade = {
      ...pos,
      exit: exitPrice,
      pnl: -pos.stake, // entire margin lost
      roiPct: -100,
      durationMs: Date.now() - pos.openedAt,
      liquidated: true,
      closedAt: Date.now(),
    };

    this.positions = this.positions.filter((p) => p.id !== pos.id);
    this.balance -= pos.stake;
    this.history = [trade, ...this.history];
    this.saveState();

    if (this.accountId) {
      persistPaperCloseTrade(this.accountId, trade);
    }
  }
}

export const paperEngineInstance = new PaperEngine();
