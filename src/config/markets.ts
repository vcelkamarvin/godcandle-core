import { createElement, type ReactNode } from "react";
export type MarketSymbol = "BTC" | "ETH" | "SPX" | "SOL" | "HYPE" | "DOGE";
export type MarketStatus = "open" | "closed" | "paused";
export interface Market { symbol: MarketSymbol; name: string; logo: ReactNode; logoUrl?: string; basePrice: number; decimals: number; maxLeverage: number; minStake: number; maxStake: number; feeRate: number; volatility: number; status: MarketStatus }
const paths: Record<MarketSymbol, string> = {
 BTC: "M8 4v16m4-16v16M6 6h7a4 4 0 0 1 0 7H6m0-2h8a4 4 0 0 1 0 7H6",
 ETH: "M12 3 6 12l6 4 6-4-6-9Zm-6 12 6 6 6-6M12 3v13",
 SPX: "M5 19V13h3v6m3 0V9h3v10m3 0V5h3v14",
 SOL: "M5 6h14l-3 3H2l3-3Zm-3 5h14l3 3H5l-3-3Zm3 5h14l-3 3H2l3-3Z",
 HYPE: "M3 12c3-10 5 10 9 0s6 10 9 0",
 DOGE: "M8 5h4a7 7 0 0 1 0 14H8V5Zm-3 7h10",
};
export const marketLogo = (symbol: MarketSymbol) => createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.4, "aria-hidden": true }, createElement("path", { d: paths[symbol] }));
const make = (symbol: MarketSymbol, name: string, basePrice: number, decimals: number, maxLeverage: number, volatility: number): Market => ({symbol, name, basePrice, decimals, maxLeverage, volatility, logo: marketLogo(symbol), minStake: 10, maxStake: 5000, feeRate: 0.0004, status: "open"});
export const MARKETS: Market[] = [make("BTC", "Bitcoin",64300,2,1000,.000028),make("ETH","Ethereum",3450,2,1000,.00004),make("SPX","S&P 500",6120,2,500,.00002),make("SOL","Solana",142,2,100,.0001),make("HYPE","Hyperliquid",18.45,3,100,.00012),make("DOGE","Dogecoin",.143,5,50,.00015)];
export const getMarket = (symbol: MarketSymbol) => MARKETS.find(m => m.symbol === symbol) ?? MARKETS[0];
