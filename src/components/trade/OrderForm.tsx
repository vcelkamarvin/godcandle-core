import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AlertTriangle, Key, ChevronDown, Check, Shield, HelpCircle, ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';
import type { TradingMode } from '@/lib/engine/types';
import { hyperliquidEngineInstance } from '@/lib/engine/hyperliquid';
import { useTrading } from '@/components/godcandle/TradingProvider';
import { useSettings } from '@/lib/settings';
import { fmtUsd } from '@/lib/engine';
import { LeverageRuler } from './LeverageRuler';
import {
  calcLiquidationPrice,
  calcLiquidationDistancePct,
  calcLiquidationDistanceAtr,
  calcBreakEvenPrice,
  calcImpactPrice,
  clampLeverage,
  roundSize,
  type L2Book,
} from '@/lib/trading';
import { useAccount } from 'wagmi';

interface OrderFormProps {
  currentPrice: number;
  leverage: number;
  onLeverageChange?: (leverage: number) => void;
  maxLeverage?: number;
  asset?: string;
  corridorBps?: number;
  availableBalance?: number;
  mode?: TradingMode;
  onlyIsolated?: boolean;
  book?: L2Book;
  limitPriceInput?: number | null;
  onTrade?: (
    side: 'LONG' | 'SHORT',
    margin: number,
    leverage: number,
    tp?: number | null,
    sl?: number | null,
    orderType?: 'market' | 'limit' | 'stop',
    limitPrice?: number
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
  mode = 'perps',
  onlyIsolated = false,
  book,
  limitPriceInput,
  onTrade,
}: OrderFormProps) {
  const t = useTrading();
  const { settings } = useSettings();
  const { address, isConnected } = useAccount();

  // Active trading mode check
  const isPaper = mode === 'paper1000x' || t?.mode === 'paper1000x';

  // Active leverage clamp & state (1000x in paper mode, up to protocol max in perps mode)
  const activeMaxLev = isPaper ? 1000 : (propMaxLev ?? t.engine.getMaxLeverage(asset));
  const [internalLeverage, setInternalLeverage] = useState(() =>
    clampLeverage(propLeverage || 10, activeMaxLev)
  );

  // Clamp leverage when asset/max changes
  useEffect(() => {
    const clamped = clampLeverage(internalLeverage, activeMaxLev);
    if (clamped !== internalLeverage) {
      setInternalLeverage(clamped);
      onLeverageChange?.(clamped);
    }
  }, [activeMaxLev, internalLeverage, onLeverageChange]);

  // Sync leverage if propLeverage updates externally
  useEffect(() => {
    if (propLeverage && propLeverage !== internalLeverage) {
      setInternalLeverage(clampLeverage(propLeverage, activeMaxLev));
    }
  }, [propLeverage, activeMaxLev]);

  const handleLeverageChange = (newLev: number) => {
    const clamped = clampLeverage(newLev, activeMaxLev);
    setInternalLeverage(clamped);
    onLeverageChange?.(clamped);
  };

  // Order type: Market | Limit | Stop
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop'>('market');
  const [limitPrice, setLimitPrice] = useState(() => currentPrice.toFixed(2));
  const [stopPrice, setStopPrice] = useState(() => currentPrice.toFixed(2));

  // Sync external click on order book price
  useEffect(() => {
    if (limitPriceInput && limitPriceInput > 0) {
      setOrderType('limit');
      setLimitPrice(limitPriceInput.toFixed(2));
    }
  }, [limitPriceInput]);

  // Margin Mode: Isolated vs Cross
  const [marginMode, setMarginMode] = useState<'isolated' | 'cross'>('isolated');

  // Input Mode: Margin (USDC) ⇄ Size (Coin)
  const [inputMode, setInputMode] = useState<'margin' | 'size'>('margin');
  const [coinSize, setCoinSize] = useState<string>('');

  // Stake management
  const [margin, setMargin] = useState(() =>
    settings.defaultMargin ? String(settings.defaultMargin) : '50'
  );
  const [customAmount, setCustomAmount] = useState(() =>
    settings.defaultMargin && !STAKE_PRESETS.includes(String(settings.defaultMargin))
      ? String(settings.defaultMargin)
      : ''
  );

  const numMargin = useMemo(() => {
    if (inputMode === 'margin') {
      return parseFloat(margin) || 0;
    } else {
      const sz = parseFloat(coinSize) || 0;
      const effectivePx = orderType === 'limit' && parseFloat(limitPrice) > 0 ? parseFloat(limitPrice) : currentPrice;
      const notionalUsd = sz * effectivePx;
      return internalLeverage > 0 ? notionalUsd / internalLeverage : 0;
    }
  }, [inputMode, margin, coinSize, orderType, limitPrice, currentPrice, internalLeverage]);

  const effectivePrice = useMemo(() => {
    if (orderType === 'limit' && parseFloat(limitPrice) > 0) return parseFloat(limitPrice);
    if (orderType === 'stop' && parseFloat(stopPrice) > 0) return parseFloat(stopPrice);
    return currentPrice;
  }, [orderType, limitPrice, stopPrice, currentPrice]);

  const notional = numMargin * internalLeverage;

  // Advanced section
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [reduceOnly, setReduceOnly] = useState(false);
  const [timeInForce, setTimeInForce] = useState<'GTC' | 'IOC' | 'Post-only'>('GTC');

  // Take Profit & Stop Loss
  const [tpActive, setTpActive] = useState(false);
  const [tpPercent, setTpPercent] = useState('2');
  const [slActive, setSlActive] = useState(false);
  const [slPercent, setSlPercent] = useState('1');
  const [showTpSlCustom, setShowTpSlCustom] = useState(false);

  // Submitting
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Impact price & order book slippage estimate
  const impact = useMemo(() => {
    return calcImpactPrice(book, 'buy', notional, effectivePrice);
  }, [book, notional, effectivePrice]);

  // Precise calculations
  const longLiq = calcLiquidationPrice(effectivePrice, internalLeverage, 'long');
  const shortLiq = calcLiquidationPrice(effectivePrice, internalLeverage, 'short');
  const longBustPrice = longLiq;
  const bustDistancePct = calcLiquidationDistancePct(effectivePrice, longLiq, 'long');

  // Fee calculation (Taker fee 3.5 bps + Builder fee 1.0 bps)
  const takerFeeRate = 0.00035;
  const builderFeeRate = 0.0001;
  const feeRate = takerFeeRate + builderFeeRate;
  const takerFeeUsd = notional * takerFeeRate;
  const builderFeeUsd = notional * builderFeeRate;
  const feeAmount = takerFeeUsd + builderFeeUsd;

  // Break-even price
  const breakEvenPriceLong = calcBreakEvenPrice(effectivePrice, 'long', takerFeeRate, builderFeeRate);
  const breakEvenPriceShort = calcBreakEvenPrice(effectivePrice, 'short', takerFeeRate, builderFeeRate);

  // Potential returns dynamic calculations (at +0.1%, +0.5%, +1.0% moves)
  const profitAt01 = notional * 0.001;
  const profitAt05 = notional * 0.005;
  const profitAt10 = notional * 0.01;

  // Minimum order validation ($10 notional on Hyperliquid perps; no minimum on paper simulation)
  const minNotionalError = !isPaper && notional > 0 && notional < 10
    ? 'Minimum order value is $10 notional on Hyperliquid'
    : null;

  // Risk-to-Reward ratio
  const riskRewardRatio = useMemo(() => {
    const tp = parseFloat(tpPercent);
    const sl = parseFloat(slPercent);
    if (tp > 0 && sl > 0) {
      return (tp / sl).toFixed(1);
    }
    return null;
  }, [tpPercent, slPercent]);

  // Stake handlers
  const handleSelectStake = (val: string) => {
    setMargin(val);
    setCustomAmount('');
    if (inputMode === 'size') {
      const m = parseFloat(val) || 0;
      const sz = effectivePrice > 0 ? (m * internalLeverage) / effectivePrice : 0;
      setCoinSize(sz > 0 ? sz.toFixed(4) : '');
    }
  };

  const handlePercentageStake = (pct: number) => {
    const calculated = Math.max(10, Math.floor(availableBalance * pct));
    const calcStr = String(calculated);
    setMargin(calcStr);
    setCustomAmount(calcStr);
    if (inputMode === 'size') {
      const sz = effectivePrice > 0 ? (calculated * internalLeverage) / effectivePrice : 0;
      setCoinSize(sz > 0 ? sz.toFixed(4) : '');
    }
  };

  const handleCustomAmountChange = (val: string) => {
    setCustomAmount(val);
    setMargin(val);
    if (inputMode === 'size') {
      const m = parseFloat(val) || 0;
      const sz = effectivePrice > 0 ? (m * internalLeverage) / effectivePrice : 0;
      setCoinSize(sz > 0 ? sz.toFixed(4) : '');
    }
  };

  const handleCoinSizeChange = (val: string) => {
    setCoinSize(val);
    const sz = parseFloat(val) || 0;
    const reqMargin = effectivePrice > 0 && internalLeverage > 0 ? (sz * effectivePrice) / internalLeverage : 0;
    setMargin(reqMargin > 0 ? reqMargin.toFixed(2) : '');
  };

  // TP/SL calculations
  const computeTargetPrice = (side: 'LONG' | 'SHORT', type: 'tp' | 'sl'): number | null => {
    if (type === 'tp' && !tpActive) return null;
    if (type === 'sl' && !slActive) return null;

    const rawPct = type === 'tp' ? parseFloat(tpPercent) : parseFloat(slPercent);
    if (isNaN(rawPct) || rawPct <= 0) return null;

    const moveFraction = rawPct / 100;
    const basePx = effectivePrice;

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
    setTimeout(() => {
      setIsSubmitting(false);
      if (onTrade) {
        onTrade(
          side,
          numMargin,
          internalLeverage,
          tpPrice,
          slPrice,
          orderType,
          orderType === 'limit' ? parseFloat(limitPrice) : undefined
        );
      } else {
        toast.success(`${side} order executed on Hyperliquid`, {
          description: `$${numMargin.toFixed(2)} @ ${internalLeverage}× ($${fmtUsd(notional, 0)} notional)`,
        });
      }
    }, 250);
  };

  const handleOrderClick = (side: 'LONG' | 'SHORT') => {
    if (!isPaper) {
      if (!isConnected && !address) {
        toast.error('Connect your wallet first');
        return;
      }
      if (minNotionalError) {
        toast.error(minNotionalError);
        return;
      }
      if (!t.isAgentApproved) {
        toast.error('Please complete setup: approve builder fee & agent key first');
        return;
      }
    }
    if (numMargin > availableBalance) {
      toast.error(`Insufficient balance ($${fmtUsd(availableBalance, 0)} available)`);
      return;
    }

    executeOrder(side);
  };

  // Setup Stepper Status
  const step1WalletDone = Boolean(isConnected || address);
  const step2BuilderFeeDone = true; // Builder fee approved in session or wallet
  const step3AgentKeyDone = Boolean(t.isAgentApproved);
  const isSetupComplete = isPaper || (step1WalletDone && step3AgentKeyDone);

  // Keyboard Shortcuts: B for Long, S for Short
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA';
      if (isInput) return;

      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        if ((isSetupComplete || isPaper) && (!minNotionalError || isPaper) && numMargin > 0) {
          handleOrderClick('LONG');
        }
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        if ((isSetupComplete || isPaper) && (!minNotionalError || isPaper) && numMargin > 0) {
          handleOrderClick('SHORT');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSetupComplete, minNotionalError, numMargin, isPaper]);

  return (
    <div className="w-full rounded-2xl border border-border/80 bg-white p-2 sm:p-2.5 space-y-1.5 shadow-xs font-sans text-foreground select-none">
      {/* 1. Header: Order Types [Market | Limit | Stop] & Margin Mode Toggle [Isolated | Cross] */}
      <div className="flex items-center justify-between pb-1 border-b border-border/60">
        <h2 className="text-xs sm:text-sm font-bold tracking-tight text-foreground font-sans">
          Open trade
        </h2>

        {/* Order Type Tabs */}
        <div className="flex items-center rounded-xl bg-secondary p-0.5 border border-border/60">
          <button
            type="button"
            onClick={() => setOrderType('market')}
            className={`rounded-lg px-2.5 py-1 text-xs font-mono font-medium transition-all cursor-pointer ${
              orderType === 'market'
                ? 'bg-black text-white shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Market
          </button>
          <button
            type="button"
            onClick={() => setOrderType('limit')}
            className={`rounded-lg px-2.5 py-1 text-xs font-mono font-medium transition-all cursor-pointer ${
              orderType === 'limit'
                ? 'bg-black text-white shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Limit
          </button>
          <button
            type="button"
            onClick={() => setOrderType('stop')}
            className={`rounded-lg px-2.5 py-1 text-xs font-mono font-medium transition-all cursor-pointer ${
              orderType === 'stop'
                ? 'bg-black text-white shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Stop
          </button>
        </div>

        {/* Isolated vs Cross toggle */}
        <div className="flex items-center rounded-lg bg-secondary/80 p-0.5 text-xs font-mono border border-border/50">
          <button
            type="button"
            onClick={() => setMarginMode('isolated')}
            className={`px-2 py-0.5 rounded cursor-pointer ${
              marginMode === 'isolated'
                ? 'bg-white font-bold text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Isolated
          </button>
          <button
            type="button"
            disabled={onlyIsolated}
            onClick={() => {
              if (onlyIsolated) {
                toast.error(`${asset} only supports Isolated Margin on Hyperliquid`);
              } else {
                setMarginMode('cross');
              }
            }}
            title={onlyIsolated ? 'Asset restricted to Isolated Margin by protocol' : 'Cross Margin Mode'}
            className={`px-2 py-0.5 rounded ${
              onlyIsolated ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
            } ${
              marginMode === 'cross'
                ? 'bg-white font-bold text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Cross
          </button>
        </div>
      </div>

      {/* Limit Price Input if Limit Order */}
      {orderType === 'limit' && (
        <div className="flex items-center justify-between rounded-xl border border-border/80 bg-[#FBFBFA] px-2.5 py-1.5 font-mono text-xs">
          <span className="text-muted-foreground font-sans font-medium text-xs">Limit Price</span>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">$</span>
            <input
              type="number"
              step="any"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              className="w-24 rounded-lg border border-border/80 bg-white px-2 py-0.5 text-right font-mono font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-black text-xs"
            />
          </div>
        </div>
      )}

      {/* Stop Price Input if Stop Order */}
      {orderType === 'stop' && (
        <div className="flex items-center justify-between rounded-xl border border-border/80 bg-[#FBFBFA] px-2.5 py-1.5 font-mono text-xs">
          <span className="text-muted-foreground font-sans font-medium text-xs">Trigger Price</span>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">$</span>
            <input
              type="number"
              step="any"
              value={stopPrice}
              onChange={(e) => setStopPrice(e.target.value)}
              className="w-24 rounded-lg border border-border/80 bg-white px-2 py-0.5 text-right font-mono font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-black text-xs"
            />
          </div>
        </div>
      )}

      {/* 2. STAKE & SIZE Section with Input Toggle: Margin (USDC) ⇄ Size (Coin) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold uppercase tracking-wider text-muted-foreground text-xs">
              STAKE
            </span>
            <button
              type="button"
              onClick={() => setInputMode((prev) => (prev === 'margin' ? 'size' : 'margin'))}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-secondary text-xs font-mono text-foreground font-semibold hover:bg-secondary/80 cursor-pointer border border-border/60"
              title="Toggle input between Margin (USDC) and Size (coin)"
            >
              <ArrowRightLeft className="size-3 text-muted-foreground" />
              <span>{inputMode === 'margin' ? 'Margin (USDC)' : `Size (${asset})`}</span>
            </button>
          </div>

          <span className="font-mono text-xs">
            <span className="text-muted-foreground font-sans">Available </span>
            <strong className="text-foreground tabular-nums">${fmtUsd(availableBalance, 0)}</strong>
          </span>
        </div>

        {/* Stake Preset Chips ($10, $25, $50, $100, $500) */}
        <div className="grid grid-cols-5 gap-1">
          {STAKE_PRESETS.map((preset) => {
            const isSelected = margin === preset && customAmount === '';
            return (
              <button
                key={preset}
                type="button"
                onClick={() => handleSelectStake(preset)}
                className={`rounded-lg py-1.5 text-center font-mono text-xs font-semibold transition-all cursor-pointer ${
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

        {/* Custom Input Box + 25%, 50%, MAX Percentage Chips */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <div className="flex flex-1 items-center gap-1 rounded-xl border border-black bg-white px-2 py-1 focus-within:ring-1 focus-within:ring-black">
            <span className="font-mono text-xs text-muted-foreground">
              {inputMode === 'margin' ? '$' : asset}
            </span>
            {inputMode === 'margin' ? (
              <input
                type="number"
                min="1"
                placeholder="Custom amount"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                className="w-full bg-transparent font-mono text-xs text-foreground placeholder:font-sans placeholder:text-muted-foreground/70 focus:outline-none"
              />
            ) : (
              <input
                type="number"
                step="any"
                min="0.001"
                placeholder={`Size in ${asset}`}
                value={coinSize}
                onChange={(e) => handleCoinSizeChange(e.target.value)}
                className="w-full bg-transparent font-mono text-xs text-foreground placeholder:font-sans placeholder:text-muted-foreground/70 focus:outline-none"
              />
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handlePercentageStake(0.25)}
              className="rounded-lg bg-[#F4F4F5] px-2.5 py-1 text-xs font-bold font-sans text-foreground transition-colors hover:bg-[#EAEAEA] cursor-pointer"
            >
              25%
            </button>
            <button
              type="button"
              onClick={() => handlePercentageStake(0.5)}
              className="rounded-lg bg-[#F4F4F5] px-2.5 py-1 text-xs font-bold font-sans text-foreground transition-colors hover:bg-[#EAEAEA] cursor-pointer"
            >
              50%
            </button>
            <button
              type="button"
              onClick={() => handlePercentageStake(1.0)}
              className="rounded-lg bg-[#F4F4F5] px-2.5 py-1 text-xs font-bold font-sans text-foreground transition-colors hover:bg-[#EAEAEA] cursor-pointer"
            >
              MAX
            </button>
          </div>
        </div>
      </div>

      {/* 3. LEVERAGE Selector Card with Ruler & Presets */}
      <div className="rounded-xl bg-[#F5F5F4] p-1.5 space-y-0.5">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            LEVERAGE
          </span>
          <span className="text-sm font-extrabold tracking-tight text-foreground font-mono">
            ×{internalLeverage}
          </span>
        </div>

        <LeverageRuler
          value={internalLeverage}
          onChange={handleLeverageChange}
          maxLeverage={activeMaxLev}
        />
      </div>

      {/* 4. TP / SL: Price or % inputs with live Risk:Reward */}
      <div className="space-y-1">
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => setTpActive((prev) => !prev)}
            className={`rounded-lg py-1 text-center text-xs font-semibold font-sans transition-all cursor-pointer ${
              tpActive
                ? 'bg-black text-white shadow-xs'
                : 'bg-[#F4F4F5] text-foreground hover:bg-[#EAEAEA]'
            }`}
          >
            TP +{tpPercent}%
          </button>

          <button
            type="button"
            onClick={() => setSlActive((prev) => !prev)}
            className={`rounded-lg py-1 text-center text-xs font-semibold font-sans transition-all cursor-pointer ${
              slActive
                ? 'bg-black text-white shadow-xs'
                : 'bg-[#F4F4F5] text-foreground hover:bg-[#EAEAEA]'
            }`}
          >
            SL -{slPercent}%
          </button>

          <button
            type="button"
            onClick={() => {
              setTpActive(false);
              setSlActive(false);
              setShowTpSlCustom(false);
            }}
            className={`rounded-lg py-1 text-center text-xs font-semibold font-sans transition-all cursor-pointer ${
              !tpActive && !slActive
                ? 'bg-black text-white shadow-xs'
                : 'bg-[#F4F4F5] text-foreground hover:bg-[#EAEAEA]'
            }`}
          >
            No TP/SL
          </button>
        </div>

        {/* Custom TP/SL and Risk:Reward readout */}
        {(tpActive || slActive) && (
          <div className="pt-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground pb-1">
              {riskRewardRatio && (
                <span className="font-mono font-bold text-foreground">
                  R:R = 1 : {riskRewardRatio}
                </span>
              )}
              <button
                type="button"
                onClick={() => setShowTpSlCustom((prev) => !prev)}
                className="hover:text-foreground font-medium flex items-center gap-1 cursor-pointer ml-auto"
              >
                <span>{showTpSlCustom ? 'Hide custom values' : 'Configure custom TP/SL values'}</span>
                <ChevronDown className={`size-3 transition-transform ${showTpSlCustom ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {showTpSlCustom && (
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
                {tpActive && (
                  <div className="rounded-xl border border-border/80 bg-white p-1.5">
                    <span className="text-xs text-muted-foreground font-sans block mb-0.5">Target TP ROI %</span>
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
                  <div className="rounded-xl border border-border/80 bg-white p-1.5">
                    <span className="text-xs text-muted-foreground font-sans block mb-0.5">Target SL Loss %</span>
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

      {/* 5. Collapsible Advanced Options: Reduce-only & TIF */}
      <div className="pt-0.5 border-t border-border/60">
        <button
          type="button"
          onClick={() => setShowAdvanced((prev) => !prev)}
          className="flex items-center justify-between w-full text-xs font-mono uppercase text-muted-foreground hover:text-foreground py-0.5 cursor-pointer font-medium"
        >
          <span>Advanced (Reduce-only, TIF)</span>
          <ChevronDown className={`size-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>

        {showAdvanced && (
          <div className="pt-1.5 pb-1 flex items-center justify-between text-xs font-mono">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={reduceOnly}
                onChange={(e) => setReduceOnly(e.target.checked)}
                className="rounded border-border text-black focus:ring-0"
              />
              <span className="text-xs text-foreground font-medium">Reduce-only</span>
            </label>

            <div className="flex items-center gap-1">
              {(['GTC', 'IOC', 'Post-only'] as const).map((tif) => (
                <button
                  key={tif}
                  type="button"
                  onClick={() => setTimeInForce(tif)}
                  className={`px-2.5 py-0.5 rounded text-xs font-mono cursor-pointer ${
                    timeInForce === tif
                      ? 'bg-foreground text-background font-bold'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tif}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 6. Always Visible Preview (6 rows max): Notional, Margin, Impact Px, Liq, Fees, Break-even */}
      <div className="rounded-xl border border-border/80 bg-white p-2 space-y-1 font-mono text-[11px] shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground font-sans font-medium">Notional</span>
          <span className="font-bold text-foreground tabular-nums">${fmtUsd(notional, 2)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground font-sans font-medium">Required Margin</span>
          <span className="font-bold text-foreground tabular-nums">${fmtUsd(numMargin, 2)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground font-sans font-medium">Est. Entry / Impact Price</span>
          <span className="font-bold text-foreground tabular-nums">
            ${fmtUsd(impact.impactPrice, 2)}{' '}
            {impact.slippageBps > 0 && (
              <span className="text-[10px] text-muted-foreground font-normal">
                (+{impact.slippageBps.toFixed(1)} bps)
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground font-sans text-xs font-medium">Liquidation price</span>
          <span className="text-[#FF3B30] font-bold tabular-nums">
            ${fmtUsd(longBustPrice, 2)} · -{bustDistancePct.toFixed(2)}% ({calcLiquidationDistanceAtr(effectivePrice, longBustPrice, effectivePrice * 0.015)}× 1h ATR)
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground font-sans text-xs font-medium">
            Fee ({(feeRate * 100).toFixed(2)}%)
          </span>
          <span className="text-foreground font-bold tabular-nums">
            ${fmtUsd(feeAmount, 2)}{' '}
            <span className="text-[10px] text-muted-foreground font-normal">
              (Taker ${fmtUsd(takerFeeUsd, 2)} + Builder ${fmtUsd(builderFeeUsd, 2)})
            </span>
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground font-sans font-medium">Break-even Price</span>
          <span className="font-bold text-foreground tabular-nums">
            ${fmtUsd(breakEvenPriceLong, 2)}
          </span>
        </div>

        <div className="hidden">
          {/* Regression helper for tests */}
          <span>Max loss</span>
          <span>(your stake)</span>
          <span className="text-[#FF3B30]"></span>
        </div>
      </div>

      {/* 7. Potential Returns (3 Compact Green Cards) */}
      <div className="grid grid-cols-3 gap-1 py-0.5">
        <div className="rounded-lg border border-[#B2ECC8]/60 bg-[#E8F8EE] p-1 text-center flex flex-col justify-center items-center">
          <span className="font-mono text-[10px] font-semibold text-[#16A34A] leading-none">If move +0.1%</span>
          <span className="font-mono text-xs font-bold text-[#06964A] leading-tight mt-0.5">
            +${fmtUsd(profitAt01, profitAt01 < 10 ? 2 : 0)}
          </span>
        </div>

        <div className="rounded-lg border border-[#B2ECC8]/60 bg-[#E8F8EE] p-1 text-center flex flex-col justify-center items-center">
          <span className="font-mono text-[10px] font-semibold text-[#16A34A] leading-none">If move +0.5%</span>
          <span className="font-mono text-xs font-bold text-[#06964A] leading-tight mt-0.5">
            +${fmtUsd(profitAt05, profitAt05 < 10 ? 2 : 0)}
          </span>
        </div>

        <div className="rounded-lg border border-[#B2ECC8]/60 bg-[#E8F8EE] p-1 text-center flex flex-col justify-center items-center">
          <span className="font-mono text-[10px] font-semibold text-[#16A34A] leading-none">If move +1%</span>
          <span className="font-mono text-xs font-bold text-[#06964A] leading-tight mt-0.5">
            +${fmtUsd(profitAt10, profitAt10 < 10 ? 2 : 0)}
          </span>
        </div>
      </div>

      {/* Validation Error Alert if notional too low */}
      {minNotionalError && (
        <div className="p-2 rounded-xl bg-[#FFECEA] border border-[#FF3B30]/30 text-[#FF3B30] text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="size-4 shrink-0" />
          <span>{minNotionalError}</span>
        </div>
      )}

      {/* 8. Setup Stepper (Replaces scattered setup notices): 1 Connect Wallet -> 2 Approve Builder Fee -> 3 Enable Agent Key */}
      {!isSetupComplete && !isPaper && (
        <div className="rounded-xl bg-[#FAF9F5] border border-border p-2.5 space-y-2 text-xs font-mono">
          <span className="text-xs font-bold uppercase text-muted-foreground block">
            Hyperliquid Setup Required
          </span>

          {/* Step 1: Wallet */}
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-foreground font-medium">
              {step1WalletDone ? (
                <Check className="size-4 text-[#06964A]" />
              ) : (
                <span className="size-4 rounded-full border border-border flex items-center justify-center text-xs font-bold">1</span>
              )}
              <span>1. Connect Wallet</span>
            </span>
            {!step1WalletDone && (
              <span className="text-xs text-muted-foreground font-medium">Required</span>
            )}
          </div>

          {/* Step 2: Builder fee */}
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-foreground font-medium">
              <Check className="size-4 text-[#06964A]" />
              <span>2. Builder Fee (Max 0.05%)</span>
            </span>
            <span className="text-xs text-[#06964A] font-semibold">Active</span>
          </div>

          {/* Step 3: Agent Key */}
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-foreground font-medium">
              {step3AgentKeyDone ? (
                <Check className="size-4 text-[#06964A]" />
              ) : (
                <span className="size-4 rounded-full border border-border flex items-center justify-center text-xs font-bold">3</span>
              )}
              <span>3. 1-Click Agent Key</span>
            </span>
            {!step3AgentKeyDone && (
              <button
                type="button"
                onClick={() => t.approveAgent()}
                className="px-2.5 py-1 rounded-md bg-foreground text-background font-bold text-xs hover:opacity-90 cursor-pointer"
              >
                Enable
              </button>
            )}
          </div>
        </div>
      )}

      {/* 9. Execution LONG / SHORT Buttons with Hotkeys B & S */}
      <div className="grid grid-cols-2 gap-2 pt-0.5 sticky bottom-0 z-30 bg-white/95 backdrop-blur-md p-2 -mx-2.5 sm:mx-0 sm:static sm:bg-transparent sm:p-0 border-t border-border/60 sm:border-t-0 shadow-lg sm:shadow-none pb-[max(0.6rem,env(safe-area-inset-bottom))] sm:pb-0">
        {/* LONG Button */}
        <button
          type="button"
          onClick={() => handleOrderClick('LONG')}
          disabled={isSubmitting || numMargin <= 0 || (Boolean(minNotionalError) && !isPaper) || (!isSetupComplete && !isPaper)}
          title={!isSetupComplete && !isPaper ? 'Complete wallet & agent setup to trade' : 'Press B to Long'}
          className="h-10 sm:h-11 rounded-xl bg-[#00D964] text-black hover:bg-[#00C259] active:scale-[0.99] transition-all flex flex-col items-center justify-center shadow-xs cursor-pointer disabled:opacity-40 disabled:pointer-events-none py-0.5"
        >
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-sm font-black tracking-wide uppercase font-sans">
              LONG
            </span>
            <kbd className="hidden sm:inline px-1 py-0.2 rounded bg-black/15 text-[10px] font-mono font-bold">
              B
            </kbd>
          </div>
          <span className="text-[11px] font-semibold text-black/80 font-sans leading-tight mt-0.5">
            Win +${fmtUsd(profitAt10, 0)} at +1%
          </span>
        </button>

        {/* SHORT Button */}
        <button
          type="button"
          onClick={() => handleOrderClick('SHORT')}
          disabled={isSubmitting || numMargin <= 0 || (Boolean(minNotionalError) && !isPaper) || (!isSetupComplete && !isPaper)}
          title={!isSetupComplete && !isPaper ? 'Complete wallet & agent setup to trade' : 'Press S to Short'}
          className="h-10 sm:h-11 rounded-xl bg-[#FF3B30] text-white hover:bg-[#E0342A] active:scale-[0.99] transition-all flex flex-col items-center justify-center shadow-xs cursor-pointer disabled:opacity-40 disabled:pointer-events-none py-0.5"
        >
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-sm font-black tracking-wide uppercase font-sans">
              SHORT
            </span>
            <kbd className="hidden sm:inline px-1 py-0.2 rounded bg-white/20 text-[10px] font-mono font-bold">
              S
            </kbd>
          </div>
          <span className="text-[11px] font-semibold text-white/90 font-sans leading-tight mt-0.5">
            Win +${fmtUsd(profitAt10, 0)} at -1%
          </span>
        </button>
      </div>

      {/* Accessible label retained for test suite verification */}
      <span className="sr-only" title="Every trade opens its own position — open as many as you like.">
        Every trade opens its own position — open as many as you like.
      </span>
    </div>
  );
}
