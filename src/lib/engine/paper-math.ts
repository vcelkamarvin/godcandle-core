/**
 * Authoritative Paper Trading (1000x) Mathematical Formulas
 *
 * Configurable constants:
 * - mmr: default 0.0004 (4 bps)
 * - corridorBps: default 1.5 bps
 *
 * Formulas:
 * - initialMarginRate = 1 / leverage
 * - Long liq = entry * (1 - initialMarginRate + mmr)
 * - Short liq = entry * (1 + initialMarginRate - mmr)
 * - PnL = (exit - entry) / entry * notional * (long ? 1 : -1)
 * - ROI% = PnL / margin
 */

export const DEFAULT_MMR = 0.0004;
export const DEFAULT_CORRIDOR_BPS = 1.5;
export const DEFAULT_TAKER_FEE_BPS = 0;

export function initialMarginRate(leverage: number): number {
  if (leverage <= 0) throw new Error("Leverage must be positive");
  return 1 / leverage;
}

export function longLiquidationPrice(entry: number, leverage: number, mmr = DEFAULT_MMR): number {
  const imr = initialMarginRate(leverage);
  return entry * (1 - imr + mmr);
}

export function shortLiquidationPrice(entry: number, leverage: number, mmr = DEFAULT_MMR): number {
  const imr = initialMarginRate(leverage);
  return entry * (1 + imr - mmr);
}

export function paperLiquidationPrice(
  entry: number,
  leverage: number,
  side: "long" | "short",
  mmr = DEFAULT_MMR
): number {
  return side === "long"
    ? longLiquidationPrice(entry, leverage, mmr)
    : shortLiquidationPrice(entry, leverage, mmr);
}

export function isPaperLiquidated(mark: number, liqPrice: number, side: "long" | "short"): boolean {
  return side === "long" ? mark <= liqPrice : mark >= liqPrice;
}

export function paperPnL(
  entry: number,
  exit: number,
  notional: number,
  side: "long" | "short"
): number {
  if (entry <= 0) return 0;
  const direction = side === "long" ? 1 : -1;
  return ((exit - entry) / entry) * notional * direction;
}

export function paperROI(pnl: number, margin: number): number {
  if (margin <= 0) return 0;
  return (pnl / margin) * 100;
}

export function clampBBOFillPrice(
  mid: number,
  mark: number,
  corridorBps = DEFAULT_CORRIDOR_BPS
): { execPrice: number; isClamped: boolean; deviationBps: number } {
  const maxDelta = corridorBps / 10000;
  const lowerBound = mark * (1 - maxDelta);
  const upperBound = mark * (1 + maxDelta);

  let execPrice = mid;
  let isClamped = false;

  if (mid < lowerBound) {
    execPrice = lowerBound;
    isClamped = true;
  } else if (mid > upperBound) {
    execPrice = upperBound;
    isClamped = true;
  }

  const deviationBps = mark > 0 ? ((mid - mark) / mark) * 10000 : 0;
  return { execPrice, isClamped, deviationBps };
}
