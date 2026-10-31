export interface L1MarketQuote {
  symbol: string;
  index: number;
  bid: number;
  ask: number;
  mid: number;
  markPx: number;
  clampedPx: number;
  isClamped: boolean;
  corridorBps: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: string;
  fundingRate: string;
}

export function computeClampedPrice(
  mid: number,
  markPx: number,
  corridorBps: number = 1.5
): { execPrice: number; isClamped: boolean; deviationBps: number } {
  const maxDelta = corridorBps / 10000;
  const lowerBound = markPx * (1 - maxDelta);
  const upperBound = markPx * (1 + maxDelta);

  let execPrice = mid;
  let isClamped = false;

  if (mid < lowerBound) {
    execPrice = lowerBound;
    isClamped = true;
  } else if (mid > upperBound) {
    execPrice = upperBound;
    isClamped = true;
  }

  const deviationBps = ((mid - markPx) / markPx) * 10000;
  return { execPrice, isClamped, deviationBps };
}

export function computeBustDistance(leverage: number): {
  bustDistanceBps: number;
  bustDistancePct: number;
} {
  // BustDistance(bps) = 10000 / Leverage - 4.8
  const bustDistanceBps = Math.max(0.1, 10000 / leverage - 4.8);
  const bustDistancePct = bustDistanceBps / 100;
  return { bustDistanceBps, bustDistancePct };
}

export function computeWinHaircut(
  grossPriceMovePct: number,
  notional: number
): {
  netGainPct: number;
  scaleFactor: number;
  pnlNet: number;
} {
  const d = Math.max(0, grossPriceMovePct / 100);
  // Deadband threshold: 0.2 bps (0.002%) subtracted from gross price move: dnet = max(d - 0.00002, 0)
  const dnet = Math.max(0, d - 0.00002);

  // Account notional scale factor:
  // scale(dnet, N) = 1 - 0.05 / (1 + 116000 * dnet + (N / 1000000) * 800 * dnet)
  const denominator = 1 + 116000 * dnet + (notional / 1000000) * 800 * dnet;
  const scale = 1 - 0.05 / denominator;

  // Protocol settlement fee: 2.0% deducted from adjusted gain
  const pnlNet = notional * dnet * scale * 0.98;

  return {
    netGainPct: dnet * 100,
    scaleFactor: scale,
    pnlNet,
  };
}

export * from './live-analytics';

