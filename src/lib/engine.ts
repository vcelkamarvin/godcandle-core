import { getMarket, type MarketSymbol, type MarketStatus } from "@/config/markets";
export type Side = "long" | "short";
export const FEE_RATE = .0004;
export const STAKES = [10,25,50,100,250,500];
export const LEVERAGES = [50,100,250,500,1000];
export interface Position { id: string; market: MarketSymbol; side: Side; stake: number; leverage: number; entry: number; openedAt: number }
export interface ClosedTrade extends Position { exit: number; pnl: number; durationMs: number; liquidated: boolean; closedAt: number }
export const notional = (stake: number, lev: number) => stake * lev;
export const feeUsd = (stake: number, lev: number, feeRate = FEE_RATE) => notional(stake,lev) * feeRate;
export const liqDistancePct = (lev: number, feeRate = FEE_RATE) => (1/lev-feeRate)*100;
export const liqPrice = (entry: number, lev: number, side: Side, feeRate = FEE_RATE) => entry * (1 + (side === "long" ? -1 : 1)*(1/lev-feeRate));
export const priceMovePnl = (p: Position, mark: number) => notional(p.stake,p.leverage)*(mark-p.entry)/p.entry*(p.side === "long" ? 1 : -1);
export const positionFee = (p: Position) => feeUsd(p.stake,p.leverage,getMarket(p.market).feeRate);
export const rawPnl = (p: Position, mark: number) => priceMovePnl(p,mark)-positionFee(p);
export const pnlOf = (p: Position, mark: number) => Math.max(-p.stake,rawPnl(p,mark));
export const liquidation = (p: Position) => liqPrice(p.entry,p.leverage,p.side,getMarket(p.market).feeRate);
export const distanceToLiquidation = (p: Position, mark: number) => Math.max(0,(p.side === "long" ? mark-liquidation(p) : liquidation(p)-mark)/mark*100);
export const isLiquidated = (p: Position, mark: number) => p.side === "long" ? mark <= liquidation(p) : mark >= liquidation(p);
export const liqHealth = (p: Position, mark: number) => Math.min(1,Math.max(0,(mark-liquidation(p))/(p.entry-liquidation(p))));
export function openingError(market: MarketSymbol, stake: number, leverage: number, balance: number, open: Position[], status: MarketStatus): string | null {
 const m = getMarket(market);
 if (status !== "open") return status === "closed" ? "Market closed" : "Market paused";
 if (open.some(p => p.market === market)) return "Position already open";
 if (open.length >= 3) return "Maximum 3 open positions";
 if (!Number.isFinite(stake) || stake < m.minStake || stake > m.maxStake) return `Stake must be $${m.minStake}–$${m.maxStake}`;
 if (!LEVERAGES.includes(leverage) || leverage > m.maxLeverage) return "Invalid leverage";
 if (stake > balance-open.reduce((sum,p)=>sum+p.stake,0)) return "Not enough available balance";
 return null;
}
export const fmtUsd = (n: number, dp = 2) => n.toLocaleString("en-US",{minimumFractionDigits:dp,maximumFractionDigits:dp});
export const fmtSigned = (n: number, dp = 2) => `${n>=0?"+":"−"}$${fmtUsd(Math.abs(n),dp)}`;
export const fmtDuration = (ms: number) => { const s = Math.max(0,Math.floor(ms/1000)); return s >= 60 ? `${Math.floor(s/60)}m ${String(s%60).padStart(2,"0")}s` : `${s}s`; };
