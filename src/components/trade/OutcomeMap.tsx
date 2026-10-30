import React, { useState } from 'react';
import { Timer, TrendingUp, TrendingDown, Target, Zap, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface OutcomeMapProps {
  currentPrice: number;
  symbol: string;
}

const EXPIRIES = [
  { label: '5m', minutes: 5, multiplier: 3.8 },
  { label: '15m', minutes: 15, multiplier: 2.9 },
  { label: '30m', minutes: 30, multiplier: 2.2 },
  { label: '60m', minutes: 60, multiplier: 1.85 },
];

const BARRIERS = [
  { label: '+0.15% Flash Up', offsetPct: 0.15, type: 'TOUCH' },
  { label: '+0.30% Surge Up', offsetPct: 0.3, type: 'TOUCH' },
  { label: '-0.15% Flash Down', offsetPct: -0.15, type: 'TOUCH' },
  { label: '-0.30% Surge Down', offsetPct: -0.3, type: 'TOUCH' },
];

export function OutcomeMap({ currentPrice, symbol }: OutcomeMapProps) {
  const [selectedExpiry, setSelectedExpiry] = useState(EXPIRIES[0]);
  const [selectedBarrier, setSelectedBarrier] = useState(BARRIERS[0]);
  const [stake, setStake] = useState('25');

  const numStake = parseFloat(stake) || 0;
  const targetPrice = currentPrice * (1 + selectedBarrier.offsetPct / 100);
  const potentialPayout = numStake * selectedExpiry.multiplier;

  const handlePlaceOption = () => {
    toast.success(`0DTE Fast Option Placed!`, {
      description: `${selectedBarrier.label} (${selectedExpiry.label}) · Potential Payout: $${potentialPayout.toFixed(2)}`,
    });
  };

  return (
    <div className="bg-surface border border-border p-6 font-mono text-xs text-accent space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-bull" />
          <span className="font-bold text-sm tracking-wider">0DTE FAST OPTIONS (OUTCOME BARRIERS)</span>
        </div>
        <span className="text-[10px] text-subtle">
          EVALUATED BY MARKPX (0x0806) · NO GREEKS
        </span>
      </div>

      {/* Expiry Selector */}
      <div>
        <div className="flex justify-between text-subtle mb-1.5">
          <span>TIME BARRIER EXPIRY</span>
          <span>MULTI: {selectedExpiry.multiplier}×</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {EXPIRIES.map((exp) => (
            <button
              key={exp.label}
              type="button"
              onClick={() => setSelectedExpiry(exp)}
              className={`py-2 border text-center transition-all ${
                selectedExpiry.label === exp.label
                  ? 'border-accent bg-surface-elevated text-accent font-bold'
                  : 'border-border text-subtle hover:text-accent hover:border-border-active'
              }`}
            >
              <div className="text-xs">{exp.label}</div>
              <div className="text-[10px] text-bull mt-0.5">{exp.multiplier}×</div>
            </button>
          ))}
        </div>
      </div>

      {/* Barrier Targets */}
      <div>
        <div className="flex justify-between text-subtle mb-1.5">
          <span>OUTCOME BARRIERS</span>
          <span>SPOT: ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {BARRIERS.map((bar) => {
            const barPrice = currentPrice * (1 + bar.offsetPct / 100);
            const isUp = bar.offsetPct > 0;
            const isSelected = selectedBarrier.label === bar.label;

            return (
              <button
                key={bar.label}
                type="button"
                onClick={() => setSelectedBarrier(bar)}
                className={`p-2.5 border text-left transition-all ${
                  isSelected
                    ? isUp
                      ? 'border-bull bg-bull/10 text-bull'
                      : 'border-bear bg-bear/10 text-bear'
                    : 'border-border text-subtle hover:border-border-active'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>{bar.label}</span>
                  {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                </div>
                <div className="mt-1 text-[11px] tabular text-accent font-mono">
                  Target: ${barPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stake & Payout Preview */}
      <div className="bg-background border border-border p-3 space-y-2 text-[11px]">
        <div className="flex justify-between items-center text-subtle">
          <span>STAKE AMOUNT (USDC)</span>
          <div className="flex gap-1.5">
            {['10', '25', '50', '100'].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setStake(val)}
                className={`px-2 py-0.5 border text-[10px] ${
                  stake === val ? 'border-accent text-accent bg-surface-elevated' : 'border-border text-subtle'
                }`}
              >
                ${val}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center text-subtle">
          <span>TARGET PRICE</span>
          <span className="text-accent font-bold tabular">
            ${targetPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex justify-between items-center text-subtle">
          <span>POTENTIAL RETURN</span>
          <span className="text-bull font-bold tabular text-sm">
            ${potentialPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (+{((selectedExpiry.multiplier - 1) * 100).toFixed(0)}%)
          </span>
        </div>
      </div>

      <Button
        type="button"
        onClick={handlePlaceOption}
        className="w-full bg-accent text-background hover:bg-white font-mono font-bold tracking-wider py-3 h-auto"
      >
        LOCK 0DTE OUTCOME (${numStake} STAKE)
      </Button>
    </div>
  );
}
