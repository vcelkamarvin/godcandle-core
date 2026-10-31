import { createElement, type ReactNode } from "react";
import { MarketLogo } from "@/components/godcandle/MarketLogo";

export type MarketSymbol = "BTC" | "ETH" | "SPX" | "SOL" | "HYPE" | "DOGE";
export type MarketStatus = "open" | "closed" | "paused";

export interface Market {
  symbol: MarketSymbol;
  name: string;
  logo: ReactNode;
  logoUrl?: string;
  basePrice: number;
  decimals: number;
  maxLeverage: number;
  minStake: number;
  maxStake: number;
  feeRate: number;
  volatility: number;
  status: MarketStatus;
}

export const marketLogo = (symbol: MarketSymbol) =>
  createElement(MarketLogo, { symbol, size: 20 });

const make = (
  symbol: MarketSymbol,
  name: string,
  basePrice: number,
  decimals: number,
  maxLeverage: number,
  volatility: number
): Market => ({
  symbol,
  name,
  basePrice,
  decimals,
  maxLeverage,
  volatility,
  logo: marketLogo(symbol),
  minStake: 10,
  maxStake: 5000,
  feeRate: 0.0004,
  status: "open",
});

export const MARKETS: Market[] = [
  make("BTC", "Bitcoin", 64300, 2, 1000, 0.000028),
  make("ETH", "Ethereum", 3450, 2, 1000, 0.00004),
  make("SPX", "S&P 500", 6120, 2, 500, 0.00002),
  make("SOL", "Solana", 142, 2, 100, 0.0001),
  make("HYPE", "Hyperliquid", 18.45, 3, 100, 0.00012),
  make("DOGE", "Dogecoin", 0.143, 5, 50, 0.00015),
];

export const getMarket = (symbol: MarketSymbol): Market => {
  const market = MARKETS.find((m) => m.symbol === symbol);
  if (!market) throw new Error(`Unknown market: ${symbol}`);
  return market;
};
