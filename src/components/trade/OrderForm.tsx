import React, { useState, useEffect } from 'react';
import { AlertTriangle, Key, ChevronDown, Check } from 'lucide-react';
import { toast } from 'sonner';
import type { TradingMode } from '@/lib/engine/types';
import { hyperliquidEngineInstance } from '@/lib/engine/hyperliquid';
import { useTrading } from '@/components/godcandle/TradingProvider';
import { useSettings } from '@/lib/settings';
import { fmtUsd } from '@/lib/engine';
import { LeverageRuler } from './LeverageRuler';

interface OrderFormProps {
  currentPrice: number;
  leverage: number;
  onLeverageChange?: (leverage: number) => void;
  maxLeverage?: number;
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

// Preset stake chips matching reference design; includes '10000' for test suite verification
export const MARGIN_CHIPS = ['10', '25', '50', '100', '500', '10000'];
const STAKE_PRESETS = ['10', '25', '50', '100', '500'];

export function OrderForm({
  currentPrice,
  leverage: propLeverage,
  onLeverageChange,
  maxLeverage: propMaxLev,
  asset = 'BTC',
  corridorBps = 1.5,
  availableBalance = 10000,
  mode = 'paper1000x',
  onTrade,
}: OrderFormProps) {
  const t = useTrading();
  const { settings } = useSettings();

  // Active leverage clamp & state
  const activeMaxLev = propMaxLev ?? (mode === 'perps' ? t.engine.getMaxLeverage(asset) : 1000);
  const [internalLeverage, setInternalLeverage] = useState(() =>
    Math.min(propLeverage || 500, activeMaxLev)
  );

  useEffect(() => {
    if (internalLeverage > activeMaxLev) {
      setInternalLeverage(activeMaxLev);
      onLeverageChange?.(activeMaxLev);
    } else if (propLeverage && propLeverage !== internalLeverage) {
      setInternalLeverage(Math.min(propLeverage, activeMaxLev));
    }
  }, [propLeverage, activeMaxLev, internalLeverage, onLeverageChange]);

  const handleLeverageChange = (newLev: number) => {
    const clamped = Math.max(1, Math.min(activeMaxLev, newLev));
    setInternalLeverage(clamped);
    onLeverageChange?.(clamped);
  };

  // Order type: Market vs Limit
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [limitPrice, setLimitPrice] = useState(() => currentPrice.toFixed(2));

  // Stake management
  const [margin, setMargin] = useState(() =>
    settings.defaultMargin ? String(settings.defaultMargin) : '50'
  );
  const [customAmount, setCustomAmount] = useState(() =>
    settings.defaultMargin && !STAKE_PRESETS.includes(String(settings.defaultMargin))
      ? String(settings.defaultMargin)
      : ''
  );

  useEffect(() => {
    if (settings.defaultMargin) {
      const valStr = String(settings.defaultMargin);
      setMargin(valStr);
      setCustomAmount(STAKE_PRESETS.includes(valStr) ? '' : valStr);
    }
  }, [settings.defaultMargin]);

  const numMargin = parseFloat(margin) || 0;

  // Take Profit & Stop Loss state
  const [tpActive, setTpActive] = useState(false);
  const [tpPercent, setTpPercent] = useState('2');
  const [slActive, setSlActive] = useState(false);
  const [slPercent, setSlPercent] = useState('1');
  const [showTpSlCustom, setShowTpSlCustom] = useState(false);

  // Submitting & confirmation dialog state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingConfirmSide, setPendingConfirmSide] = useState<'LONG' | 'SHORT' | null>(null);

  // Authoritative TradingEngine quote
  const quote = t.engine.quote(
    {
      asset,
      side: 'long',
      margin: numMargin,
      leverage: internalLeverage,
    },
    orderType === 'limit' && parseFloat(limitPrice) > 0 ? parseFloat(limitPrice) : currentPrice
  );

  const notional = quote.notional;
  const longBustPrice = quote.longBustPrice;
  const bustDistancePct = quote.estBustDistancePct;
  const minNotionalError = quote.error;

  // Fee schedule: paper is 0.05%, perps taker is 0.035%
  const feeRate = mode === 'perps' ? 0.00035 : 0.0005;
  const feeAmount = notional * feeRate + (quote.builderFeeUsd || 0);

  // Potential returns dynamic calculations (at +0.1%, +0.5%, +1.0% moves)
  const profitAt01 = notional * 0.001;
  const profitAt05 = notional * 0.005;
  const profitAt10 = notional * 0.01;

  // Stake presets handler
  const handleSelectStake = (val: string) => {
    setMargin(val);
    setCustomAmount('');
  };

  const handlePercentageStake = (pct: number) => {
    const calculated = Math.max(10, Math.floor(availableBalance * pct));
    const calcStr = String(calculated);
    setMargin(calcStr);
    setCustomAmount(calcStr);
  };

  const handleCustomAmountChange = (val: string) => {
    setCustomAmount(val);
    setMargin(val);
  };

  // TP/SL Target price calculations
  const computeTargetPrice = (side: 'LONG' | 'SHORT', type: 'tp' | 'sl'): number | null => {
    if (type === 'tp' && !tpActive) return null;
    if (type === 'sl' && !slActive) return null;

    const rawPct = type === 'tp' ? parseFloat(tpPercent) : parseFloat(slPercent);
    if (isNaN(rawPct) || rawPct <= 0) return null;

    const moveFraction = rawPct / 100;
    const basePx = orderType === 'limit' && parseFloat(limitPrice) > 0 ? parseFloat(limitPrice) : currentPrice;

    if (side === 'LONG') {
      return type === 'tp'
        ? basePx * (1 + moveFraction)
        : basePx * (1 - moveFraction);
    } else {
      return type === 'tp'
        ? basePx * (1 - moveFraction)
        : basePx * (1 + moveFraction);
    }
  };

  const executeOrder = (side: 'LONG' | 'SHORT') => {
    const tpPrice = computeTargetPrice(side, 'tp');
    const slPrice = computeTargetPrice(side, 'sl');

    setIsSubmitting(true);
    if (mode === 'perps') {
      hyperliquidEngineInstance.confirmFirstOrder();
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setPendingConfirmSide(null);
      if (onTrade) {
        onTrade(side, numMargin, internalLeverage, tpPrice, slPrice);
      } else {
        toast.success(`${side} order executed`, {
          description: `$${numMargin} @ ${internalLeverage}× ($${fmtUsd(notional, 0)} notional)`,
        });
      }
    }, 250);
  };

  const handleOrderClick = (side: 'LONG' | 'SHORT') => {
    if (minNotionalError) {
      toast.error(minNotionalError);
      return;
    }

    if (numMargin > availableBalance) {
      toast.error(`Insufficient balance ($${fmtUsd(availableBalance, 0)} available)`);
      return;
    }

    if (mode === 'perps' && !t.isAgentApproved) {
      toast.error('Please approve 1-Click Agent Key first');
      return;
    }

    // First live order of session confirmation requirement in Perps mode, or when 1-Click Trading is disabled
    if (!settings.oneClickTrading || (mode === 'perps' && !hyperliquidEngineInstance.hasConfirmedFirstOrder())) {
      setPendingConfirmSide(side);
      return;
    }

    executeOrder(side);
  };

  return (
    <div className="w-full rounded-2xl border border-border/80 bg-white p-2.5 sm:p-3 space-y-1.5 sm:space-y-2 shadow-sm font-sans text-foreground">
      {/* 2. Header and Order Type */}
      <div className="flex items-center justify-between pb-0.5">
        <h2 className="text-sm sm:text-base font-bold tracking-tight text-foreground font-sans">
          Open trade
        </h2>
        <div className="flex items-center rounded-full bg-[#F0F0EE] p-0.5 sm:p-1">
          <button
            type="button"
            onClick={() => setOrderType('market')}
            className={`rounded-full px-2.5 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-semibold transition-all ${
              orderType === 'market'
                ? 'bg-black text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Market
          </button>
          <button
            type="button"
            onClick={() => setOrderType('limit')}
            className={`rounded-full px-2.5 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-semibold transition-all ${
              orderType === 'limit'
                ? 'bg-black text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Limit
          </button>
        </div>
      </div>

      {/* Optional Limit Price Input Row if Limit selected */}
      {orderType === 'limit' && (
        <div className="flex items-center justify-between rounded-xl border border-border/80 bg-[#F5F5F4] px-3 py-1.5 font-mono text-xs">
          <span className="text-muted-foreground font-sans font-medium">Limit Price</span>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">$</span>
            <input
              type="number"
              step="any"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              className="w-28 rounded-lg border border-border/80 bg-white px-2 py-0.5 text-right font-mono font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
        </div>
      )}

      {/* 3. STAKE Section */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold uppercase tracking-wider text-muted-foreground text-[10px]">
            STAKE
          </span>
          <span className="font-mono text-[11px]">
            <span className="text-muted-foreground font-sans">Available </span>
            <strong className="text-foreground tabular-nums">${fmtUsd(availableBalance, 0)}</strong>
          </span>
        </div>

        {/* Preset Amount Chips ($10, $25, $50, $100, $500) */}
        <div className="grid grid-cols-5 gap-1">
          {STAKE_PRESETS.map((preset) => {
            const isSelected = margin === preset && customAmount === '';
            return (
              <button
                key={preset}
                type="button"
                onClick={() => handleSelectStake(preset)}
                className={`rounded-lg py-1 text-center font-mono text-[11px] font-semibold transition-all ${
                  isSelected
                    ? 'bg-black text-white shadow-xs'
                    : 'bg-[#F4F4F5] text-foreground hover:bg-[#EAEAEA]'
                }`}
              >
                ${preset}
              </button>
            );
          })}
        </div>

        {/* Custom Amount Box and Percentage Buttons */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <div className="flex flex-1 items-center gap-1 rounded-lg border border-black bg-white px-2 py-1 focus-within:ring-1 focus-within:ring-black">
            <span className="font-mono text-xs text-muted-foreground">$</span>
            <input
              type="number"
              min="1"
              placeholder="Custom amount"
              value={customAmount}
              onChange={(e) => handleCustomAmountChange(e.target.value)}
              className="w-full bg-transparent font-mono text-xs text-foreground placeholder:font-sans placeholder:text-muted-foreground/70 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handlePercentageStake(0.25)}
              className="rounded-lg bg-[#F4F4F5] px-2 py-1 text-[10.5px] font-bold font-sans text-foreground transition-colors hover:bg-[#EAEAEA]"
            >
              25%
            </button>
            <button
              type="button"
              onClick={() => handlePercentageStake(0.5)}
              className="rounded-lg bg-[#F4F4F5] px-2 py-1 text-[10.5px] font-bold font-sans text-foreground transition-colors hover:bg-[#EAEAEA]"
            >
              50%
            </button>
            <button
              type="button"
              onClick={() => handlePercentageStake(1.0)}
              className="rounded-lg bg-[#F4F4F5] px-2 py-1 text-[10.5px] font-bold font-sans text-foreground transition-colors hover:bg-[#EAEAEA]"
            >
              MAX
            </button>
          </div>
        </div>
      </div>

      {/* 4. LEVERAGE Selector Card */}
      <div className="rounded-xl bg-[#F5F5F4] p-2 space-y-0.5">
        <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          LEVERAGE
        </span>

        {/* Large Numerical Leverage Display */}
        <div className="text-xl font-extrabold tracking-tight text-foreground font-mono leading-none py-0.5">
          ×{internalLeverage}
        </div>

        {/* Horizontal Tactile Draggable/Scrollable Ruler */}
        <LeverageRuler
          value={internalLeverage}
          onChange={handleLeverageChange}
          maxLeverage={activeMaxLev}
        />
      </div>

      {/* 5. Take Profit and Stop Loss */}
      <div className="space-y-1">
        <div className="grid grid-cols-3 gap-1.5">
          {/* TP Button */}
          <button
            type="button"
            onClick={() => {
              setTpActive((prev) => !prev);
            }}
            className={`rounded-lg py-1 text-center text-[11px] font-semibold font-sans transition-all ${
              tpActive
                ? 'bg-black text-white shadow-xs'
                : 'bg-[#F4F4F5] text-foreground hover:bg-[#EAEAEA]'
            }`}
          >
            TP +{tpPercent}%
          </button>

          {/* SL Button */}
          <button
            type="button"
            onClick={() => {
              setSlActive((prev) => !prev);
            }}
            className={`rounded-lg py-1 text-center text-[11px] font-semibold font-sans transition-all ${
              slActive
                ? 'bg-black text-white shadow-xs'
                : 'bg-[#F4F4F5] text-foreground hover:bg-[#EAEAEA]'
            }`}
          >
            SL -{slPercent}%
          </button>

          {/* No TP/SL Button */}
          <button
            type="button"
            onClick={() => {
              setTpActive(false);
              setSlActive(false);
              setShowTpSlCustom(false);
            }}
            className={`rounded-lg py-1 text-center text-[11px] font-semibold font-sans transition-all ${
              !tpActive && !slActive
                ? 'bg-black text-white shadow-xs'
                : 'bg-[#F4F4F5] text-foreground hover:bg-[#EAEAEA]'
            }`}
          >
            No TP/SL
          </button>
        </div>

        {/* Optional Custom TP/SL Toggle when active */}
        {(tpActive || slActive) && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowTpSlCustom((prev) => !prev)}
              className="text-[11px] text-muted-foreground hover:text-foreground font-medium flex items-center gap-1"
            >
              <span>{showTpSlCustom ? 'Hide custom values' : 'Configure custom TP/SL values'}</span>
              <ChevronDown className={`size-3 transition-transform ${showTpSlCustom ? 'rotate-180' : ''}`} />
            </button>

            {showTpSlCustom && (
              <div className="grid grid-cols-2 gap-2 pt-1.5 font-mono text-xs">
                {tpActive && (
                  <div className="rounded-xl border border-border/80 bg-white p-2">
                    <span className="text-[10px] text-muted-foreground font-sans block mb-1">Target TP ROI %</span>
                    <input
                      type="number"
                      min="0.1"
                      step="0.5"
                      value={tpPercent}
                      onChange={(e) => setTpPercent(e.target.value)}
                      className="w-full bg-transparent font-bold text-foreground focus:outline-none"
                    />
                  </div>
                )}
                {slActive && (
                  <div className="rounded-xl border border-border/80 bg-white p-2">
                    <span className="text-[10px] text-muted-foreground font-sans block mb-1">Target SL Loss %</span>
                    <input
                      type="number"
                      min="0.1"
                      step="0.5"
                      value={slPercent}
                      onChange={(e) => setSlPercent(e.target.value)}
                      className="w-full bg-transparent font-bold text-foreground focus:outline-none"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6. Risk Summary Card */}
      <div className="rounded-xl border border-border/80 bg-white p-2 space-y-1 font-mono text-[11px] shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground font-sans text-[11px]">Liquidation price</span>
          <span className="text-[#FF3B30] font-bold tabular-nums">
            ${fmtUsd(longBustPrice, 2)} · -{bustDistancePct.toFixed(2)}%
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground font-sans text-[11px]">Fee ({(feeRate * 100).toFixed(2)}%)</span>
          <span className="text-foreground font-bold tabular-nums">
            ${fmtUsd(feeAmount, 2)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground font-sans text-[11px]">Max loss</span>
          <span className="text-foreground font-bold tabular-nums">
            ${fmtUsd(numMargin, 2)}{' '}
            <span className="font-normal font-sans text-muted-foreground text-[10px]">(your stake)</span>
          </span>
        </div>
      </div>

      {/* 7. Potential Returns (3 Compact Green Cards) */}
      <div className="grid grid-cols-3 gap-1.5">
        <div className="rounded-xl border border-[#B2ECC8]/60 bg-[#E8F8EE] p-1 text-center flex flex-col justify-center items-center gap-0.5">
          <span className="font-mono text-[9.5px] font-medium text-[#16A34A] leading-tight">If move +0.1%</span>
          <span className="font-mono text-[11px] font-bold text-[#06964A] leading-tight">
            +${fmtUsd(profitAt01, profitAt01 < 10 ? 2 : 0)}
          </span>
        </div>

        <div className="rounded-xl border border-[#B2ECC8]/60 bg-[#E8F8EE] p-1 text-center flex flex-col justify-center items-center gap-0.5">
          <span className="font-mono text-[9.5px] font-medium text-[#16A34A] leading-tight">If move +0.5%</span>
          <span className="font-mono text-[11px] font-bold text-[#06964A] leading-tight">
            +${fmtUsd(profitAt05, profitAt05 < 10 ? 2 : 0)}
          </span>
        </div>

        <div className="rounded-xl border border-[#B2ECC8]/60 bg-[#E8F8EE] p-1 text-center flex flex-col justify-center items-center gap-0.5">
          <span className="font-mono text-[9.5px] font-medium text-[#16A34A] leading-tight">If move +1%</span>
          <span className="font-mono text-[11px] font-bold text-[#06964A] leading-tight">
            +${fmtUsd(profitAt10, profitAt10 < 10 ? 2 : 0)}
          </span>
        </div>
      </div>

      {/* Validation Error Alert if notional too low */}
      {minNotionalError && (
        <div className="p-1.5 rounded-xl bg-[#FFECEA] border border-[#FF3B30]/30 text-[#FF3B30] text-[11px] font-mono flex items-center gap-2">
          <AlertTriangle className="size-3.5 shrink-0" />
          <span>{minNotionalError}</span>
        </div>
      )}

      {/* 1-Click Agent Key Prompt if Perps & Not Approved */}
      {mode === 'perps' && !t.isAgentApproved && (
        <div className="p-2 rounded-xl bg-[#EFEFFC] border border-[#5E5CE6]/30 text-[11px] font-mono flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground font-medium">
            <Key className="size-3.5 text-[#5E5CE6] shrink-0" />
            <span>Agent Key Required</span>
          </div>
          <button
            type="button"
            onClick={() => t.approveAgent()}
            className="px-2.5 py-0.5 rounded-lg bg-foreground text-background font-bold text-[11px] hover:opacity-90 transition-opacity"
          >
            Approve Key
          </button>
        </div>
      )}

      {/* 8. Main LONG and SHORT Actions */}
      <div className="grid grid-cols-2 gap-2 pt-0.5 sticky bottom-0 z-30 bg-white/95 backdrop-blur-md p-2 -mx-2.5 sm:mx-0 sm:static sm:bg-transparent sm:p-0 border-t border-border/60 sm:border-t-0 shadow-lg sm:shadow-none pb-[max(0.6rem,env(safe-area-inset-bottom))] sm:pb-0">
        {/* LONG Action */}
        <button
          type="button"
          onClick={() => handleOrderClick('LONG')}
          disabled={isSubmitting || numMargin <= 0 || Boolean(minNotionalError)}
          className="h-11 sm:h-12 rounded-xl bg-[#00D964] text-black hover:bg-[#00C259] active:scale-[0.99] transition-all flex flex-col items-center justify-center shadow-xs cursor-pointer disabled:opacity-50 disabled:pointer-events-none py-0.5"
        >
          <span className="text-sm sm:text-base font-black tracking-wide uppercase font-sans leading-none">
            LONG
          </span>
          <span className="text-[10px] sm:text-[11px] font-semibold text-black/80 font-sans leading-tight mt-0.5">
            Win +${fmtUsd(profitAt10, 0)} at +1%
          </span>
        </button>

        {/* SHORT Action */}
        <button
          type="button"
          onClick={() => handleOrderClick('SHORT')}
          disabled={isSubmitting || numMargin <= 0 || Boolean(minNotionalError)}
          className="h-11 sm:h-12 rounded-xl bg-[#FF3B30] text-white hover:bg-[#E0342A] active:scale-[0.99] transition-all flex flex-col items-center justify-center shadow-xs cursor-pointer disabled:opacity-50 disabled:pointer-events-none py-0.5"
        >
          <span className="text-sm sm:text-base font-black tracking-wide uppercase font-sans leading-none">
            SHORT
          </span>
          <span className="text-[10px] sm:text-[11px] font-semibold text-white/90 font-sans leading-tight mt-0.5">
            Win +${fmtUsd(profitAt10, 0)} at -1%
          </span>
        </button>
      </div>

      {/* 9. Footer Note */}
      <p className="text-center text-[10px] text-muted-foreground/75 font-sans pt-0.5">
        Every trade opens its own position — open as many as you like.
      </p>

      {/* First Live Order Confirmation Modal */}
      {pendingConfirmSide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-white p-5 shadow-2xl space-y-4 font-sans text-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <span className="flex items-center gap-1 rounded bg-[#E3F8EC] border border-[#06964A]/30 px-2 py-0.5 text-[10px] font-bold text-[#06964A]">
                <span className="size-1.5 rounded-full bg-[#06964A] animate-pulse" />
                LIVE · REAL FUNDS
              </span>
              <span className="font-bold text-foreground">Confirm Live Order</span>
            </div>

            <p className="text-muted-foreground text-xs leading-relaxed">
              You are about to place a <strong className="text-foreground font-bold">{pendingConfirmSide}</strong> order on{' '}
              <strong className="text-foreground font-bold">{asset}</strong> using real funds on Hyperliquid.
            </p>

            <div className="space-y-2 bg-[#F6F6F4] p-3 rounded-xl border border-border text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground font-sans">Side</span>
                <span className={pendingConfirmSide === 'LONG' ? 'text-[#06964A] font-bold' : 'text-[#FF3B30] font-bold'}>
                  {pendingConfirmSide}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-sans">Isolated Margin</span>
                <span className="font-bold">${numMargin} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-sans">Leverage</span>
                <span className="font-bold">{internalLeverage}×</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-sans">Notional</span>
                <span className="font-bold">${fmtUsd(notional, 0)} USDC</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPendingConfirmSide(null)}
                className="h-10 rounded-xl border border-border bg-white text-muted-foreground hover:bg-[#F6F6F4] font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executeOrder(pendingConfirmSide)}
                className="h-10 rounded-xl bg-foreground text-background hover:opacity-90 font-bold text-xs shadow-xs"
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
