import React, { useState, useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { useTrading } from '@/components/godcandle/TradingProvider';
import { getMarket, MARKETS, type MarketSymbol } from '@/config/markets';
import { fmtUsd } from '@/lib/engine';
import {
  Zap,
  Shield,
  Layers,
  Cpu,
  Activity,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  Sliders,
  ExternalLink,
  ChevronRight,
  Terminal,
  Database,
  BarChart2,
  Award,
  Box,
} from 'lucide-react';
import { toast } from 'sonner';

export function LandingPage() {
  const t = useTrading();

  // Active trading preview state
  const [selectedAsset, setSelectedAsset] = useState<MarketSymbol>('BTC');
  const [stake, setStake] = useState<number>(50);
  const [leverage, setLeverage] = useState<number>(20); // 1x to 50x, strictly clamped
  const [activeSide, setActiveSide] = useState<'long' | 'short'>('long');

  // Enforce Hyperliquid L1 client mode
  React.useEffect(() => {
    if (t?.mode !== 'perps') {
      t?.setMode('perps');
    }
  }, [t]);

  // Limits for standard Hyperliquid L1 perps
  const maxLeverage = selectedAsset === 'BTC' || selectedAsset === 'ETH' ? 50 : 20;

  const currentMarket = getMarket(selectedAsset);
  const feed = t.feeds[selectedAsset] ?? {
    price: currentMarket.basePrice,
    open24: currentMarket.basePrice,
    status: 'open' as const,
  };

  const currentPrice = feed.price;
  const change24 = ((feed.price / feed.open24) - 1) * 100;

  // Real calculations for standard Hyperliquid data rows
  const positionNotional = stake * leverage;
  const estFee = positionNotional * 0.00035; // standard 0.035% taker fee

  // Liquidation calculation for standard Hyperliquid perps
  const mmr = 0.01; // 1% maintenance margin
  const liqPrice = useMemo(() => {
    if (activeSide === 'long') {
      const price = currentPrice * (1 - (1 / leverage) + mmr);
      return Math.max(0, price);
    } else {
      return currentPrice * (1 + (1 / leverage) - mmr);
    }
  }, [currentPrice, leverage, activeSide]);

  const liqDistancePct = Math.abs((currentPrice - liqPrice) / currentPrice) * 100;

  const handleExecute = (side: 'long' | 'short') => {
    setActiveSide(side);
    if (t?.open) {
      t.open(selectedAsset, side, stake, leverage);
      toast.success(
        `Order Routed: ${side.toUpperCase()} ${selectedAsset}-USD $${positionNotional.toLocaleString()} via Builder Code GODCANDLE`,
        {
          description: `Direct Hyperliquid L1 consensus at $${fmtUsd(currentPrice, currentMarket.decimals)}. Zero added protocol fee.`,
          action: {
            label: 'View Terminal',
            onClick: () => {
              window.location.href = '/trade';
            },
          },
        }
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#080B0F] text-[#E6EDF3] font-mono selection:bg-[#00D964]/30 selection:text-[#00D964]">
      {/* 1. TOP LIVE TICKER TELEMETRY BAR */}
      <div className="border-b border-[#21262D] bg-[#0D1117] px-4 sm:px-6 py-2 text-xs flex flex-wrap items-center justify-between gap-3 text-[#8B949E]">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="size-2 rounded-full bg-[#00D964] animate-pulse" />
            <span className="text-[#00D964] font-semibold text-[11px]">HYPERLIQUID L1</span>
          </div>
          <span className="text-[#30363D]">/</span>
          {MARKETS.slice(0, 4).map((m) => {
            const mFeed = t.feeds[m.symbol] ?? { price: m.basePrice, open24: m.basePrice };
            const mChange = ((mFeed.price / mFeed.open24) - 1) * 100;
            return (
              <button
                key={m.symbol}
                type="button"
                onClick={() => {
                  setSelectedAsset(m.symbol);
                  setLeverage((l) => Math.min(l, m.symbol === 'BTC' || m.symbol === 'ETH' ? 50 : 20));
                }}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-colors text-[11px] shrink-0 cursor-pointer ${
                  selectedAsset === m.symbol
                    ? 'bg-[#21262D] text-white border border-[#30363D]'
                    : 'hover:bg-[#161B22] text-[#8B949E]'
                }`}
              >
                <span className="font-semibold text-white">{m.symbol}</span>
                <span className="tabular-nums">${fmtUsd(mFeed.price, m.decimals)}</span>
                <span className={mChange >= 0 ? 'text-[#00D964]' : 'text-[#FF3B30]'}>
                  {mChange >= 0 ? '+' : ''}
                  {mChange.toFixed(1)}%
                </span>
              </button>
            );
          })}
        </div>

        <div className="hidden lg:flex items-center gap-4 text-[10px] text-[#8B949E]">
          <span>BUILDER_CODE: <span className="text-[#58A6FF] font-semibold">GODCANDLE</span></span>
          <span>LATENCY: <span className="text-[#00D964] font-semibold">18ms RPC</span></span>
          <span>EXECUTION: <span className="text-white font-semibold">DIRECT L1 ORDERBOOK</span></span>
        </div>
      </div>

      {/* 2. HERO SECTION (THE CURRENT LIVE CLIENT) */}
      <section className="relative border-b border-[#21262D] px-4 sm:px-6 lg:px-12 py-10 sm:py-16 overflow-hidden">
        {/* Subtle grid pattern background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.035]"
          style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
          {/* LEFT COLUMN: VALUE PROP */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#30363D] bg-[#161B22] px-3 py-1 text-xs text-[#8B949E]">
              <span className="size-2 rounded-full bg-[#00D964] animate-pulse" />
              <span className="text-white font-semibold">Day Zero Live Product</span>
              <span className="text-[#484F58]">·</span>
              <span className="text-[#58A6FF]">Hyperliquid L1 Client</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.12]">
              Pro Trading Terminal for Hyperliquid.
            </h1>

            <p className="text-sm sm:text-base text-[#8B949E] leading-relaxed max-w-2xl">
              Trade directly on Hyperliquid L1 order books with zero added latency. Support the godcandle ecosystem by executing through our native Builder Code.
            </p>

            {/* Value Proposition Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl border border-[#21262D] bg-[#0D1117]/80 space-y-1">
                <div className="flex items-center gap-2 text-white text-xs font-semibold">
                  <Zap className="size-3.5 text-[#00D964]" />
                  <span>Zero Latency L1 Routing</span>
                </div>
                <p className="text-[11px] text-[#8B949E] leading-normal">
                  Direct WebSocket subscription to Hyperliquid validator state. Zero browser hops, zero proxy lag.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-[#21262D] bg-[#0D1117]/80 space-y-1">
                <div className="flex items-center gap-2 text-white text-xs font-semibold">
                  <Shield className="size-3.5 text-[#58A6FF]" />
                  <span>Native Builder Code</span>
                </div>
                <p className="text-[11px] text-[#8B949E] leading-normal">
                  Trades pass <code className="text-[#58A6FF]">GODCANDLE</code> builder code. Generates protocol cashflow with zero added fee to you.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-[#21262D] bg-[#0D1117]/80 space-y-1">
                <div className="flex items-center gap-2 text-white text-xs font-semibold">
                  <Sliders className="size-3.5 text-[#E3B341]" />
                  <span>Institutional 1x–50x Limits</span>
                </div>
                <p className="text-[11px] text-[#8B949E] leading-normal">
                  Clean execution parameters reflecting real Hyperliquid isolated leverage and exact liquidation boundaries.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-[#21262D] bg-[#0D1117]/80 space-y-1">
                <div className="flex items-center gap-2 text-white text-xs font-semibold">
                  <Terminal className="size-3.5 text-[#A371F7]" />
                  <span>Pure Quant UX</span>
                </div>
                <p className="text-[11px] text-[#8B949E] leading-normal">
                  Dark, monospace, clutter-free terminal designed for serious derivatives execution and risk telemetry.
                </p>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/trade"
                className="inline-flex items-center gap-2 rounded-xl bg-[#00D964] hover:bg-[#00BF57] px-5 py-3 text-xs font-bold text-[#080B0F] transition-all shadow-[0_0_20px_rgba(0,217,100,0.25)] hover:shadow-[0_0_25px_rgba(0,217,100,0.4)] cursor-pointer"
              >
                <span>Launch Pro Terminal</span>
                <ArrowUpRight className="size-4" />
              </Link>

              <a
                href="#roadmap"
                className="inline-flex items-center gap-2 rounded-xl border border-[#30363D] bg-[#161B22] hover:bg-[#21262D] px-5 py-3 text-xs font-semibold text-white transition-all cursor-pointer"
              >
                <span>Explore Masterplan Roadmap</span>
                <ChevronRight className="size-4 text-[#8B949E]" />
              </a>
            </div>
          </div>

          {/* RIGHT COLUMN: LIVE ORDER FORM PREVIEW */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-[#30363D] bg-[#0D1117] p-5 shadow-2xl space-y-4">
              {/* Order Header */}
              <div className="flex items-center justify-between border-b border-[#21262D] pb-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#00D964] animate-pulse" />
                  <span className="font-bold text-white tracking-wider">LIVE ORDER FORM</span>
                  <span className="rounded bg-[#21262D] px-1.5 py-0.5 text-[9px] text-[#58A6FF] font-semibold">
                    1x–50x
                  </span>
                </div>
                <div className="text-[10px] text-[#8B949E]">
                  HL L1 ROUTED
                </div>
              </div>

              {/* Asset Selector Tabs */}
              <div className="grid grid-cols-4 gap-1 p-1 bg-[#161B22] rounded-xl border border-[#21262D] text-xs">
                {(['BTC', 'ETH', 'SOL', 'HYPE'] as MarketSymbol[]).map((sym) => {
                  const isSelected = selectedAsset === sym;
                  const symMax = sym === 'BTC' || sym === 'ETH' ? 50 : 20;
                  return (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => {
                        setSelectedAsset(sym);
                        setLeverage((prev) => Math.min(prev, symMax));
                      }}
                      className={`py-1.5 px-2 rounded-lg font-bold transition-all text-center cursor-pointer ${
                        isSelected
                          ? 'bg-[#21262D] text-[#00D964] shadow-xs border border-[#30363D]'
                          : 'text-[#8B949E] hover:text-white'
                      }`}
                    >
                      <div>{sym}</div>
                      <div className="text-[9px] font-normal text-[#8B949E]">{symMax}x</div>
                    </button>
                  );
                })}
              </div>

              {/* Live Price Readout */}
              <div className="flex items-baseline justify-between p-3 rounded-xl bg-[#161B22]/70 border border-[#21262D]">
                <div>
                  <div className="text-[10px] text-[#8B949E] uppercase tracking-wider">
                    {selectedAsset}-USD Mark Price
                  </div>
                  <div className="text-xl font-bold text-white tabular-nums mt-0.5">
                    ${fmtUsd(currentPrice, currentMarket.decimals)}
                  </div>
                </div>
                <div
                  className={`text-xs font-semibold px-2 py-0.5 rounded tabular-nums ${
                    change24 >= 0 ? 'bg-[#00D964]/10 text-[#00D964]' : 'bg-[#FF3B30]/10 text-[#FF3B30]'
                  }`}
                >
                  {change24 >= 0 ? '+' : ''}
                  {change24.toFixed(2)}%
                </div>
              </div>

              {/* Margin Preset Chips & Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-[#8B949E]">
                  <span>Margin (USDC)</span>
                  <span className="text-white font-semibold">${stake} USDC</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[25, 50, 100, 250, 500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setStake(amt)}
                      className={`py-1 text-[11px] rounded-lg border font-semibold transition-all cursor-pointer ${
                        stake === amt
                          ? 'border-[#00D964] bg-[#00D964]/10 text-[#00D964]'
                          : 'border-[#21262D] bg-[#161B22] text-[#8B949E] hover:text-white hover:border-[#30363D]'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* LEVERAGE SLIDER: 1x to 50x (STRICTLY HYPERLIQUID LIMITS) */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#8B949E]">Leverage (Hyperliquid L1 Limit)</span>
                  <span className="text-[#00D964] font-bold tabular-nums">
                    {leverage}x <span className="text-[#8B949E] font-normal">/ {maxLeverage}x max</span>
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={maxLeverage}
                  step={1}
                  value={leverage}
                  onChange={(e) => setLeverage(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#21262D] rounded-lg appearance-none cursor-pointer accent-[#00D964]"
                />
                <div className="flex justify-between text-[9px] text-[#8B949E] font-mono">
                  <span>1x (Spot equivalent)</span>
                  <span>10x</span>
                  <span>25x</span>
                  <span>{maxLeverage}x (Max L1)</span>
                </div>
              </div>

              {/* STANDARD REQUIRED DATA ROWS */}
              <div className="space-y-2 rounded-xl bg-[#161B22] p-3 border border-[#21262D] text-xs">
                <div className="flex items-center justify-between text-[#8B949E]">
                  <span>Position Notional</span>
                  <span className="font-semibold text-white tabular-nums">
                    ${positionNotional.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
                  </span>
                </div>

                <div className="flex items-center justify-between text-[#8B949E]">
                  <span className="flex items-center gap-1">
                    <span>Liquidation Price</span>
                    <span className="text-[10px] text-[#E3B341]">(-{liqDistancePct.toFixed(2)}%)</span>
                  </span>
                  <span className="font-semibold text-[#FF3B30] tabular-nums">
                    ${fmtUsd(liqPrice, currentMarket.decimals)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[#8B949E]">
                  <span>Est. Fee</span>
                  <span className="font-semibold text-white tabular-nums">
                    ${estFee.toFixed(3)} USDC <span className="text-[10px] text-[#8B949E]">(0.035%)</span>
                  </span>
                </div>
              </div>

              {/* EXECUTION BUTTONS: LONG / SHORT */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleExecute('long')}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#00D964] hover:bg-[#00BF57] text-[#080B0F] py-3 text-xs font-bold transition-all shadow-[0_0_15px_rgba(0,217,100,0.2)] hover:shadow-[0_0_20px_rgba(0,217,100,0.35)] cursor-pointer"
                >
                  <TrendingUp className="size-4" />
                  <span>LONG / BUY</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExecute('short')}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#FF3B30] hover:bg-[#E0342A] text-white py-3 text-xs font-bold transition-all shadow-[0_0_15px_rgba(255,59,48,0.2)] hover:shadow-[0_0_20px_rgba(255,59,48,0.35)] cursor-pointer"
                >
                  <TrendingDown className="size-4" />
                  <span>SHORT / SELL</span>
                </button>
              </div>

              <div className="text-center pt-1">
                <p className="text-[10px] text-[#8B949E]">
                  Order execution tagged with Builder Code: <span className="text-[#58A6FF] font-semibold">GODCANDLE</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. DETAILED ROADMAP SECTION (THE "BUILD IN PUBLIC" VISION) */}
      <section id="roadmap" className="px-4 sm:px-6 lg:px-12 py-16 sm:py-24 border-b border-[#21262D] relative">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Section Header */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#30363D] bg-[#161B22] px-3 py-1 text-xs text-[#8B949E]">
              <Activity className="size-3 text-[#58A6FF]" />
              <span>BUILD IN PUBLIC</span>
              <span className="text-[#484F58]">·</span>
              <span className="text-white font-semibold">TRANSPARENT RELEASES</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white uppercase">
              The godcandle Masterplan
            </h2>
            <p className="text-sm text-[#8B949E] max-w-2xl leading-relaxed">
              From our live high-performance Hyperliquid L1 client to our sovereign 1000x synthetic House Pool, weekly automated Candle Cup tournaments, and custom physical trading hardware.
            </p>
          </div>

          {/* Masterplan 4-Phase Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PHASE 0: LIVE NOW */}
            <div className="rounded-2xl border-2 border-[#00D964]/40 bg-[#0D1117] p-6 space-y-4 relative overflow-hidden group hover:border-[#00D964] transition-all shadow-[0_0_30px_rgba(0,217,100,0.08)]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#00D964] tracking-wider">
                  [PHASE_00 // STATUS: LIVE_NOW]
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-[#00D964]/10 border border-[#00D964]/30 px-2.5 py-0.5 text-[10px] font-bold text-[#00D964]">
                  <span className="size-1.5 rounded-full bg-[#00D964] animate-pulse" />
                  PRODUCTION
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-[#00D964] transition-colors">
                  Native Hyperliquid Client
                </h3>
                <p className="text-xs text-[#8B949E] mt-2 leading-relaxed">
                  Direct order book routing, UI/UX optimized for power users, generating protocol cashflow via Builder Codes.
                </p>
              </div>

              <div className="space-y-2 border-t border-[#21262D] pt-4 text-xs">
                <div className="flex items-start gap-2 text-[#E6EDF3]">
                  <CheckCircle2 className="size-4 text-[#00D964] shrink-0 mt-0.5" />
                  <span>Direct order book routing straight to Hyperliquid L1 validator consensus.</span>
                </div>
                <div className="flex items-start gap-2 text-[#E6EDF3]">
                  <CheckCircle2 className="size-4 text-[#00D964] shrink-0 mt-0.5" />
                  <span>UI/UX optimized for power users: fast hotkeys, responsive depth chart, and discrete dock.</span>
                </div>
                <div className="flex items-start gap-2 text-[#E6EDF3]">
                  <CheckCircle2 className="size-4 text-[#00D964] shrink-0 mt-0.5" />
                  <span>Sustainable protocol cashflow generated transparently via builder code fee rebates.</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#161B22] border border-[#21262D] text-[11px] text-[#8B949E] flex items-center justify-between">
                <span>Current Leverage Limit: <strong className="text-white">1x–50x Perps</strong></span>
                <Link to="/trade" className="text-[#00D964] font-semibold hover:underline flex items-center gap-1">
                  <span>Enter Terminal</span>
                  <ArrowUpRight className="size-3" />
                </Link>
              </div>
            </div>

            {/* PHASE 1: IN DEVELOPMENT (The Synthetic Engine) */}
            <div className="rounded-2xl border border-[#E3B341]/40 bg-[#0D1117] p-6 space-y-4 relative overflow-hidden group hover:border-[#E3B341] transition-all">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#E3B341] tracking-wider">
                  [PHASE_01 // THE SYNTHETIC ENGINE]
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-[#E3B341]/10 border border-[#E3B341]/30 px-2.5 py-0.5 text-[10px] font-bold text-[#E3B341]">
                  <span className="size-1.5 rounded-full bg-[#E3B341] animate-ping" />
                  IN DEVELOPMENT
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-[#E3B341] transition-colors">
                  {"1000x Synthetic Perps & The House Pool"}
                </h3>
                <p className="text-xs text-[#8B949E] mt-2 leading-relaxed">
                  Sovereign high-leverage synthetic derivative engine with automated FIFO solvency guarantees on HyperEVM.
                </p>
              </div>

              <div className="space-y-2.5 border-t border-[#21262D] pt-4 text-xs">
                <div className="p-2.5 rounded-lg bg-[#161B22] border border-[#21262D] space-y-1">
                  <div className="text-white font-semibold flex items-center gap-1.5">
                    <Database className="size-3.5 text-[#E3B341]" />
                    <span>Initial $10k-$25k Bootstrap Pool</span>
                  </div>
                  <p className="text-[11px] text-[#8B949E] leading-normal">
                    Initial $10k-$25k Bootstrap Pool providing instant house liquidity for 1000x synthetic perps.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-[#161B22] border border-[#21262D] space-y-1">
                  <div className="text-white font-semibold flex items-center gap-1.5">
                    <Layers className="size-3.5 text-[#E3B341]" />
                    <span>Hyperliquid L1 Mid Execution</span>
                  </div>
                  <p className="text-[11px] text-[#8B949E] leading-normal">
                    Direct L1 market telemetry feeds to ensure authentic pricing and prevent oracle manipulation.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-[#161B22] border border-[#21262D] space-y-1">
                  <div className="text-white font-semibold flex items-center gap-1.5">
                    <Clock className="size-3.5 text-[#E3B341]" />
                    <span>Pure FIFO Settlement</span>
                  </div>
                  <p className="text-[11px] text-[#8B949E] leading-normal">
                    Margin returned instantly, extreme net profits handled by an on-chain queue.
                  </p>
                </div>
              </div>
            </div>

            {/* PHASE 2: UPCOMING */}
            <div className="rounded-2xl border border-[#58A6FF]/40 bg-[#0D1117] p-6 space-y-4 relative overflow-hidden group hover:border-[#58A6FF] transition-all">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#58A6FF] tracking-wider">
                  [PHASE_02 // TOURNAMENTS]
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-[#58A6FF]/10 border border-[#58A6FF]/30 px-2.5 py-0.5 text-[10px] font-bold text-[#58A6FF]">
                  UPCOMING
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-[#58A6FF] transition-colors">
                  The Candle Cup
                </h3>
                <p className="text-xs text-[#8B949E] mt-2 leading-relaxed">
                  Automated weekly high-ROI arena rewarding top traders with direct native USDC distributions funded by House Pool yield.
                </p>
              </div>

              <div className="space-y-2.5 border-t border-[#21262D] pt-4 text-xs">
                <div className="p-2.5 rounded-lg bg-[#161B22] border border-[#21262D] space-y-1">
                  <div className="text-white font-semibold flex items-center gap-1.5">
                    <Award className="size-3.5 text-[#58A6FF]" />
                    <span>Weekly automated ROI leaderboards</span>
                  </div>
                  <p className="text-[11px] text-[#8B949E] leading-normal">
                    Weekly automated ROI leaderboards with continuous scoring across every trading session.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-[#161B22] border border-[#21262D] space-y-1">
                  <div className="text-white font-semibold flex items-center gap-1.5">
                    <Zap className="size-3.5 text-[#58A6FF]" />
                    <span>Every real trade automatically qualifies</span>
                  </div>
                  <p className="text-[11px] text-[#8B949E] leading-normal">
                    Every real trade automatically qualifies. Zero signup barriers or opt-in forms.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-[#161B22] border border-[#21262D] space-y-1">
                  <div className="text-white font-semibold flex items-center gap-1.5">
                    <Shield className="size-3.5 text-[#58A6FF]" />
                    <span>Native USDC Prize Pools</span>
                  </div>
                  <p className="text-[11px] text-[#8B949E] leading-normal">
                    Prize pools paid out entirely in native USDC from House Pool revenues.
                  </p>
                </div>
              </div>
            </div>

            {/* PHASE 3: FUTURE EXPANSION */}
            <div className="rounded-2xl border border-[#A371F7]/40 bg-[#0D1117] p-6 space-y-4 relative overflow-hidden group hover:border-[#A371F7] transition-all">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#A371F7] tracking-wider">
                  [PHASE_03 // HARDWARE & OPTIONS]
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-[#A371F7]/10 border border-[#A371F7]/30 px-2.5 py-0.5 text-[10px] font-bold text-[#A371F7]">
                  FUTURE EXPANSION
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-[#A371F7] transition-colors">
                  {"0DTE Options & Godcandle Hardware"}
                </h3>
                <p className="text-xs text-[#8B949E] mt-2 leading-relaxed">
                  Ultra-short dated outcome options paired with custom physical CNC milled trading hardware for elite high-frequency operators.
                </p>
              </div>

              <div className="space-y-2.5 border-t border-[#21262D] pt-4 text-xs">
                <div className="p-2.5 rounded-lg bg-[#161B22] border border-[#21262D] space-y-1">
                  <div className="text-white font-semibold flex items-center gap-1.5">
                    <Clock className="size-3.5 text-[#A371F7]" />
                    <span>Outcome-map time barriers (5m - 60m)</span>
                  </div>
                  <p className="text-[11px] text-[#8B949E] leading-normal">
                    Outcome-map time barriers (5m - 60m) with defined risk and instant automated settlement upon expiry.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-[#161B22] border border-[#21262D] space-y-1">
                  <div className="text-white font-semibold flex items-center gap-1.5">
                    <Cpu className="size-3.5 text-[#A371F7]" />
                    <span>Physical milled-aluminum Godcandle Terminal</span>
                  </div>
                  <p className="text-[11px] text-[#8B949E] leading-normal">
                    Delivery of the physical milled-aluminum Godcandle Terminal with mechanical switches and direct WebSocket RPC execution for VIP traders.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-[#161B22] border border-[#21262D] space-y-1">
                  <div className="text-white font-semibold flex items-center gap-1.5">
                    <Box className="size-3.5 text-[#A371F7]" />
                    <span>Direct WebSocket RPC execution</span>
                  </div>
                  <p className="text-[11px] text-[#8B949E] leading-normal">
                    Hardware RPC microcontroller for VIP traders bypassing browsers and executing directly with Hyperliquid validators.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. TECHNICAL BOTTOM CALL TO ACTION */}
      <section className="px-4 sm:px-6 lg:px-12 py-12 bg-[#0D1117] border-b border-[#21262D]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-2xl border border-[#21262D] bg-[#161B22]">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-lg font-bold text-white">Ready to trade directly on Hyperliquid L1?</h3>
            <p className="text-xs text-[#8B949E]">
              Connect your Web3 wallet and execute 1x–50x perpetuals with native Builder Code routing.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/trade"
              className="inline-flex items-center gap-2 rounded-xl bg-[#00D964] hover:bg-[#00BF57] px-5 py-2.5 text-xs font-bold text-[#080B0F] transition-all cursor-pointer"
            >
              <span>Launch Terminal</span>
              <ArrowUpRight className="size-4" />
            </Link>
            <a
              href="https://github.com/vcelkamarvin/godcandle-core"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-[#30363D] bg-[#21262D] hover:bg-[#30363D] px-4 py-2.5 text-xs text-white transition-all cursor-pointer"
            >
              <span>GitHub</span>
              <ExternalLink className="size-3.5 text-[#8B949E]" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
