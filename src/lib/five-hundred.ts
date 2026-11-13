import type { MarketSymbol } from "@/config/markets";
export type { MarketSymbol };

export interface MarketConfig {
  symbol: MarketSymbol;
  name: string;
  spot: number;
  maxLeverage: number;
  is24_7: boolean;
  step: number;
  defaultTargetLong: number;
  defaultTargetShort: number;
  formatPrice: (val: number) => string;
}

import { SHARED_BTC_PRICE } from "./mock-data";

// Configurable constants file: BTC 1000x, ETH 500x, SPX 250x, SOL 500x, HYPE 500x, DOGE 500x
export const MARKETS: Record<MarketSymbol, MarketConfig> = {
  BTC: {
    symbol: "BTC",
    name: "Bitcoin",
    spot: SHARED_BTC_PRICE,
    maxLeverage: 1000, // Round 2: 1000x leverage for BTC
    is24_7: true,
    step: 10,
    defaultTargetLong: Math.round(SHARED_BTC_PRICE * 1.005), // +0.50%
    defaultTargetShort: Math.round(SHARED_BTC_PRICE * 0.995), // -0.50%
    formatPrice: (val: number) => `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  },
  ETH: {
    symbol: "ETH",
    name: "Ethereum",
    spot: 2800,
    maxLeverage: 500,
    is24_7: true,
    step: 1,
    defaultTargetLong: 2814, // +0.50%
    defaultTargetShort: 2786, // -0.50%
    formatPrice: (val: number) => `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  },
  SPX: {
    symbol: "SPX",
    name: "S&P 500",
    spot: 6120,
    maxLeverage: 250, // Capped at 250x for SPX
    is24_7: false,
    step: 0.5,
    defaultTargetLong: 6150.6, // +0.50%
    defaultTargetShort: 6089.4, // -0.50%
    formatPrice: (val: number) =>
      val.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
  },
  SOL: {
    symbol: "SOL",
    name: "Solana",
    spot: 178.5,
    maxLeverage: 500,
    is24_7: true,
    step: 0.1,
    defaultTargetLong: 179.4,
    defaultTargetShort: 177.6,
    formatPrice: (val: number) => `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  },
  HYPE: {
    symbol: "HYPE",
    name: "Hyperliquid",
    spot: 24.8,
    maxLeverage: 500,
    is24_7: true,
    step: 0.05,
    defaultTargetLong: 24.95,
    defaultTargetShort: 24.65,
    formatPrice: (val: number) => `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  },
  DOGE: {
    symbol: "DOGE",
    name: "Dogecoin",
    spot: 0.22,
    maxLeverage: 500,
    is24_7: true,
    step: 0.001,
    defaultTargetLong: 0.221,
    defaultTargetShort: 0.219,
    formatPrice: (val: number) => `$${val.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`,
  },
  SUI: {
    symbol: "SUI",
    name: "Sui",
    spot: 2.15,
    maxLeverage: 500,
    is24_7: true,
    step: 0.01,
    defaultTargetLong: 2.16,
    defaultTargetShort: 2.14,
    formatPrice: (val: number) => `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  },
  AVAX: {
    symbol: "AVAX",
    name: "Avalanche",
    spot: 28.6,
    maxLeverage: 500,
    is24_7: true,
    step: 0.1,
    defaultTargetLong: 28.74,
    defaultTargetShort: 28.46,
    formatPrice: (val: number) => `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  },
  BNB: {
    symbol: "BNB",
    name: "BNB",
    spot: 620.5,
    maxLeverage: 500,
    is24_7: true,
    step: 0.5,
    defaultTargetLong: 623.6,
    defaultTargetShort: 617.4,
    formatPrice: (val: number) => `$${val.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`,
  },
  LINK: {
    symbol: "LINK",
    name: "Chainlink",
    spot: 14.8,
    maxLeverage: 500,
    is24_7: true,
    step: 0.05,
    defaultTargetLong: 14.87,
    defaultTargetShort: 14.73,
    formatPrice: (val: number) => `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  },
  ARB: {
    symbol: "ARB",
    name: "Arbitrum",
    spot: 0.62,
    maxLeverage: 500,
    is24_7: true,
    step: 0.005,
    defaultTargetLong: 0.623,
    defaultTargetShort: 0.617,
    formatPrice: (val: number) => `$${val.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`,
  },
  OP: {
    symbol: "OP",
    name: "Optimism",
    spot: 1.75,
    maxLeverage: 500,
    is24_7: true,
    step: 0.01,
    defaultTargetLong: 1.758,
    defaultTargetShort: 1.742,
    formatPrice: (val: number) => `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  },
  TIA: {
    symbol: "TIA",
    name: "Celestia",
    spot: 5.4,
    maxLeverage: 500,
    is24_7: true,
    step: 0.02,
    defaultTargetLong: 5.427,
    defaultTargetShort: 5.373,
    formatPrice: (val: number) => `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  },
  APT: {
    symbol: "APT",
    name: "Aptos",
    spot: 9.8,
    maxLeverage: 500,
    is24_7: true,
    step: 0.05,
    defaultTargetLong: 9.849,
    defaultTargetShort: 9.751,
    formatPrice: (val: number) => `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  },
};

export const LEVERAGE_CHIPS = [50, 100, 250, 500, 1000] as const;
export type LeverageChip = (typeof LEVERAGE_CHIPS)[number];

export const SIMULATED_SPREAD_FEE_PCT = 0.04; // 0.04% simulated fee/spread

export interface PositionRecord {
  id: string;
  symbol: MarketSymbol;
  side: "long" | "short";
  stake: number;
  leverage: number;
  entryPrice: number;
  markPrice: number;
  liqPrice: number;
  targetPrice?: number;
  openTime: number; // millisecond timestamp
  status: "open" | "liquidated" | "closed";
}

export interface TradeHistoryRecord {
  id: string;
  symbol: MarketSymbol;
  side: "long" | "short";
  stake: number;
  leverage: number;
  entryPrice: number;
  exitPrice: number;
  liqPrice: number;
  pnl: number;
  pnlPct: number;
  durationSeconds: number;
  closedAt: number; // millisecond timestamp
  status: "closed" | "liquidated";
}

// P&L and percent formatters: "+" and "−" signs with tabular monospaced numbers
export function formatPnl(val: number): string {
  const rounded = Math.round(val);
  const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "";
  return `${sign}$${Math.abs(rounded).toLocaleString("en-US")}`;
}

export function formatPct(val: number, decimals: number = 2): string {
  const sign = val > 0 ? "+" : val < 0 ? "−" : "";
  return `${sign}${Math.abs(val).toFixed(decimals)}%`;
}

export function formatUsd(val: number): string {
  return `$${Math.round(val).toLocaleString("en-US")}`;
}

export function calculateNotional(stake: number, leverage: number): number {
  return stake * leverage;
}

export function calculateLiqDistancePct(leverage: number): number {
  if (leverage <= 0) return 100;
  return 100 / leverage;
}

export function calculatePnl(
  stake: number,
  leverage: number,
  side: "long" | "short",
  movePct: number,
): number {
  const liqDistance = calculateLiqDistancePct(leverage);
  const effectiveMove = side === "long" ? movePct : -movePct;
  if (effectiveMove <= -liqDistance) {
    return -stake;
  }
  return stake * leverage * (effectiveMove / 100);
}

export function calculateLiqPrice(spot: number, leverage: number, side: "long" | "short"): number {
  const liqDistance = calculateLiqDistancePct(leverage);
  if (side === "long") {
    return spot * (1 - liqDistance / 100);
  }
  return spot * (1 + liqDistance / 100);
}
