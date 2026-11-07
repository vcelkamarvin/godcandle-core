import { PerpPosition, TradeFill, PnlPoint } from "../types/trader";

export interface AnalyticsStats {
  volume: number | null;
  closedTrades: number | null;
  winRate: number | null;
  profitFactor: number | null;
  maxDrawdown: number | null;
  longExposure: number;
  shortExposure: number;
  longRatio: number;
  shortRatio: number;
}

/**
 * Calculates current long vs short total open exposure and percentage split.
 */
export function calculateExposure(positions: PerpPosition[]) {
  let longExposure = 0;
  let shortExposure = 0;

  for (const pos of positions) {
    if (pos.side === "LONG") {
      longExposure += Math.abs(pos.positionValue);
    } else {
      shortExposure += Math.abs(pos.positionValue);
    }
  }

  const total = longExposure + shortExposure;
  const longRatio = total > 0 ? Math.round((longExposure / total) * 100) : 50;
  const shortRatio = total > 0 ? 100 - longRatio : 50;

  return {
    longExposure,
    shortExposure,
    longRatio,
    shortRatio
  };
}

/**
 * Groups fills into position lifecycle rounds to calculate win rate and profit factor.
 * If fills cannot be reconstructed into completed rounds, computes on closed realized PnL fills.
 */
export function calculateWinRateAndProfitFactor(fills: TradeFill[]) {
  if (!fills || fills.length === 0) {
    return {
      winRate: null,
      profitFactor: null,
      closedTrades: null
    };
  }

  // Filter fills with realized pnl
  const closedFills = fills.filter((f) => f.closedPnl !== 0);

  if (closedFills.length === 0) {
    return {
      winRate: null,
      profitFactor: null,
      closedTrades: 0
    };
  }

  let winningPnl = 0;
  let losingPnl = 0;
  let wins = 0;
  let losses = 0;

  for (const f of closedFills) {
    if (f.closedPnl > 0) {
      wins++;
      winningPnl += f.closedPnl;
    } else if (f.closedPnl < 0) {
      losses++;
      losingPnl += Math.abs(f.closedPnl);
    }
  }

  const totalClosed = wins + losses;
  const winRate = totalClosed > 0 ? Number(((wins / totalClosed) * 100).toFixed(1)) : null;
  const profitFactor = losingPnl > 0 ? Number((winningPnl / losingPnl).toFixed(2)) : (winningPnl > 0 ? 99.9 : null);

  return {
    winRate,
    profitFactor,
    closedTrades: totalClosed
  };
}

/**
 * Computes maximum drawdown percentage from account value history points.
 */
export function calculateMaxDrawdown(history: PnlPoint[]): number | null {
  if (!history || history.length < 2) return null;

  let peak = -Infinity;
  let maxDd = 0;

  for (const pt of history) {
    if (pt.value > peak) {
      peak = pt.value;
    }
    if (peak > 0) {
      const dd = (peak - pt.value) / peak;
      if (dd > maxDd) {
        maxDd = dd;
      }
    }
  }

  return maxDd > 0 ? Number((maxDd * 100).toFixed(1)) : 0;
}
