export type Side = "long" | "short";

export const FEE_RATE = 0.0004; // 0.04% of notional
export const STAKES = [10, 25, 50, 100, 250, 500];
export const LEVERAGES = [50, 100, 250, 500, 1000];

export interface Position {
  id: string;
  side: Side;
  stake: number;
  leverage: number;
  entry: number;
  openedAt: number;
}

export interface ClosedTrade {
  id: string;
  side: Side;
  stake: number;
  leverage: number;
  entry: number;
  exit: number;
  pnl: number;
  durationMs: number;
  liquidated: boolean;
  closedAt: number;
}

export const notional = (stake: number, lev: number) => stake * lev;
/** Liquidation distance in percent: 100 / leverage. */
export const liqDistancePct = (lev: number) => 100 / lev;
export const liqPrice = (entry: number, lev: number, side: Side) =>
  side === "long" ? entry * (1 - 1 / lev) : entry * (1 + 1 / lev);
export const feeUsd = (stake: number, lev: number) => notional(stake, lev) * FEE_RATE;

/** Net P&L including fee; loss is capped at the stake. */
export function pnlOf(p: Position, mark: number) {
  const dir = p.side === "long" ? 1 : -1;
  const gross = (notional(p.stake, p.leverage) * (mark - p.entry) * dir) / p.entry;
  return Math.max(-p.stake, gross - feeUsd(p.stake, p.leverage));
}

export function isLiquidated(p: Position, mark: number) {
  const liq = liqPrice(p.entry, p.leverage, p.side);
  return p.side === "long" ? mark <= liq : mark >= liq;
}

/** 1 = at/above entry (far from liq), 0 = at liquidation. */
export function liqHealth(p: Position, mark: number) {
  const liq = liqPrice(p.entry, p.leverage, p.side);
  const h = (mark - liq) / (p.entry - liq);
  return Math.min(1, Math.max(0, h));
}

export const fmtUsd = (n: number, dp = 2) =>
  n.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });
export const fmtSigned = (n: number, dp = 2) => `${n >= 0 ? "+" : "−"}$${fmtUsd(Math.abs(n), dp)}`;
export const fmtDuration = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${String(s % 60).padStart(2, "0")}s` : `${s}s`;
};
