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
    <div className="relative overflow-hidden rounded-2xl border border-border bg-white p-6 font-mono text-xs text-foreground space-y-5 shadow-sm">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#CDC3F0] via-[#FFDAC8] to-[#A0D4CA] opacity-80" />

      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-[#06964A]" />
          <span className="font-bold text-sm tracking-wider text-foreground">0DTE FAST OPTIONS (OUTCOME BARRIERS)</span>
        </div>
        <span className="text-[10px] text-muted-foreground">
          EVALUATED BY MARKPX (0x0806) · NO GREEKS
        </span>
      </div>

      {/* Expiry Selector */}
      <div>
        <div className="flex justify-between text-muted-foreground mb-1.5 text-[11px]">
          <span>TIME BARRIER EXPIRY</span>
          <span>MULTI: {selectedExpiry.multiplier}×</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {EXPIRIES.map((exp) => (
            <button
              key={exp.label}
              type="button"
              onClick={() => setSelectedExpiry(exp)}
              className={`py-2 px-3 rounded-xl border text-center transition-all ${
                selectedExpiry.label === exp.label
                  ? 'border-foreground bg-[#0A0A0A] text-white font-bold shadow-sm'
                  : 'border-border bg-[#F6F6F4] text-muted-foreground hover:text-foreground hover:bg-[#F0F0EE]'
              }`}
            >
              <div className="text-xs">{exp.label}</div>
              <div className={`text-[10px] mt-0.5 ${selectedExpiry.label === exp.label ? 'text-[#00D964]' : 'text-[#06964A]'}`}>
                {exp.multiplier}×
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Barrier Targets */}
      <div>
        <div className="flex justify-between text-muted-foreground mb-1.5 text-[11px]">
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
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? isUp
                      ? 'border-[#06964A] bg-[#E3F8EC] text-[#06964A] font-semibold'
                      : 'border-[#FF3B30] bg-[#FFECEA] text-[#FF3B30] font-semibold'
                    : 'border-border bg-[#F6F6F4] text-muted-foreground hover:border-[#D2D2CE] hover:text-foreground'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>{bar.label}</span>
                  {isUp ? <TrendingUp className="w-3.5 h-3.5 text-[#06964A]" /> : <TrendingDown className="w-3.5 h-3.5 text-[#FF3B30]" />}
                </div>
                <div className="mt-1 text-[11px] tabular text-foreground font-mono">
                  Target: ${barPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stake & Payout Preview */}
      <div className="bg-[#F6F6F4] border border-border rounded-xl p-3.5 space-y-2 text-[11px]">
        <div className="flex justify-between items-center text-muted-foreground">
          <span>STAKE AMOUNT (USDC)</span>
          <div className="flex gap-1.5">
            {['10', '25', '50', '100'].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setStake(val)}
                className={`pill h-6 px-2.5 text-[10px] font-semibold transition-all ${
                  stake === val ? 'pill-ink shadow-sm' : 'border border-border bg-white text-muted-foreground hover:text-foreground'
                }`}
              >
                ${val}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center text-muted-foreground">
          <span>TARGET PRICE</span>
          <span className="text-foreground font-bold tabular">
            ${targetPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex justify-between items-center text-muted-foreground">
          <span>POTENTIAL RETURN</span>
          <span className="text-[#06964A] font-bold tabular text-sm">
            ${potentialPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (+{((selectedExpiry.multiplier - 1) * 100).toFixed(0)}%)
          </span>
        </div>
      </div>

      <Button
        type="button"
        onClick={handlePlaceOption}
        className="w-full rounded-full bg-[#0A0A0A] text-white hover:bg-[#222222] font-mono font-bold tracking-wider py-3.5 h-auto shadow-sm"
      >
        LOCK 0DTE OUTCOME (${numStake} STAKE)
      </Button>
    </div>
  );
}
