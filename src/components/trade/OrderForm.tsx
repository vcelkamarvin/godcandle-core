import React, { useState } from 'react';
import { computeClampedPrice, computeBustDistance } from '@/lib/hyperliquid';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';

interface OrderFormProps {
  currentPrice: number;
  leverage: number;
  corridorBps?: number;
  availableBalance?: number;
  onTrade?: (
    side: 'LONG' | 'SHORT',
    margin: number,
    leverage: number,
    tp?: number | null,
    sl?: number | null
  ) => void;
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
  const [tpMode, setTpMode] = useState<'price' | 'roi'>('roi');
  const [tpValue, setTpValue] = useState('');
  const [slMode, setSlMode] = useState<'price' | 'roi'>('roi');
  const [slValue, setSlValue] = useState('');

  const numMargin = parseFloat(margin) || 0;
  const notional = numMargin * leverage;
  const { bustDistanceBps, bustDistancePct } = computeBustDistance(leverage);

  // Mark-Clamped BBO Execution Price
  const { execPrice } = computeClampedPrice(currentPrice, currentPrice, corridorBps);

  // Liquidation prices calculated from markPx
  const longBustPrice = currentPrice * (1 - bustDistancePct / 100);
  const shortBustPrice = currentPrice * (1 + bustDistancePct / 100);

  const computeTargetPrice = (side: 'LONG' | 'SHORT', type: 'tp' | 'sl'): number | null => {
    const rawVal = type === 'tp' ? parseFloat(tpValue) : parseFloat(slValue);
    if (isNaN(rawVal) || rawVal === 0) return null;

    const mode = type === 'tp' ? tpMode : slMode;
    if (mode === 'price') return rawVal;

    const val = Math.abs(rawVal);
    const roiFraction = val / 100;
    if (side === 'LONG') {
      return type === 'tp'
        ? currentPrice * (1 + roiFraction / leverage)
        : currentPrice * (1 - roiFraction / leverage);
    } else {
      return type === 'tp'
        ? currentPrice * (1 - roiFraction / leverage)
        : currentPrice * (1 + roiFraction / leverage);
    }
  };

  const handleOrder = (side: 'LONG' | 'SHORT') => {
    const tpPrice = computeTargetPrice(side, 'tp');
    const slPrice = computeTargetPrice(side, 'sl');

    if (side === 'LONG') {
      if (tpPrice != null && tpMode === 'price' && tpPrice <= currentPrice) {
        toast.error('Take Profit must be higher than current price for LONG');
        return;
      }
      if (slPrice != null && slMode === 'price' && slPrice >= currentPrice) {
        toast.error('Stop Loss must be lower than current price for LONG');
        return;
      }
    } else {
      if (tpPrice != null && tpMode === 'price' && tpPrice >= currentPrice) {
        toast.error('Take Profit must be lower than current price for SHORT');
        return;
      }
      if (slPrice != null && slMode === 'price' && slPrice <= currentPrice) {
        toast.error('Stop Loss must be higher than current price for SHORT');
        return;
      }
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      if (onTrade) {
        onTrade(side, numMargin, leverage, tpPrice, slPrice);
      } else {
        toast.success(`${side} order executed`, {
          description: `$${numMargin} @ ${leverage}x ($${notional.toLocaleString()} notional) against House Pool`,
        });
      }
      setTpValue('');
      setSlValue('');
    }, 250);
  };

  return (
    <div className="space-y-2 font-mono text-xs">
      {/* Margin Chip Picker */}
      <div>
        <div className="flex justify-between text-muted-foreground mb-1 text-[10px]">
          <span className="font-semibold uppercase tracking-wider">ISOLATED MARGIN (USDC)</span>
          <span className="tabular">
            AVAILABLE: ${availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="grid grid-cols-6 gap-1">
          {MARGIN_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setMargin(chip)}
              className={`h-7 rounded-sm text-xs font-mono font-medium transition-all ${
                margin === chip
                  ? 'bg-foreground text-background font-bold shadow-xs'
                  : 'border border-border/60 bg-[#F6F6F4] text-muted-foreground hover:text-foreground hover:bg-[#F0F0EE]'
              }`}
            >
              ${chip}
            </button>
          ))}
        </div>
      </div>

      {/* Position Metrics Box */}
      <div className="bg-[#F6F6F4] border border-border/80 rounded-md p-2 space-y-1 text-[10px] font-mono">
        <div className="flex justify-between items-center text-muted-foreground">
          <span>POSITION NOTIONAL</span>
          <span className="text-foreground font-bold tabular">${notional.toLocaleString()} USDC</span>
        </div>

        <div className="flex justify-between items-center text-muted-foreground">
          <span>EXECUTION PRICE (BBO)</span>
          <div className="flex items-center gap-1 font-bold tabular text-foreground">
            <span>${execPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="text-[9px] px-1 py-0.2 rounded-xs bg-[#EFEFFC] text-[#5E5CE6] font-mono">
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

        <div className="border-t border-border/50 pt-1 flex justify-between items-center text-muted-foreground text-[9px]">
          <span>PROTOCOL FEES</span>
          <span className="text-[#06964A] font-semibold">0% Entry · 2.0% Net Win Fee</span>
        </div>
      </div>

      {/* TP & SL Compact Row */}
      <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
        {/* Take Profit */}
        <div className="flex items-center gap-1 rounded-md border border-border/60 bg-secondary/50 px-2 py-1">
          <span className="text-[10px] font-bold text-[#00D964]">TP</span>
          <input
            type="number"
            step="any"
            placeholder={tpMode === 'roi' ? '+% ROI' : 'Price'}
            value={tpValue}
            onChange={(e) => setTpValue(e.target.value)}
            className="w-full bg-transparent font-mono text-[11px] text-foreground focus:outline-none placeholder:text-muted-foreground/60"
          />
          <button
            type="button"
            onClick={() => setTpMode((prev) => (prev === 'roi' ? 'price' : 'roi'))}
            title={tpMode === 'roi' ? 'Switch to target Price' : 'Switch to target ROI %'}
            className="rounded-sm bg-background px-1 py-0.5 text-[9px] font-bold text-muted-foreground hover:text-foreground border border-border/40"
          >
            {tpMode === 'roi' ? '%' : '$'}
          </button>
        </div>

        {/* Stop Loss */}
        <div className="flex items-center gap-1 rounded-md border border-border/60 bg-secondary/50 px-2 py-1">
          <span className="text-[10px] font-bold text-[#FF3B30]">SL</span>
          <input
            type="number"
            step="any"
            placeholder={slMode === 'roi' ? '-% ROI' : 'Price'}
            value={slValue}
            onChange={(e) => setSlValue(e.target.value)}
            className="w-full bg-transparent font-mono text-[11px] text-foreground focus:outline-none placeholder:text-muted-foreground/60"
          />
          <button
            type="button"
            onClick={() => setSlMode((prev) => (prev === 'roi' ? 'price' : 'roi'))}
            title={slMode === 'roi' ? 'Switch to target Price' : 'Switch to target ROI %'}
            className="rounded-sm bg-background px-1 py-0.5 text-[9px] font-bold text-muted-foreground hover:text-foreground border border-border/40"
          >
            {slMode === 'roi' ? '%' : '$'}
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-1.5 pt-0.5">
        <button
          type="button"
          onClick={() => handleOrder('LONG')}
          disabled={isSubmitting || numMargin <= 0}
          className="rounded-md bg-[#00D964] text-white h-10 text-center font-mono text-xs font-bold hover:bg-[#06964A] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-xs"
        >
          <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>LONG {leverage}×</span>
        </button>

        <button
          type="button"
          onClick={() => handleOrder('SHORT')}
          disabled={isSubmitting || numMargin <= 0}
          className="rounded-md bg-[#FF3B30] text-white h-10 text-center font-mono text-xs font-bold hover:bg-[#d62e24] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-xs"
        >
          <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>SHORT {leverage}×</span>
        </button>
      </div>
    </div>
  );
}
