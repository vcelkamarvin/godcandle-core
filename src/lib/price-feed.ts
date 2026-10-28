import { useSyncExternalStore } from "react";
import { MARKETS, type MarketSymbol, type MarketStatus } from "@/config/markets";
import { createBuffers, type Tick } from "./mock-data";
export type { Tick } from "./mock-data";
export interface FeedSnap { price: number; prev: number; open24: number; lastTick: number; status: MarketStatus }
export interface Simulation { volatility: number; tickSpeed: number }
const initial = Object.fromEntries(MARKETS.map(m=>[m.symbol,{price:m.basePrice,prev:m.basePrice,open24:m.basePrice*.991,lastTick:0,status:m.status}])) as Record<MarketSymbol,FeedSnap>;
let snapshots = initial;
let buffers: Record<MarketSymbol,Tick[]> | undefined;
let simulation: Simulation = {volatility:1,tickSpeed:200};
let started = false;
const listeners = new Set<()=>void>();
const emit = () => listeners.forEach(l=>l());
export function getTicks(symbol: MarketSymbol): Tick[] { return buffers?.[symbol] ?? []; }
export const getSnap = (symbol: MarketSymbol = "BTC") => snapshots[symbol];
export const getSimulation = () => simulation;
export function setSimulation(next: Partial<Simulation>) { simulation = {...simulation,...next}; emit(); }
export function setMarketStatus(symbol: MarketSymbol, status: MarketStatus) { snapshots = {...snapshots,[symbol]:{...snapshots[symbol],status}}; emit(); }
export function startFeed() {
 if (started) return; started=true; buffers=createBuffers(Date.now());
 const step = () => { const now=Date.now(); const next={...snapshots}; for(const m of MARKETS){ const s=snapshots[m.symbol]; const move=s.status === "open" ? (Math.random()-.5)*m.volatility*simulation.volatility*4 : 0; const price=Math.max(m.basePrice*.01,s.price*(1+move)); const tick={t:now,p:price}; const list=buffers?.[m.symbol]; if(list){list.push(tick);while(list[0] && list[0].t<now-24*3600*1000-60000)list.shift();} next[m.symbol]={...s,prev:s.price,price,lastTick:now}; } snapshots=next;emit();setTimeout(step,simulation.tickSpeed); }; step();
}
export function useFeeds() { return useSyncExternalStore(l=>{listeners.add(l);return()=>listeners.delete(l);},()=>snapshots,()=>initial); }
