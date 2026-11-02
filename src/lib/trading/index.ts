/**
 * Trading math and utility module for Hyperliquid order execution,
 * liquidation mechanics, impact price estimation, and leverage management.
 */

export type OrderSide = 'long' | 'short' | 'buy' | 'sell';

export interface BookLevel {
  px: number;
  sz: number;
}

export interface L2Book {
  bids: BookLevel[];
  asks: BookLevel[];
  time?: number;
}

export interface ImpactPriceResult {
  impactPrice: number;
  bestPrice: number;
  slippageBps: number;
  filledNotional: number;
  unfilledNotional: number;
}

/**
 * Standard Hyperliquid isolated margin liquidation price calculation.
 * Long: Entry * (1 - 1/lev + MMR)
 * Short: Entry * (1 + 1/lev - MMR)
 */
export function calcLiquidationPrice(
  entryPrice: number,
  leverage: number,
  side: OrderSide,
  maintenanceMarginRate: number = 0.005
): number {
  if (entryPrice <= 0 || leverage <= 0) return 0;
  const isLong = side === 'long' || side === 'buy';
  const imr = 1 / leverage;
  const mmr = Math.min(maintenanceMarginRate, imr);

  if (isLong) {
    const raw = entryPrice * (1 - imr + mmr);
    return Math.max(0, raw);
  } else {
    return entryPrice * (1 + imr - mmr);
  }
}

/**
 * Distance to liquidation in percentage terms.
 */
export function calcLiquidationDistancePct(
  currentPrice: number,
  liqPrice: number,
  side: OrderSide
): number {
  if (currentPrice <= 0 || liqPrice <= 0) return 0;
  const isLong = side === 'long' || side === 'buy';
  if (isLong) {
    return Math.max(0, ((currentPrice - liqPrice) / currentPrice) * 100);
  } else {
    return Math.max(0, ((liqPrice - currentPrice) / currentPrice) * 100);
  }
}

/**
 * Distance to liquidation expressed in volatility multiples (e.g. 0.4x 1h ATR away).
 */
export function calcLiquidationDistanceAtr(
  currentPrice: number,
  liqPrice: number,
  atr1h: number
): number {
  if (atr1h <= 0 || currentPrice <= 0 || liqPrice <= 0) return 0;
  const dist = Math.abs(currentPrice - liqPrice);
  return +(dist / atr1h).toFixed(1);
}

/**
 * Break-even price computation considering taker entry fee, exit fee,
 * builder fee, and funding cost.
 */
export function calcBreakEvenPrice(
  entryPrice: number,
  side: OrderSide,
  takerFeeRate: number = 0.00035, // 3.5 bps
  builderFeeRate: number = 0,
  fundingRate: number = 0
): number {
  if (entryPrice <= 0) return 0;
  const isLong = side === 'long' || side === 'buy';
  // Total round-trip frictions
  const totalFriction = 2 * takerFeeRate + 2 * builderFeeRate + Math.abs(fundingRate);

  if (isLong) {
    return entryPrice * (1 + totalFriction);
  } else {
    return entryPrice * (1 - totalFriction);
  }
}

/**
 * Impact price calculation by walking the L2 order book for a given order size in USD (notional).
 */
export function calcImpactPrice(
  book: L2Book | null | undefined,
  side: OrderSide,
  orderNotionalUsd: number,
  fallbackPrice: number
): ImpactPriceResult {
  const isBuy = side === 'long' || side === 'buy';
  const levels = isBuy ? book?.asks : book?.bids;

  if (!levels || levels.length === 0 || orderNotionalUsd <= 0 || fallbackPrice <= 0) {
    return {
      impactPrice: fallbackPrice,
      bestPrice: fallbackPrice,
      slippageBps: 0,
      filledNotional: orderNotionalUsd,
      unfilledNotional: 0,
    };
  }

  const bestPrice = levels[0]?.px ?? fallbackPrice;
  let remainingNotional = orderNotionalUsd;
  let totalCostUsd = 0;
  let totalSizeFilled = 0;

  for (const lvl of levels) {
    if (lvl.sz <= 0 || lvl.px <= 0) continue;
    const levelNotional = lvl.sz * lvl.px;

    if (remainingNotional <= levelNotional) {
      const neededSize = remainingNotional / lvl.px;
      totalCostUsd += remainingNotional;
      totalSizeFilled += neededSize;
      remainingNotional = 0;
      break;
    } else {
      totalCostUsd += levelNotional;
      totalSizeFilled += lvl.sz;
      remainingNotional -= levelNotional;
    }
  }

  const filledNotional = orderNotionalUsd - remainingNotional;
  const avgExecutionPrice = totalSizeFilled > 0 ? totalCostUsd / totalSizeFilled : bestPrice;

  const slippageBps =
    bestPrice > 0 ? (Math.abs(avgExecutionPrice - bestPrice) / bestPrice) * 10000 : 0;

  return {
    impactPrice: avgExecutionPrice,
    bestPrice,
    slippageBps,
    filledNotional,
    unfilledNotional: remainingNotional,
  };
}

/**
 * Strictly clamp leverage between 1 and the asset's max allowed leverage from meta.
 */
export function clampLeverage(leverage: number, maxLeverage: number): number {
  const max = Math.max(1, maxLeverage || 50);
  if (!Number.isFinite(leverage) || leverage < 1) return 1;
  return Math.min(Math.floor(leverage), max);
}

/**
 * Round size to asset's szDecimals from meta.
 */
export function roundSize(size: number, szDecimals: number): number {
  if (!Number.isFinite(size) || size <= 0) return 0;
  const factor = Math.pow(10, Math.max(0, szDecimals));
  return Math.floor(size * factor) / factor;
}

/**
 * Format price according to Hyperliquid convention (max 5 significant figures, or tick size).
 */
export function formatPrice(price: number, szDecimals: number = 2): string {
  if (!Number.isFinite(price) || price === 0) return '0.00';
  if (price >= 10000) return price.toFixed(1);
  if (price >= 1000) return price.toFixed(2);
  if (price >= 10) return price.toFixed(szDecimals > 2 ? 3 : 2);
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(5);
}
