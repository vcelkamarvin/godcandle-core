import { getMarket, type MarketSymbol } from "@/config/markets";
export function MarketLogo({symbol}: {symbol: MarketSymbol}) { const m = getMarket(symbol); return <span className="market-logo inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current">{m.logoUrl ? <img src={m.logoUrl} alt="" className="h-4 w-4 rounded-full"/> : m.logo}</span>; }
