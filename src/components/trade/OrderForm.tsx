import React, { useState } from 'react';
import { ArrowUp, ArrowDown, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import type { TradingMode } from '@/lib/engine/types';
import { hyperliquidEngineInstance } from '@/lib/engine/hyperliquid';
import { useTrading } from '@/components/godcandle/TradingProvider';

interface OrderFormProps {
  currentPrice: number;
  leverage: number;
  asset?: string;
  corridorBps?: number;
  availableBalance?: number;
  mode?: TradingMode;
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
  asset = 'BTC',
  corridorBps = 1.5,
  availableBalance = 1000,
  mode = 'paper1000x',
  onTrade,
}: OrderFormProps) {
  const t = useTrading();
  const [margin, setMargin] = useState('50');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tpMode, setTpMode] = useState<'price' | 'roi'>('roi');
  const [tpValue, setTpValue] = useState('');
  const [slMode, setSlMode] = useState<'price' | 'roi'>('roi');
  const [slValue, setSlValue] = useState('');
  const [pendingConfirmSide, setPendingConfirmSide] = useState<'LONG' | 'SHORT' | null>(null);

  const numMargin = parseFloat(margin) || 0;

  // Use active engine quote directly
  const quote = t.engine.quote(
    {
      asset,
      side: 'long',
      margin: numMargin,
      leverage,
    },
    currentPrice
  );

  const notional = quote.notional;
  const execPrice = quote.execPrice;
  const longBustPrice = quote.longBustPrice;
  const shortBustPrice = quote.shortBustPrice;
  const bustDistanceBps = quote.estBustDistanceBps;
  const bustDistancePct = quote.estBustDistancePct;
  const builderFeeUsd = quote.builderFeeUsd;
  const minNotionalError = quote.error;

  const computeTargetPrice = (side: 'LONG' | 'SHORT', type: 'tp' | 'sl'): number | null => {
    const rawVal = type === 'tp' ? parseFloat(tpValue) : parseFloat(slValue);
    if (isNaN(rawVal) || rawVal === 0) return null;

    const currentMode = type === 'tp' ? tpMode : slMode;
    if (currentMode === 'price') return rawVal;

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

  const executeOrder = (side: 'LONG' | 'SHORT') => {
    const tpPrice = computeTargetPrice(side, 'tp');
    const slPrice = computeTargetPrice(side, 'sl');

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setPendingConfirmSide(null);
      if (onTrade) {
        onTrade(side, numMargin, leverage, tpPrice, slPrice);
      } else {
        toast.success(`${side} order executed`, {
          description: `$${numMargin} @ ${leverage}x ($${notional.toLocaleString()} notional)`,
        });
      }
      setTpValue('');
      setSlValue('');
    }, 250);
  };

  const handleOrderClick = (side: 'LONG' | 'SHORT') => {
    if (minNotionalError) {
      toast.error(minNotionalError);
      return;
    }

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

    // First live order of session confirmation requirement in Perps mode
    if (mode === 'perps' && !hyperliquidEngineInstance.hasConfirmedFirstOrder()) {
      setPendingConfirmSide(side);
      return;
    }

    executeOrder(side);
  };

  return (
    <div className="space-y-2 font-mono text-xs">
      {/* Mode Badge & Order Header */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-1.5">
          {mode === 'perps' ? (
            <span className="flex items-center gap-1 rounded bg-[#E3F8EC] border border-[#06964A]/30 px-2 py-0.5 text-[9px] font-bold text-[#06964A]">
              <span className="size-1.5 rounded-full bg-[#06964A] animate-pulse" />
              LIVE · REAL FUNDS
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded bg-[#FFF4E5] border border-[#D97706]/30 px-2 py-0.5 text-[9px] font-bold text-[#D97706]">
              TEST · PAPER
            </span>
          )}
          <span className="text-[10px] text-muted-foreground uppercase font-mono">
            {mode === 'perps' ? 'Hyperliquid L1' : 'Synthetic 1000x'}
          </span>
        </div>
      </div>

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

        {/* Protocol & Builder Fees */}
        <div className="border-t border-border/50 pt-1 flex justify-between items-center text-muted-foreground text-[9px]">
          <span>FEES</span>
          <div className="flex items-center gap-1.5 font-semibold">
            {mode === 'perps' ? (
              <>
                <span className="text-foreground">0.035% Taker</span>
                {builderFeeUsd > 0 && (
                  <span className="text-[#5E5CE6]">
                    +Builder (${builderFeeUsd.toFixed(2)})
                  </span>
                )}
              </>
            ) : (
              <span className="text-[#06964A]">0% Entry · 1.5 bps Clamped</span>
            )}
          </div>
        </div>
      </div>

      {/* Validation Error Display */}
      {minNotionalError && (
        <div className="p-2 rounded bg-[#FFECEA] border border-[#FF3B30]/30 text-[#FF3B30] text-[10px] font-mono flex items-center gap-1.5">
          <AlertTriangle className="size-3.5 shrink-0" />
          <span>{minNotionalError}</span>
        </div>
      )}

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
          onClick={() => handleOrderClick('LONG')}
          disabled={isSubmitting || numMargin <= 0 || !!minNotionalError}
          className="rounded-md bg-[#00D964] text-white h-10 text-center font-mono text-xs font-bold hover:bg-[#06964A] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-xs"
        >
          <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>LONG {leverage}×</span>
        </button>

        <button
          type="button"
          onClick={() => handleOrderClick('SHORT')}
          disabled={isSubmitting || numMargin <= 0 || !!minNotionalError}
          className="rounded-md bg-[#FF3B30] text-white h-10 text-center font-mono text-xs font-bold hover:bg-[#d62e24] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-xs"
        >
          <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>SHORT {leverage}×</span>
        </button>
      </div>

      {/* First Live Order Confirmation Modal */}
      {pendingConfirmSide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-xl border border-border bg-white p-5 shadow-xl space-y-4 font-mono text-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <span className="flex items-center gap-1 rounded bg-[#E3F8EC] border border-[#06964A]/30 px-2 py-0.5 text-[10px] font-bold text-[#06964A]">
                <span className="size-1.5 rounded-full bg-[#06964A]" />
                LIVE · REAL FUNDS
              </span>
              <span className="font-bold text-foreground">Confirm Live Order</span>
            </div>

            <p className="text-muted-foreground text-[11px] leading-relaxed">
              You are about to place a <strong className="text-foreground">{pendingConfirmSide}</strong> order on{' '}
              <strong className="text-foreground">{asset}</strong> using real funds on Hyperliquid.
            </p>

            <div className="space-y-1.5 bg-[#F6F6F4] p-3 rounded-lg border border-border text-[11px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Side</span>
                <span className={pendingConfirmSide === 'LONG' ? 'text-[#06964A] font-bold' : 'text-[#FF3B30] font-bold'}>
                  {pendingConfirmSide}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Isolated Margin</span>
                <span className="font-bold">${numMargin} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Leverage</span>
                <span className="font-bold">{leverage}×</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Notional</span>
                <span className="font-bold">${notional.toLocaleString()} USDC</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPendingConfirmSide(null)}
                className="h-8 rounded-md border border-border bg-white text-muted-foreground hover:bg-[#F6F6F4] font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executeOrder(pendingConfirmSide)}
                className="h-8 rounded-md bg-foreground text-background hover:opacity-90 font-bold text-xs shadow-xs"
              >
                Confirm & Place
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
