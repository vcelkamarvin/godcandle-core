import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { getMarket, type MarketSymbol } from "@/config/markets";
import { INITIAL_BALANCE } from "@/lib/mock-data";
import { getSnap, startFeed, useFeeds } from "@/lib/price-feed";
import { fmtSigned, fmtUsd, isLiquidated, liquidation, openingError, pnlOf, type ClosedTrade, type Position, type Side } from "@/lib/engine";

function useTradingState() {
  const feeds = useFeeds();
  const [positions, setPositions] = useState<Position[]>([]);
  const [history, setHistory] = useState<ClosedTrade[]>([]);
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const positionsRef = useRef(positions);
  positionsRef.current = positions;
  useEffect(() => startFeed(), []);
  function close(
    target: string,
    liquidated = false,
    trigger?: "tp" | "sl" | "liquidation" | "manual"
  ) {
    const position = positionsRef.current.find((p) => p.id === target || p.market === target);
    if (!position) return;
    const exit = liquidated ? liquidation(position) : getSnap(position.market).price;
    const pnl = pnlOf(position, exit);
    const trade = {
      ...position,
      exit,
      pnl,
      liquidated,
      closedAt: Date.now(),
      durationMs: Date.now() - position.openedAt,
    };
    positionsRef.current = positionsRef.current.filter((p) => p.id !== position.id);
    setPositions(positionsRef.current);
    setHistory((h) => [trade, ...h]);
    setBalance((b) => b + pnl);

    if (liquidated || trigger === "liquidation") {
      toast.error(`${position.market} liquidated at $${fmtUsd(exit, getMarket(position.market).decimals)}`);
    } else if (trigger === "tp") {
      toast.success(`Take Profit triggered for ${position.market} (${fmtSigned(pnl)})`);
    } else if (trigger === "sl") {
      toast.error(`Stop Loss triggered for ${position.market} (${fmtSigned(pnl)})`);
    } else {
      toast(`Closed ${position.market} ${fmtSigned(pnl)}`);
    }
  }
  useEffect(() => {
    for (const p of [...positionsRef.current]) {
      const feed = feeds[p.market];
      if (!feed) continue;
      const price = feed.price;
      if (isLiquidated(p, price)) {
        close(p.id, true, "liquidation");
      } else if (p.tp != null && (p.side === "long" ? price >= p.tp : price <= p.tp)) {
        close(p.id, false, "tp");
      } else if (p.sl != null && (p.side === "long" ? price <= p.sl : price >= p.sl)) {
        close(p.id, false, "sl");
      }
    }
  }, [feeds]);
  function open(market: MarketSymbol, side: Side, stake: number, leverage: number, tp?: number | null, sl?: number | null) {
    const error = openingError(market, stake, leverage, balance, positionsRef.current, getSnap(market).status);
    if (error) { toast.error(error); return; }
    const uniqueId = typeof crypto !== "undefined" && crypto.randomUUID
      ? `pos-${crypto.randomUUID().slice(0, 8)}`
      : `pos-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const p: Position = {
      id: uniqueId,
      market,
      side,
      stake,
      leverage,
      entry: getSnap(market).price,
      openedAt: Date.now(),
      tp: tp ?? null,
      sl: sl ?? null,
    };
    positionsRef.current = [...positionsRef.current, p];
    setPositions(positionsRef.current);
  }
  function deposit(amount: number) {
    if (amount <= 0 || !Number.isFinite(amount)) return;
    setBalance((b) => b + amount);
    toast.success(`Deposit credited`, {
      description: `$${fmtUsd(amount)} USDC added to available margin on HyperEVM.`,
    });
  }
  function withdraw(amount: number) {
    if (amount <= 0 || !Number.isFinite(amount)) return;
    if (amount > available) {
      toast.error("Insufficient available margin");
      return;
    }
    setBalance((b) => b - amount);
    toast.success(`Withdrawal processed`, {
      description: `$${fmtUsd(amount)} USDC dispatched via FIFO settlement.`,
    });
  }
  const available = balance - positions.reduce((s, p) => s + p.stake, 0);
  return { feeds, positions, history, balance, available, open, close, deposit, withdraw };
}
const TradingContext = createContext<ReturnType<typeof useTradingState> | null>(null);
export function TradingProvider({ children }: { children: ReactNode }) {
  const state = useTradingState();
  return <TradingContext.Provider value={state}>{children}</TradingContext.Provider>;
}
export function useTrading() {
  const context = useContext(TradingContext);
  if (!context) throw new Error("TradingProvider is required");
  return context;
}