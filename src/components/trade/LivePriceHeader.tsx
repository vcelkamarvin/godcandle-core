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
    <div className="bg-surface border border-border p-4 font-mono text-xs">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Market & Price Display */}
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-accent">{symbol}</span>
              <span className="px-1.5 py-0.5 text-[10px] bg-surface-elevated border border-border text-subtle rounded">
                PERP
              </span>
              <span className="px-1.5 py-0.5 text-[10px] bg-surface-elevated border border-border text-accent font-semibold rounded">
                1000× MAX
              </span>
            </div>
            <div className="flex items-baseline gap-2.5 mt-1">
              <span className="text-2xl font-bold tabular text-accent">
                ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span
                className={`text-xs font-semibold flex items-center gap-0.5 ${
                  isPositive ? 'text-bull' : 'text-bear'
                }`}
              >
                {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {isPositive ? '+' : ''}
                {change24h.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Hyperliquid L1 Precompile Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
          <div className="px-3 py-1.5 bg-background border border-border rounded">
            <span className="text-subtle text-[9px] block">BBO MID (0x080e)</span>
            <span className="text-accent font-semibold tabular">
              ${mid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="px-3 py-1.5 bg-background border border-border rounded">
            <span className="text-subtle text-[9px] block">MARK PX (0x0806)</span>
            <span className="text-accent font-semibold tabular">
              ${markPx.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="px-3 py-1.5 bg-background border border-border rounded">
            <span className="text-subtle text-[9px] block">EXECUTION PRICE</span>
            <span className="text-bull font-semibold tabular">
              ${execPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div
            className={`px-3 py-1.5 border rounded flex flex-col justify-center ${
              isClamped
                ? 'bg-bear/10 border-bear text-bear'
                : 'bg-bull/10 border-bull text-bull'
            }`}
          >
            <div className="flex items-center gap-1">
              {isClamped ? (
                <AlertCircle className="w-3 h-3 text-bear" />
              ) : (
                <ShieldCheck className="w-3 h-3 text-bull" />
              )}
              <span className="text-[9px] font-bold">
                {isClamped ? 'CLAMPED' : 'UNCLAMPED'}
              </span>
            </div>
            <span className="text-[9px] opacity-80 tabular">
              ±{corridorBps} bps corridor ({deviationBps.toFixed(2)} bps)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
