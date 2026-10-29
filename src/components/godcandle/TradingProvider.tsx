import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { type MarketSymbol } from "@/config/markets";
import { INITIAL_BALANCE } from "@/lib/mock-data";
import { getSnap, startFeed, useFeeds } from "@/lib/price-feed";
import { fmtSigned, isLiquidated, liquidation, openingError, pnlOf, type ClosedTrade, type Position, type Side } from "@/lib/engine";

function useTradingState() {
  const feeds = useFeeds();
  const [positions, setPositions] = useState<Position[]>([]);
  const [history, setHistory] = useState<ClosedTrade[]>([]);
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const positionsRef = useRef(positions);
  positionsRef.current = positions;
  useEffect(() => startFeed(), []);
  function close(market: MarketSymbol, liquidated = false) {
    const position = positionsRef.current.find(p => p.market === market);
    if (!position) return;
    const exit = liquidated ? liquidation(position) : getSnap(market).price;
    const pnl = pnlOf(position, exit);
    const trade = { ...position, exit, pnl, liquidated, closedAt: Date.now(), durationMs: Date.now() - position.openedAt };
    positionsRef.current = positionsRef.current.filter(p => p.id !== position.id);
    setPositions(positionsRef.current);
    setHistory(h => [trade, ...h]);
    setBalance(b => b + pnl);
    toast(liquidated ? `${market} liquidated` : `Closed ${market} ${fmtSigned(pnl)}`);
  }
  useEffect(() => {
    for (const p of positionsRef.current) if (isLiquidated(p, feeds[p.market].price)) close(p.market, true);
  }, [feeds]);
  function open(market: MarketSymbol, side: Side, stake: number, leverage: number) {
    const error = openingError(market, stake, leverage, balance, positionsRef.current, getSnap(market).status);
    if (error) { toast.error(error); return; }
    const p: Position = { id: crypto.randomUUID(), market, side, stake, leverage, entry: getSnap(market).price, openedAt: Date.now() };
    positionsRef.current = [...positionsRef.current, p];
    setPositions(positionsRef.current);
  }
  const available = balance - positions.reduce((s, p) => s + p.stake, 0);
  return { feeds, positions, history, balance, available, open, close };
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