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
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-[#00D964]/20 selection:text-[#06964A]">
      {/* 1. TOP LIVE TICKER TELEMETRY BAR */}
      <div className="border-b border-border bg-secondary/50 px-4 sm:px-6 py-2 text-xs flex flex-wrap items-center justify-between gap-3 text-muted-foreground font-mono">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="size-2 rounded-full bg-[#00D964] animate-pulse" />
            <span className="text-[#06964A] font-semibold text-[11px]">HYPERLIQUID L1</span>
          </div>
          <span className="text-border">/</span>
          {MARKETS.slice(0, 4).map((m) => {
            const mFeed = t.feeds[m.symbol] ?? { price: m.basePrice, open24: m.basePrice };
            const mChange = ((mFeed.price / mFeed.open24) - 1) * 100;
            const isSelected = selectedAsset === m.symbol;
            return (
              <button
                key={m.symbol}
                type="button"
                onClick={() => {
                  setSelectedAsset(m.symbol);
                  setLeverage((l) => Math.min(l, m.symbol === 'BTC' || m.symbol === 'ETH' ? 50 : 20));
                }}
                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full transition-colors text-[11px] shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-foreground text-background font-semibold shadow-xs'
                    : 'bg-white hover:bg-secondary text-muted-foreground border border-border/80'
                }`}
              >
                <span className={isSelected ? 'text-background font-bold' : 'text-foreground font-semibold'}>{m.symbol}</span>
                <span className="tabular-nums">${fmtUsd(mFeed.price, m.decimals)}</span>
                <span className={mChange >= 0 ? 'text-[#06964A] font-medium' : 'text-[#FF3B30] font-medium'}>
                  {mChange >= 0 ? '+' : ''}
                  {mChange.toFixed(1)}%
                </span>
              </button>
            );
          })}
        </div>

        <div className="hidden lg:flex items-center gap-4 text-[10px] text-muted-foreground">
          <span>BUILDER_CODE: <span className="text-[#2563EB] font-semibold">GODCANDLE</span></span>
          <span>LATENCY: <span className="text-[#06964A] font-semibold">18ms RPC</span></span>
          <span>EXECUTION: <span className="text-foreground font-semibold">DIRECT L1 ORDERBOOK</span></span>
        </div>
      </div>

      {/* 2. HERO SECTION (THE CURRENT LIVE CLIENT) */}
      <section className="relative border-b border-border px-4 sm:px-6 lg:px-12 py-10 sm:py-16 overflow-hidden">
        {/* Subtle holographic rainbow atmospheric aura */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[400px] rainbow-aura -z-10 opacity-70" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
          {/* LEFT COLUMN: VALUE PROP */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1 text-xs text-muted-foreground shadow-2xs font-mono">
              <span className="size-2 rounded-full bg-[#00D964] animate-pulse" />
              <span className="text-foreground font-semibold">Day Zero Live Product</span>
              <span className="text-border">·</span>
              <span className="text-[#2563EB]">Hyperliquid L1 Client</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-[1.15]">
              Pro Trading Terminal for Hyperliquid.
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
              Trade directly on Hyperliquid L1 order books with zero added latency. Support the godcandle ecosystem by executing through our native Builder Code.
            </p>

            {/* Value Proposition Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-2xl border border-border bg-white shadow-2xs space-y-1">
                <div className="flex items-center gap-2 text-foreground text-xs font-semibold">
                  <Zap className="size-4 text-[#06964A]" />
                  <span>Zero Latency L1 Routing</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-normal">
                  Direct WebSocket subscription to Hyperliquid validator state. Zero browser hops, zero proxy lag.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-border bg-white shadow-2xs space-y-1">
                <div className="flex items-center gap-2 text-foreground text-xs font-semibold">
                  <Shield className="size-4 text-[#2563EB]" />
                  <span>Native Builder Code</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-normal">
                  Trades pass <code className="text-[#2563EB] font-semibold font-mono">GODCANDLE</code> builder code. Generates protocol cashflow with zero added fee to you.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-border bg-white shadow-2xs space-y-1">
                <div className="flex items-center gap-2 text-foreground text-xs font-semibold">
                  <Sliders className="size-4 text-[#D97706]" />
                  <span>Institutional 1x–50x Limits</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-normal">
                  Clean execution parameters reflecting real Hyperliquid isolated leverage and exact liquidation boundaries.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-border bg-white shadow-2xs space-y-1">
                <div className="flex items-center gap-2 text-foreground text-xs font-semibold">
                  <Terminal className="size-4 text-[#7C3AED]" />
                  <span>Pure Quant UX</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-normal">
                  Crisp, clean, clutter-free terminal designed for serious derivatives execution and risk telemetry.
                </p>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/trade"
                className="inline-flex items-center gap-2 rounded-full bg-foreground text-background hover:opacity-90 px-6 py-3 text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <span>Launch Pro Terminal</span>
                <ArrowUpRight className="size-4" />
              </Link>

              <a
                href="#roadmap"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-white hover:bg-secondary px-5 py-3 text-xs font-semibold text-foreground transition-all cursor-pointer shadow-2xs"
              >
                <span>Explore Masterplan Roadmap</span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </a>
            </div>
          </div>

          {/* RIGHT COLUMN: LIVE ORDER FORM PREVIEW */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-border bg-white p-5 shadow-xl space-y-4 font-mono">
              {/* Order Header */}
              <div className="flex items-center justify-between border-b border-border pb-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#00D964] animate-pulse" />
                  <span className="font-bold text-foreground tracking-wider">LIVE ORDER FORM</span>
                  <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] text-[#2563EB] font-semibold border border-border/80">
                    1x–50x
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground">
                  HL L1 ROUTED
                </div>
              </div>

              {/* Asset Selector Tabs */}
              <div className="grid grid-cols-4 gap-1 p-1 bg-secondary/60 rounded-xl border border-border text-xs">
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
                          ? 'bg-white text-foreground shadow-xs border border-border'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <div>{sym}</div>
                      <div className="text-[9px] font-normal text-muted-foreground">{symMax}x</div>
                    </button>
                  );
                })}
              </div>

              {/* Live Price Readout */}
              <div className="flex items-baseline justify-between p-3.5 rounded-xl bg-secondary/40 border border-border">
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                    {selectedAsset}-USD Mark Price
                  </div>
                  <div className="text-xl font-bold text-foreground tabular-nums mt-0.5">
                    ${fmtUsd(currentPrice, currentMarket.decimals)}
                  </div>
                </div>
                <div
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full tabular-nums border ${
                    change24 >= 0 ? 'bg-[#E3F8EC] text-[#06964A] border-[#06964A]/30' : 'bg-[#FFECEA] text-[#FF3B30] border-[#FF3B30]/30'
                  }`}
                >
                  {change24 >= 0 ? '+' : ''}
                  {change24.toFixed(2)}%
                </div>
              </div>

              {/* Margin Preset Chips & Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground font-sans">
                  <span>Margin (USDC)</span>
                  <span className="text-foreground font-semibold font-mono">${stake} USDC</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[25, 50, 100, 250, 500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setStake(amt)}
                      className={`py-1 text-[11px] rounded-lg border font-semibold transition-all cursor-pointer ${
                        stake === amt
                          ? 'border-[#00D964] bg-[#E3F8EC] text-[#06964A]'
                          : 'border-border bg-white text-muted-foreground hover:text-foreground hover:bg-secondary'
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
                  <span className="text-muted-foreground font-sans">Leverage (Hyperliquid L1 Limit)</span>
                  <span className="text-[#06964A] font-bold tabular-nums">
                    {leverage}x <span className="text-muted-foreground font-normal">/ {maxLeverage}x max</span>
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={maxLeverage}
                  step={1}
                  value={leverage}
                  onChange={(e) => setLeverage(Number(e.target.value))}
                  className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-foreground"
                />
                <div className="flex justify-between text-[9px] text-muted-foreground font-mono">
                  <span>1x (Spot equivalent)</span>
                  <span>10x</span>
                  <span>25x</span>
                  <span>{maxLeverage}x (Max L1)</span>
                </div>
              </div>

              {/* STANDARD REQUIRED DATA ROWS */}
              <div className="space-y-2 rounded-xl bg-secondary/40 p-3 border border-border text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="font-sans">Position Notional</span>
                  <span className="font-semibold text-foreground tabular-nums">
                    ${positionNotional.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
                  </span>
                </div>

                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="flex items-center gap-1 font-sans">
                    <span>Liquidation Price</span>
                    <span className="text-[10px] text-[#D97706]">(-{liqDistancePct.toFixed(2)}%)</span>
                  </span>
                  <span className="font-semibold text-[#FF3B30] tabular-nums">
                    ${fmtUsd(liqPrice, currentMarket.decimals)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="font-sans">Est. Fee</span>
                  <span className="font-semibold text-foreground tabular-nums">
                    ${estFee.toFixed(3)} USDC <span className="text-[10px] text-muted-foreground">(0.035%)</span>
                  </span>
                </div>
              </div>

              {/* EXECUTION BUTTONS: LONG / SHORT */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleExecute('long')}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#00D964] hover:bg-[#00BF57] text-black py-3 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-[0.99]"
                >
                  <TrendingUp className="size-4" />
                  <span>LONG / BUY</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExecute('short')}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#FF3B30] hover:bg-[#E0342A] text-white py-3 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-[0.99]"
                >
                  <TrendingDown className="size-4" />
                  <span>SHORT / SELL</span>
                </button>
              </div>

              <div className="text-center pt-1 font-sans">
                <p className="text-[10px] text-muted-foreground">
                  Order execution tagged with Builder Code: <span className="text-[#2563EB] font-semibold font-mono">GODCANDLE</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. DETAILED ROADMAP SECTION (THE "BUILD IN PUBLIC" VISION) */}
      <section id="roadmap" className="px-4 sm:px-6 lg:px-12 py-16 sm:py-24 border-b border-border relative bg-secondary/20">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Section Header */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1 text-xs text-muted-foreground shadow-2xs font-mono">
              <Activity className="size-3 text-[#2563EB]" />
              <span>BUILD IN PUBLIC</span>
              <span className="text-border">·</span>
              <span className="text-foreground font-semibold">TRANSPARENT RELEASES</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground uppercase">
              The godcandle Masterplan
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              From our live high-performance Hyperliquid L1 client to our sovereign 1000x synthetic House Pool, weekly automated Candle Cup tournaments, and custom physical trading hardware.
            </p>
          </div>

          {/* Masterplan 4-Phase Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono">
            {/* PHASE 0: LIVE NOW */}
            <div className="rounded-2xl border-2 border-[#00D964]/60 bg-white p-6 space-y-4 relative overflow-hidden group shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#06964A] tracking-wider">
                  [PHASE_00 // STATUS: LIVE_NOW]
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-[#E3F8EC] border border-[#06964A]/30 px-2.5 py-0.5 text-[10px] font-bold text-[#06964A]">
                  <span className="size-1.5 rounded-full bg-[#06964A] animate-pulse" />
                  PRODUCTION
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-foreground group-hover:text-[#06964A] transition-colors font-sans">
                  Native Hyperliquid Client
                </h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed font-sans">
                  Direct order book routing, UI/UX optimized for power users, generating protocol cashflow via Builder Codes.
                </p>
              </div>

              <div className="space-y-2 border-t border-border pt-4 text-xs font-sans">
                <div className="flex items-start gap-2 text-foreground">
                  <CheckCircle2 className="size-4 text-[#06964A] shrink-0 mt-0.5" />
                  <span>Direct order book routing straight to Hyperliquid L1 validator consensus.</span>
                </div>
                <div className="flex items-start gap-2 text-foreground">
                  <CheckCircle2 className="size-4 text-[#06964A] shrink-0 mt-0.5" />
                  <span>UI/UX optimized for power users: fast hotkeys, responsive depth chart, and discrete dock.</span>
                </div>
                <div className="flex items-start gap-2 text-foreground">
                  <CheckCircle2 className="size-4 text-[#06964A] shrink-0 mt-0.5" />
                  <span>Sustainable protocol cashflow generated transparently via builder code fee rebates.</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-secondary/50 border border-border text-[11px] text-muted-foreground flex items-center justify-between">
                <span>Current Leverage Limit: <strong className="text-foreground">1x–50x Perps</strong></span>
                <Link to="/trade" className="text-[#06964A] font-semibold hover:underline flex items-center gap-1">
                  <span>Enter Terminal</span>
                  <ArrowUpRight className="size-3" />
                </Link>
              </div>
            </div>

            {/* PHASE 1: IN DEVELOPMENT (The Synthetic Engine) */}
            <div className="rounded-2xl border border-[#D97706]/40 bg-white p-6 space-y-4 relative overflow-hidden group shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#D97706] tracking-wider">
                  [PHASE_01 // THE SYNTHETIC ENGINE]
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-[#FFFBEA] border border-[#D97706]/30 px-2.5 py-0.5 text-[10px] font-bold text-[#D97706]">
                  <span className="size-1.5 rounded-full bg-[#D97706] animate-ping" />
                  IN DEVELOPMENT
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-foreground group-hover:text-[#D97706] transition-colors font-sans">
                  {"1000x Synthetic Perps & The House Pool"}
                </h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed font-sans">
                  Sovereign high-leverage synthetic derivative engine with automated FIFO solvency guarantees on HyperEVM.
                </p>
              </div>

              <div className="space-y-2.5 border-t border-border pt-4 text-xs font-sans">
                <div className="p-3 rounded-xl bg-secondary/40 border border-border/80 space-y-1">
                  <div className="text-foreground font-semibold flex items-center gap-1.5">
                    <Database className="size-3.5 text-[#D97706]" />
                    <span>Initial $10k-$25k Bootstrap Pool</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    Initial $10k-$25k Bootstrap Pool providing instant house liquidity for 1000x synthetic perps.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-secondary/40 border border-border/80 space-y-1">
                  <div className="text-foreground font-semibold flex items-center gap-1.5">
                    <Layers className="size-3.5 text-[#D97706]" />
                    <span>Hyperliquid L1 Mid Execution</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    Direct L1 market telemetry feeds to ensure authentic pricing and prevent oracle manipulation.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-secondary/40 border border-border/80 space-y-1">
                  <div className="text-foreground font-semibold flex items-center gap-1.5">
                    <Clock className="size-3.5 text-[#D97706]" />
                    <span>Pure FIFO Settlement</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    Margin returned instantly, extreme net profits handled by an on-chain queue.
                  </p>
                </div>
              </div>
            </div>

            {/* PHASE 2: UPCOMING */}
            <div className="rounded-2xl border border-[#2563EB]/40 bg-white p-6 space-y-4 relative overflow-hidden group shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#2563EB] tracking-wider">
                  [PHASE_02 // TOURNAMENTS]
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-[#EFF6FF] border border-[#2563EB]/30 px-2.5 py-0.5 text-[10px] font-bold text-[#2563EB]">
                  UPCOMING
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-foreground group-hover:text-[#2563EB] transition-colors font-sans">
                  The Candle Cup
                </h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed font-sans">
                  Automated weekly high-ROI arena rewarding top traders with direct native USDC distributions funded by House Pool yield.
                </p>
              </div>

              <div className="space-y-2.5 border-t border-border pt-4 text-xs font-sans">
                <div className="p-3 rounded-xl bg-secondary/40 border border-border/80 space-y-1">
                  <div className="text-foreground font-semibold flex items-center gap-1.5">
                    <Award className="size-3.5 text-[#2563EB]" />
                    <span>Weekly automated ROI leaderboards</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    Weekly automated ROI leaderboards with continuous scoring across every trading session.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-secondary/40 border border-border/80 space-y-1">
                  <div className="text-foreground font-semibold flex items-center gap-1.5">
                    <Zap className="size-3.5 text-[#2563EB]" />
                    <span>Every real trade automatically qualifies</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    Every real trade automatically qualifies. Zero signup barriers or opt-in forms.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-secondary/40 border border-border/80 space-y-1">
                  <div className="text-foreground font-semibold flex items-center gap-1.5">
                    <Shield className="size-3.5 text-[#2563EB]" />
                    <span>Native USDC Prize Pools</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    Prize pools paid out entirely in native USDC from House Pool revenues.
                  </p>
                </div>
              </div>
            </div>

            {/* PHASE 3: FUTURE EXPANSION */}
            <div className="rounded-2xl border border-[#7C3AED]/40 bg-white p-6 space-y-4 relative overflow-hidden group shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#7C3AED] tracking-wider">
                  [PHASE_03 // HARDWARE & OPTIONS]
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-[#FAF5FF] border border-[#7C3AED]/30 px-2.5 py-0.5 text-[10px] font-bold text-[#7C3AED]">
                  FUTURE EXPANSION
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-foreground group-hover:text-[#7C3AED] transition-colors font-sans">
                  {"0DTE Options & Godcandle Hardware"}
                </h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed font-sans">
                  Ultra-short dated outcome options paired with custom physical CNC milled trading hardware for elite high-frequency operators.
                </p>
              </div>

              <div className="space-y-2.5 border-t border-border pt-4 text-xs font-sans">
                <div className="p-3 rounded-xl bg-secondary/40 border border-border/80 space-y-1">
                  <div className="text-foreground font-semibold flex items-center gap-1.5">
                    <Clock className="size-3.5 text-[#7C3AED]" />
                    <span>Outcome-map time barriers (5m - 60m)</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    Outcome-map time barriers (5m - 60m) with defined risk and instant automated settlement upon expiry.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-secondary/40 border border-border/80 space-y-1">
                  <div className="text-foreground font-semibold flex items-center gap-1.5">
                    <Cpu className="size-3.5 text-[#7C3AED]" />
                    <span>Physical milled-aluminum Godcandle Terminal</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    Delivery of the physical milled-aluminum Godcandle Terminal with mechanical switches and direct WebSocket RPC execution for VIP traders.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-secondary/40 border border-border/80 space-y-1">
                  <div className="text-foreground font-semibold flex items-center gap-1.5">
                    <Box className="size-3.5 text-[#7C3AED]" />
                    <span>Direct WebSocket RPC execution</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    Hardware RPC microcontroller for VIP traders bypassing browsers and executing directly with Hyperliquid validators.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. TECHNICAL BOTTOM CALL TO ACTION */}
      <section className="px-4 sm:px-6 lg:px-12 py-12 bg-white border-b border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-2xl border border-border bg-secondary/30">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-lg font-bold text-foreground">Ready to trade directly on Hyperliquid L1?</h3>
            <p className="text-xs text-muted-foreground">
              Connect your Web3 wallet and execute 1x–50x perpetuals with native Builder Code routing.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/trade"
              className="inline-flex items-center gap-2 rounded-full bg-foreground text-background hover:opacity-90 px-6 py-2.5 text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <span>Launch Terminal</span>
              <ArrowUpRight className="size-4" />
            </Link>
            <a
              href="https://github.com/vcelkamarvin/godcandle-core"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-white hover:bg-secondary px-5 py-2.5 text-xs text-foreground transition-all cursor-pointer font-medium shadow-2xs"
            >
              <span>GitHub</span>
              <ExternalLink className="size-3.5 text-muted-foreground" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
