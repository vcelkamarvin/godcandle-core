import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface LivePriceHeaderProps {
  symbol: string;
  price: number;
  open24h: number;
  corridorBps?: number;
}

export function LivePriceHeader({
  symbol,
  price,
  open24h,
}: LivePriceHeaderProps) {
  // Simulate tiny spread for mid / bbo
  const halfSpread = price * 0.00008;
  const bid = price - halfSpread;
  const ask = price + halfSpread;
  const mid = (bid + ask) / 2;
  const markPx = price * (1 + 0.00005); // smoothed mark
  const high24h = open24h ? Math.max(price, open24h) * 1.012 : price * 1.012;
  const low24h = open24h ? Math.min(price, open24h) * 0.988 : price * 0.988;

  const change24h = open24h ? ((price - open24h) / open24h) * 100 : 0;
  const isPositive = change24h >= 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-white p-3 sm:p-3.5 font-sans text-xs shadow-sm">
      {/* Subtle iridescent top highlight */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#CDC3F0] via-[#FFDAC8] to-[#A0D4CA] opacity-80" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Market & Price Display */}
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-foreground">{symbol}</span>
              <span className="rounded-full border border-border bg-[#F6F6F4] px-2.5 py-0.5 text-xs font-bold text-muted-foreground">
                PERP
              </span>
            </div>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="tabular text-2xl font-bold tracking-tight text-foreground">
                ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span
                className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  isPositive ? 'bg-[#E3F8EC] text-[#06964A]' : 'bg-[#FFECEA] text-[#FF3B30]'
                }`}
              >
                {isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                {isPositive ? '+' : ''}
                {change24h.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Clean Standard Market Stats */}
        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 sm:gap-3">
          <div className="rounded-xl border border-border bg-[#F6F6F4] px-3 py-2">
            <span className="block text-xs font-semibold text-muted-foreground">MARK PRICE</span>
            <span className="tabular text-xs sm:text-sm font-bold text-foreground">
              ${markPx.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="rounded-xl border border-border bg-[#F6F6F4] px-3 py-2">
            <span className="block text-xs font-semibold text-muted-foreground">INDEX PRICE</span>
            <span className="tabular text-xs sm:text-sm font-bold text-foreground">
              ${mid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="rounded-xl border border-border bg-[#F6F6F4] px-3 py-2">
            <span className="block text-xs font-semibold text-muted-foreground">24H HIGH</span>
            <span className="tabular text-xs sm:text-sm font-bold text-foreground">
              ${high24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="rounded-xl border border-border bg-[#F6F6F4] px-3 py-2">
            <span className="block text-xs font-semibold text-muted-foreground">24H LOW</span>
            <span className="tabular text-xs sm:text-sm font-bold text-foreground">
              ${low24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
