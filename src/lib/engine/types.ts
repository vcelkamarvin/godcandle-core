/**
 * Unified Trading Engine Types & Interfaces
 */

export type TradingMode = "perps" | "paper1000x";

export type OrderSide = "long" | "short";

export interface EngineMarket {
  symbol: string;
  name: string;
  index: number;
  maxLeverage: number;
  szDecimals: number;
  corridorBps: number;
  defaultPrice: number;
  onlyIsolated?: boolean | undefined;
}

export interface OrderParams {
  asset: string;
  side: OrderSide;
  margin: number; // in USDC
  leverage: number;
  tp?: number | null | undefined;
  sl?: number | null | undefined;
  reduceOnly?: boolean | undefined;
}

export interface QuoteResult {
  asset: string;
  side: OrderSide;
  margin: number;
  leverage: number;
  notional: number;
  execPrice: number;
  isClamped: boolean;
  estBustDistanceBps: number;
  estBustDistancePct: number;
  longBustPrice: number;
  shortBustPrice: number;
  estimatedFeeUsd: number;
  builderFeeUsd: number;
  minNotional: number;
  error?: string | null | undefined;
}

export interface EnginePosition {
  id: string;
  market: string;
  side: OrderSide;
  stake: number; // margin in USDC
  leverage: number;
  entry: number;
  size?: number | undefined; // size in base coins
  openedAt: number;
  tp?: number | null | undefined;
  sl?: number | null | undefined;
  liqPrice?: number | undefined;
  liquidationPrice?: number | undefined;
}

export interface EngineClosedTrade extends EnginePosition {
  exit: number;
  pnl: number;
  roiPct: number;
  durationMs: number;
  liquidated: boolean;
  closedAt: number;
}

export interface EngineBalance {
  balance: number;
  available: number;
  marginUsed: number;
}

export interface OrderResult {
  success: boolean;
  positionId?: string | undefined;
  orderId?: string | undefined;
  error?: string | undefined;
  message?: string | undefined;
}

export interface CloseResult {
  success: boolean;
  pnl?: number | undefined;
  error?: string | undefined;
}

export interface TradingEngine {
  mode: TradingMode;
  getMarkets(): EngineMarket[];
  getMaxLeverage(asset: string): number;
  getSzDecimals(asset: string): number;
  quote(order: OrderParams, currentPrice: number): QuoteResult;
  placeOrder(order: OrderParams, currentPrice: number): Promise<OrderResult>;
  closePosition(id: string, currentPrice?: number): Promise<CloseResult>;
  getPositions(): Promise<EnginePosition[]> | EnginePosition[];
  getHistory(): Promise<EngineClosedTrade[]> | EngineClosedTrade[];
  getBalance(): Promise<EngineBalance>;
  subscribePrices(asset: string, cb: (price: number) => void): () => void;
  resetBalance?(): Promise<{ success: boolean; error?: string | undefined; remainingCooldownSec?: number | undefined }>;
  updateLeverage?(asset: string, leverage: number): Promise<{ success: boolean; error?: string | undefined }>;
}
