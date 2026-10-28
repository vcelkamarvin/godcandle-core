import { MARKETS, type MarketSymbol } from "@/config/markets";
import { pnlOf, liquidation, type ClosedTrade, type Position } from "./engine";
export const INITIAL_BALANCE = 4823;
export const DEMO_BALANCE = 10000;
export interface Tick { t: number; p: number }
// 24h of coarse synthetic history (15s steps) plus a fine 60s tail (200ms steps)
// so chart timeframes from 1m up to 1D all have data to draw.
export const createBuffers = (now: number) => Object.fromEntries(MARKETS.map(m => {
  const ticks: Tick[] = [];
  let p = m.basePrice * (1 + (Math.random() - .5) * .02);
  for (let t = now - 24 * 3600 * 1000; t <= now - 60000; t += 15000) {
    p *= 1 + (Math.random() - .5) * m.volatility * 15;
    ticks.push({ t, p });
  }
  p = m.basePrice;
  for (let t = now - 60000; t <= now; t += 200) {
    p *= 1 + (Math.random() - .5) * m.volatility * 4;
    ticks.push({ t, p });
  }
  ticks[ticks.length - 1] = { t: now, p: m.basePrice };
  return [m.symbol, ticks];
})) as Record<MarketSymbol, Tick[]>;
export function seedHistory(): ClosedTrade[] {
 return ([{market:"BTC",side:"long",stake:100,leverage:500,entry:64211.4,exit:64335.8,durationMs:41000}, {market:"ETH",side:"short",stake:50,leverage:1000,entry:3450,exit:3455,durationMs:18000}, {market:"SOL",side:"long",stake:25,leverage:100,entry:140,exit:142,durationMs:32000}] as const).map((s,i)=>{ const p: Position = {...s,id:`seed-${i}`,openedAt:0}; const liquidated = i===1; const exit = liquidated?liquidation(p):s.exit; return {...p,exit,pnl:pnlOf(p,exit),durationMs:s.durationMs,liquidated,closedAt:i+1}; });
}
