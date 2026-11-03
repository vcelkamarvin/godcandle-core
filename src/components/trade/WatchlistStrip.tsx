import React from 'react';
import { Star, Plus } from 'lucide-react';
import { MarketLogo } from '@/components/godcandle/MarketLogo';
import { fmtUsd } from '@/lib/engine';
import { cn } from '@/lib/utils';
import type { MarketSymbol } from '@/config/markets';

interface WatchlistStripProps {
  favorites: string[];
  activeMarket: string;
  onSelectMarket: (symbol: string) => void;
  onOpenPicker: () => void;
  feeds: Record<string, any>;
}

export function WatchlistStrip({
  favorites,
  activeMarket,
  onSelectMarket,
  onOpenPicker,
  feeds,
}: WatchlistStripProps) {
  // Always display at least BTC, ETH, SOL, HYPE if empty
  const displaySymbols = favorites.length > 0 ? favorites : ['BTC', 'ETH', 'SOL', 'HYPE'];

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1.5 px-2 bg-white border border-border/70 rounded-xl shadow-2xs select-none text-xs font-mono">
      <div className="flex items-center gap-1 text-xs uppercase font-bold text-muted-foreground px-1.5 shrink-0">
        <Star className="size-3.5 text-[#FFD60A] fill-[#FFD60A]" />
        <span>Watchlist</span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {displaySymbols.map((sym) => {
          const raw = sym.replace('-USD', '');
          const feed = feeds[raw];
          const price = feed?.price ?? (raw === 'BTC' ? 68420.5 : raw === 'ETH' ? 2540.2 : 182.4);
          const open24 = feed?.open24 ?? price * 0.985;
          const changePct = open24 > 0 ? ((price - open24) / open24) * 100 : 0;
          const isUp = changePct >= 0;
          const isActive = raw === activeMarket.replace('-USD', '');

          return (
            <button
              key={raw}
              type="button"
              onClick={() => onSelectMarket(raw)}
              className={cn(
                "h-7 px-2.5 rounded-lg flex items-center gap-2 transition-all cursor-pointer border tabular-nums text-xs",
                isActive
                  ? "bg-foreground text-background font-bold border-foreground shadow-2xs"
                  : "bg-secondary/60 hover:bg-secondary text-foreground border-border/60 hover:border-border"
              )}
            >
              <MarketLogo symbol={raw as MarketSymbol} size={15} />
              <span className="font-sans font-bold text-xs">{raw}</span>
              <span className={cn("text-xs font-medium", isActive ? "text-background/90" : "text-muted-foreground")}>
                ${fmtUsd(price, price >= 100 ? 1 : 2)}
              </span>
              <span
                className={cn(
                  "text-xs font-bold",
                  isActive
                    ? (isUp ? "text-[#00D964]" : "text-[#FF453A]")
                    : (isUp ? "text-[#06964A]" : "text-[#FF3B30]")
                )}
              >
                {isUp ? "+" : ""}{changePct.toFixed(1)}%
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={onOpenPicker}
          title="Add or search markets (Cmd+K)"
          className="h-7 px-2.5 rounded-lg bg-secondary/80 hover:bg-secondary border border-border/60 text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-all cursor-pointer text-xs font-medium"
        >
          <Plus className="size-3.5" />
          <span className="hidden sm:inline">Add</span>
        </button>
      </div>
    </div>
  );
}
