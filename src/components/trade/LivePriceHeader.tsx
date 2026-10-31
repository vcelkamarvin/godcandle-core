import React from 'react';
import { computeClampedPrice } from '@/lib/hyperliquid';
import { ShieldCheck, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

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
  corridorBps = 1.5,
}: LivePriceHeaderProps) {
  // Simulate tiny spread for mid / bbo
  const halfSpread = price * 0.00008;
  const bid = price - halfSpread;
  const ask = price + halfSpread;
  const mid = (bid + ask) / 2;
  const markPx = price * (1 + 0.00005); // smoothed mark

  const { execPrice, isClamped, deviationBps } = computeClampedPrice(mid, markPx, corridorBps);
  const change24h = ((price - open24h) / open24h) * 100;
  const isPositive = change24h >= 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-white p-5 font-sans text-xs shadow-sm">
      {/* Subtle iridescent top highlight */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#CDC3F0] via-[#FFDAC8] to-[#A0D4CA] opacity-80" />

      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Market & Price Display */}
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-foreground">{symbol}</span>
              <span className="rounded-full border border-border bg-[#F6F6F4] px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                PERP
              </span>
              <span className="rounded-full border border-border bg-gradient-to-r from-[#CDC3F0]/30 to-[#FFDAC8]/30 px-2 py-0.5 text-[10px] font-semibold text-foreground">
                1000× MAX
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-2.5">
              <span className="tabular text-3xl font-bold tracking-tight text-foreground">
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

        {/* Hyperliquid L1 Precompile Indicators */}
        <div className="grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4 sm:gap-3">
          <div className="rounded-xl border border-border bg-[#F6F6F4] px-3 py-2">
            <span className="block text-[9px] font-medium text-muted-foreground">BBO MID (0x080e)</span>
            <span className="tabular font-semibold text-foreground">
              ${mid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="rounded-xl border border-border bg-[#F6F6F4] px-3 py-2">
            <span className="block text-[9px] font-medium text-muted-foreground">MARK PX (0x0806)</span>
            <span className="tabular font-semibold text-foreground">
              ${markPx.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="rounded-xl border border-border bg-[#F6F6F4] px-3 py-2">
            <span className="block text-[9px] font-medium text-muted-foreground">EXECUTION PRICE</span>
            <span className="tabular font-semibold text-[#06964A]">
              ${execPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div
            className={`flex flex-col justify-center rounded-xl border px-3 py-2 ${
              isClamped
                ? 'border-[#FF3B30]/30 bg-[#FFECEA] text-[#FF3B30]'
                : 'border-[#06964A]/30 bg-[#E3F8EC] text-[#06964A]'
            }`}
          >
            <div className="flex items-center gap-1">
              {isClamped ? (
                <AlertCircle className="h-3 w-3 text-[#FF3B30]" />
              ) : (
                <ShieldCheck className="h-3 w-3 text-[#06964A]" />
              )}
              <span className="text-[9px] font-bold">
                {isClamped ? 'CLAMPED' : 'UNCLAMPED'}
              </span>
            </div>
            <span className="tabular text-[9px] opacity-80">
              ±{corridorBps} bps corridor ({deviationBps.toFixed(2)} bps)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
