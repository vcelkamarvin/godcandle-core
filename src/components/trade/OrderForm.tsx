import React, { useState } from 'react';
import { computeBustDistance } from '@/lib/hyperliquid';
import { ArrowUp, ArrowDown, Shield, Zap, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface OrderFormProps {
  currentPrice: number;
  leverage: number;
  onTrade?: (side: 'LONG' | 'SHORT', margin: number, leverage: number) => void;
}

const MARGIN_CHIPS = ['10', '25', '50', '100', '250', '500'];

export function OrderForm({ currentPrice, leverage, onTrade }: OrderFormProps) {
  const [margin, setMargin] = useState('50');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const numMargin = parseFloat(margin) || 0;
  const notional = numMargin * leverage;
  const { bustDistanceBps, bustDistancePct } = computeBustDistance(leverage);

  // Liquidation prices
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
        <div className="flex justify-between text-subtle mb-1.5">
          <span>ISOLATED MARGIN (USDC)</span>
          <span>AVAILABLE: $1,000.00</span>
        </div>
        <div className="grid grid-cols-6 gap-1.5">
          {MARGIN_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setMargin(chip)}
              className={`py-1.5 border text-center transition-all ${
                margin === chip
                  ? 'border-accent bg-surface-elevated text-accent font-bold'
                  : 'border-border text-subtle hover:text-accent hover:border-border-active'
              }`}
            >
              ${chip}
            </button>
          ))}
        </div>
      </div>

      {/* Position Metrics Box */}
      <div className="bg-background border border-border p-3 space-y-2 text-[11px]">
        <div className="flex justify-between items-center text-subtle">
          <span>POSITION NOTIONAL</span>
          <span className="text-accent font-bold tabular">${notional.toLocaleString()}</span>
        </div>

        <div className="flex justify-between items-center text-subtle">
          <span>EST. BUST DISTANCE</span>
          <span className="text-bear font-semibold tabular">
            -{bustDistancePct.toFixed(3)}% ({bustDistanceBps.toFixed(1)} bps)
          </span>
        </div>

        <div className="flex justify-between items-center text-subtle">
          <span>LONG BUST PRICE</span>
          <span className="text-bear tabular">
            ${longBustPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex justify-between items-center text-subtle">
          <span>SHORT BUST PRICE</span>
          <span className="text-bear tabular">
            ${shortBustPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className="border-t border-border pt-2 flex justify-between items-center text-subtle text-[10px]">
          <span>PROTOCOL FEES</span>
          <span className="text-bull">0% Entry · 2% Net Win Fee</span>
        </div>

        <div className="flex justify-between items-center text-subtle text-[10px]">
          <span>SETTLEMENT MODEL</span>
          <span className="text-accent">Atomic Cash FIFO</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          type="button"
          onClick={() => handleOrder('LONG')}
          disabled={isSubmitting || numMargin <= 0}
          className="bg-bull/10 border border-bull text-bull py-3 text-center font-bold tracking-wider hover:bg-bull hover:text-background transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <ArrowUp className="w-4 h-4" />
          <span>LONG {leverage}×</span>
        </button>

        <button
          type="button"
          onClick={() => handleOrder('SHORT')}
          disabled={isSubmitting || numMargin <= 0}
          className="bg-bear/10 border border-bear text-bear py-3 text-center font-bold tracking-wider hover:bg-bear hover:text-background transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <ArrowDown className="w-4 h-4" />
          <span>SHORT {leverage}×</span>
        </button>
      </div>
    </div>
  );
}
