export * from "./types";
export * from "./paper-math";
export * from "./paper";
export * from "./hyperliquid";

import type { TradingMode, TradingEngine } from "./types";
import { paperEngineInstance } from "./paper";
import { hyperliquidEngineInstance } from "./hyperliquid";

export function getEngine(mode: TradingMode): TradingEngine {
  return mode === "perps" ? hyperliquidEngineInstance : paperEngineInstance;
}
