import React, { useState } from 'react';
import { computeBustDistance } from '@/lib/hyperliquid';
import { ArrowUp, ArrowDown, Shield, Zap, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface OrderFormProps {
  currentPrice: number;
  leverage: number;
  corridorBps?: number;
  availableBalance?: number;
  onTrade?: (side: 'LONG' | 'SHORT', margin: number, leverage: number) => void;
}

const MARGIN_CHIPS = ['10', '25', '50', '100', '250', '500'];

export function OrderForm({
  currentPrice,
  leverage,
  corridorBps = 1.5,
  availableBalance = 1000,
  onTrade,
}: OrderFormProps) {
  const [margin, setMargin] = useState('50');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const numMargin = parseFloat(margin) || 0;
  const notional = numMargin * leverage;
  const { bustDistanceBps, bustDistancePct } = computeBustDistance(leverage);

  // Mark-Clamped BBO Execution Price
  const { execPrice, isClamped } = computeClampedPrice(currentPrice, currentPrice, corridorBps);

  // Liquidation prices calculated from markPx
  const longBustPrice = currentPrice * (1 - bustDistancePct / 100);
  const shortBustPrice = currentPrice * (1 + bustDistancePct / 100);

  const handleOrder = (side: 'LONG' | 'SHORT') => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      if (onTrade) {
        onTrade(side, numMargin, leverage);
      } else {
        toast.success(`${side} order executed`, {
          description: `$${numMargin} @ ${leverage}x ($${notional.toLocaleString()} notional) against House Pool`,
        });
      }
    }, 250);
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Margin Chip Picker */}
      <div>
        <div className="flex justify-between text-muted-foreground mb-1.5 text-[11px]">
          <span>ISOLATED MARGIN (USDC)</span>
          <span>AVAILABLE: ${availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="grid grid-cols-6 gap-1.5">
          {MARGIN_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setMargin(chip)}
              className={`pill h-8 text-xs transition-all ${
                margin === chip
                  ? 'pill-ink font-bold shadow-sm'
                  : 'border border-border bg-[#F6F6F4] text-muted-foreground hover:text-foreground hover:bg-[#F0F0EE]'
              }`}
            >
              ${chip}
            </button>
          ))}
        </div>
      </div>

      {/* Position Metrics Box */}
      <div className="bg-[#F6F6F4] border border-border rounded-xl p-3.5 space-y-2 text-[11px]">
        <div className="flex justify-between items-center text-muted-foreground">
          <span>POSITION NOTIONAL</span>
          <span className="text-foreground font-bold tabular">${notional.toLocaleString()} USDC</span>
        </div>

        <div className="flex justify-between items-center text-muted-foreground">
          <span>EXECUTION PRICE (MARK-CLAMPED BBO)</span>
          <div className="flex items-center gap-1.5 font-bold tabular text-foreground">
            <span>${execPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-[#EFEFFC] text-[#5E5CE6] font-mono">
              ±{corridorBps} bps
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center text-muted-foreground">
          <span>EST. BUST DISTANCE</span>
          <span className="text-[#FF3B30] font-semibold tabular">
            -{bustDistanceBps.toFixed(1)} bps (-{bustDistancePct.toFixed(3)}%)
          </span>
        </div>

        <div className="flex justify-between items-center text-muted-foreground">
          <span>LONG BUST PRICE</span>
          <span className="text-[#FF3B30] tabular">
            ${longBustPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex justify-between items-center text-muted-foreground">
          <span>SHORT BUST PRICE</span>
          <span className="text-[#FF3B30] tabular">
            ${shortBustPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className="border-t border-border pt-2 flex justify-between items-center text-muted-foreground text-[10px]">
          <span>PROTOCOL FEES</span>
          <span className="text-[#06964A] font-semibold">0% Entry · 2.0% Net Win Fee</span>
        </div>

        <div className="flex justify-between items-center text-muted-foreground text-[10px]">
          <span>SETTLEMENT MODEL</span>
          <span className="text-foreground font-medium">Atomic Cash FIFO</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          type="button"
          onClick={() => handleOrder('LONG')}
          disabled={isSubmitting || numMargin <= 0}
          className="rounded-xl bg-[#00D964] text-white py-3.5 text-center font-bold tracking-wider hover:bg-[#06964A] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-sm"
        >
          <ArrowUp className="w-4 h-4" />
          <span>LONG {leverage}×</span>
        </button>

        <button
          type="button"
          onClick={() => handleOrder('SHORT')}
          disabled={isSubmitting || numMargin <= 0}
          className="rounded-xl bg-[#FF3B30] text-white py-3.5 text-center font-bold tracking-wider hover:bg-[#d62e24] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-sm"
        >
          <ArrowDown className="w-4 h-4" />
          <span>SHORT {leverage}×</span>
        </button>
      </div>
    </div>
  );
}
