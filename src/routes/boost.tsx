import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Zap,
  Target,
  Share2,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  ShieldCheck,
  ArrowUpRight,
  Plus,
  Minus,
} from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useTrading } from "@/components/godcandle/TradingProvider";
import { ShareModal } from "@/components/godcandle/ShareModal";
import { ChartCanvas } from "@/components/godcandle/ChartCanvas";
import type { ClosedTrade } from "@/lib/engine";

export const Route = createFileRoute("/boost")({
  head: () => ({
    meta: [
      { title: "godcandle — Boost Multiplier" },
      {
        name: "description",
        content:
          "Calculate accelerated payout returns on market moves using dynamic multipliers.",
      },
      { property: "og:title", content: "godcandle — Boost Multiplier" },
      {
        name: "og:description",
        content:
          "Calculate accelerated payout returns on market moves using dynamic multipliers on HyperEVM.",
      },
    ],
  }),
  component: BoostPage,
});

type Underlying = "BTC" | "ETH" | "SOL" | "HYPE" | "SPX" | "DOGE";
type Direction = "LONG" | "SHORT";

const DEFAULT_SPOTS: Record<Underlying, number> = {
  BTC: 68420.5,
  ETH: 2540.2,
  SOL: 182.4,
  HYPE: 42.8,
  SPX: 6120.0,
  DOGE: 0.164,
};

function getTargetPrecision(price: number): number {
  if (price >= 500) return 0;
  if (price >= 10) return 2;
  if (price >= 1) return 3;
  return 4;
}

function roundToPrecision(val: number, precision: number): number {
  const factor = Math.pow(10, precision);
  return Math.round(val * factor) / factor;
}

function formatTargetPrice(val: number, spot: number): string {
  const precision = getTargetPrecision(spot);
  return val.toLocaleString(undefined, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
}

export function BoostPage() {
  const t = useTrading();
  const [underlying, setUnderlying] = useState<Underlying>("BTC");
  const [direction, setDirection] = useState<Direction>("LONG");
  const [amount, setAmount] = useState(10_000);
  const [days, setDays] = useState(30);
  const [boostMultiplier, setBoostMultiplier] = useState(10);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [boostLocked, setBoostLocked] = useState(false);
  const [mobileTab, setMobileTab] = useState<"params" | "payoff">("params");

  const spot = t?.feeds?.[underlying]?.price ?? DEFAULT_SPOTS[underlying];

  // Target price state
  const [targetPrice, setTargetPrice] = useState(() => {
    const precision = getTargetPrecision(spot);
    return roundToPrecision(spot * 1.15, precision);
  });

  // Only re-anchor target price when underlying asset or direction explicitly changes
  const prevUnderlyingRef = useRef(underlying);
  const prevDirectionRef = useRef(direction);

  useEffect(() => {
    const underlyingChanged = prevUnderlyingRef.current !== underlying;
    const directionChanged = prevDirectionRef.current !== direction;

    if (underlyingChanged || directionChanged) {
      prevUnderlyingRef.current = underlying;
      prevDirectionRef.current = direction;
      const factor = direction === "LONG" ? 1.15 : 0.85;
      const precision = getTargetPrecision(spot);
      setTargetPrice(roundToPrecision(spot * factor, precision));
    }
  }, [underlying, direction, spot]);

  // Pricing & ROI calculations
  const movePct = useMemo(() => {
    if (spot <= 0) return 0;
    if (direction === "LONG") {
      return ((targetPrice - spot) / spot) * 100;
    } else {
      return ((spot - targetPrice) / spot) * 100;
    }
  }, [spot, targetPrice, direction]);

  const roiPct = Math.max(-100, movePct * boostMultiplier);
  const payout = Math.round(amount * (roiPct / 100));

  // Slider bounds
  const minTarget = useMemo(() => {
    const precision = getTargetPrecision(spot);
    if (direction === "LONG") {
      return roundToPrecision(spot * 1.01, precision);
    } else {
      return roundToPrecision(spot * 0.3, precision);
    }
  }, [spot, direction]);

  const maxTarget = useMemo(() => {
    const precision = getTargetPrecision(spot);
    if (direction === "LONG") {
      return roundToPrecision(spot * 2.0, precision);
    } else {
      return roundToPrecision(spot * 0.99, precision);
    }
  }, [spot, direction]);

  const sliderStep = useMemo(() => {
    const precision = getTargetPrecision(spot);
    const rawStep = spot * 0.005;
    return precision === 0
      ? Math.max(1, Math.round(rawStep))
      : roundToPrecision(Math.max(Math.pow(10, -precision), rawStep), precision);
  }, [spot]);

  // Modeled non-linear trajectory curve for ChartCanvas
  const trajectoryValues = useMemo(() => {
    const points = 30;
    const vals: number[] = [];
    for (let i = 0; i <= points; i++) {
      const progress = i / points;
      const simRoi = roiPct * Math.pow(progress, 1.4);
      vals.push(amount * (1 + simRoi / 100));
    }
    return vals;
  }, [amount, roiPct]);

  const handleLockInBoost = () => {
    if (t?.open) {
      t.open(
        underlying,
        direction === "LONG" ? "long" : "short",
        Math.min(amount, 500),
        Math.min(boostMultiplier * 10, 50)
      );
    }
    setBoostLocked(true);
    toast.success(`${boostMultiplier}× Boost Active!`, {
      description: `${underlying} ${direction} ${boostMultiplier}× Boost · Target $${targetPrice.toLocaleString()} (${movePct >= 0 ? "+" : ""}${movePct.toFixed(1)}%). Modeled Payout: $${(amount + payout).toLocaleString()}`,
    });
    setTimeout(() => setBoostLocked(false), 2400);
  };

  const shareTradeData: ClosedTrade = useMemo(
    () => ({
      id: `boost-${Date.now()}`,
      market: underlying,
      side: direction === "LONG" ? "long" : "short",
      stake: amount,
      leverage: Math.round(boostMultiplier * 5),
      entry: spot,
      exit: targetPrice,
      openedAt: Date.now() - days * 86400000,
      closedAt: Date.now(),
      durationMs: days * 86400000,
      liquidated: false,
      pnl: payout,
    }),
    [underlying, direction, amount, boostMultiplier, spot, targetPrice, days, payout],
  );

  return (
    <main className="relative page-content max-w-7xl mx-auto space-y-3 sm:space-y-5 font-sans text-xs text-foreground px-2 sm:px-4">
      {/* Top Banner & Tool Switcher */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-white p-3.5 sm:p-6 shadow-xs">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#CDC3F0] via-[#FFDAC8] to-[#A0D4CA]" />

        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-0.5 sm:space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-[#FAF5FF] text-[#7C3AED]">
                <Zap className="size-4 text-[#7C3AED]" />
              </span>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground font-sans">
                Boost Multiplier
              </h1>
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-muted-foreground border border-border">
                Multiplier Tool
              </span>
            </div>
            <p className="hidden sm:block text-muted-foreground text-xs font-sans">
              Calculate accelerated payout returns on market moves using dynamic multipliers.
            </p>
          </div>

          {/* Mode Switch Tabs & Underlying Selector */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Switch between Goal and Boost */}
            <div className="flex items-center p-0.5 rounded-full bg-secondary border border-border shadow-2xs">
              <Link
                to="/goal"
                className="pill h-7.5 px-3.5 text-xs text-muted-foreground hover:text-foreground hover:bg-white/60 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Target className="size-3" />
                  <span>Price Target</span>
                </span>
              </Link>
              <Link
                to="/boost"
                className="pill pill-ink h-7.5 px-3.5 text-xs font-semibold shadow-xs"
              >
                <span className="flex items-center gap-1.5">
                  <Zap className="size-3 text-[#7C3AED]" />
                  <span>Boost Multiplier</span>
                </span>
              </Link>
            </div>

            {/* Asset Selector */}
            <div className="flex items-center gap-1 rounded-full bg-[#F6F6F4] p-1 border border-border overflow-x-auto no-scrollbar">
              {(["BTC", "ETH", "SOL", "HYPE", "SPX", "DOGE"] as const).map((asset) => (
                <button
                  key={asset}
                  type="button"
                  onClick={() => setUnderlying(asset)}
                  className={`pill h-7 px-2.5 sm:px-3 text-xs font-semibold transition-all cursor-pointer ${
                    underlying === asset
                      ? "pill-ink font-bold shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-white"
                  }`}
                >
                  {asset}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Real-Time Outcome Summary & Tab Switcher */}
      <div className="lg:hidden p-3 rounded-2xl bg-white border border-border shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block">
              Estimated Return ({direction})
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span
                className={`text-xl font-bold font-mono tabular ${
                  roiPct >= 0 ? "text-[#06964A]" : "text-[#FF3B30]"
                }`}
              >
                {roiPct >= 0 ? "+" : ""}
                {roiPct.toFixed(1)}%
              </span>
              <span className="text-xs font-semibold font-mono text-foreground tabular">
                ${(amount + payout).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono font-bold text-[#7C3AED] bg-[#FAF5FF] px-2 py-0.5 rounded-full border border-[#7C3AED]/20">
              {boostMultiplier}× Multiplier
            </span>
          </div>
        </div>

        {/* 1-Tap Toggle between Parameters & Visual Trajectory */}
        <div className="grid grid-cols-2 gap-1 p-0.5 rounded-xl bg-secondary border border-border/70">
          <button
            type="button"
            onClick={() => setMobileTab("params")}
            className={`h-7 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mobileTab === "params"
                ? "bg-white text-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Zap className="size-3 text-[#7C3AED]" />
            <span>Multiplier Setup</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("payoff")}
            className={`h-7 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mobileTab === "payoff"
                ? "bg-white text-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <TrendingUp className="size-3 text-[#06964A]" />
            <span>Curve & Milestones</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Controls (4 Cols) | Right Visual Orb & Breakdown (8 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-5 items-start">
        {/* Left Column: Boost Controls */}
        <div className={`lg:col-span-4 rounded-3xl border border-border bg-white p-3.5 sm:p-5 shadow-xs space-y-3 sm:space-y-4 ${
          mobileTab === "params" ? "block" : "hidden lg:block"
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <span className="font-bold tracking-wider text-xs uppercase flex items-center gap-1.5">
              <Zap className="size-3.5 text-[#7C3AED]" />
              Multiplier Settings
            </span>
            <span className="text-xs font-mono font-bold text-[#7C3AED] bg-[#FAF5FF] px-2 py-0.5 rounded-full border border-[#7C3AED]/20">
              {boostMultiplier}× Multiplier
            </span>
          </div>

          {/* Direction Selector (Long vs Short) */}
          <div className="space-y-1.5">
            <span className="text-xs text-muted-foreground uppercase font-semibold block">
              Market Direction
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDirection("LONG")}
                className={`pill h-8 text-xs font-semibold transition-all cursor-pointer ${
                  direction === "LONG"
                    ? "btn-long-ink font-bold shadow-xs"
                    : "border border-border bg-[#F6F6F4] text-muted-foreground hover:text-foreground hover:bg-white"
                }`}
              >
                <TrendingUp className="size-3.5 text-[#06964A]" />
                Long ↗ (Upside)
              </button>
              <button
                type="button"
                onClick={() => setDirection("SHORT")}
                className={`pill h-8 text-xs font-semibold transition-all cursor-pointer ${
                  direction === "SHORT"
                    ? "btn-short-ink font-bold shadow-xs"
                    : "border border-border bg-[#F6F6F4] text-muted-foreground hover:text-foreground hover:bg-white"
                }`}
              >
                <TrendingDown className="size-3.5 text-[#FF3B30]" />
                Short ↘ (Downside)
              </button>
            </div>
          </div>

          {/* Current Price */}
          <div className="p-3 rounded-2xl bg-[#F6F6F4] border border-border flex justify-between items-center">
            <div>
              <span className="text-xs text-muted-foreground uppercase font-semibold block">
                {underlying} Current Price
              </span>
              <span className="text-sm font-bold tabular text-foreground font-mono">
                $
                {spot.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <span className="text-xs text-[#06964A] font-semibold flex items-center gap-1">
              <ShieldCheck className="size-3" />
              Live Price
            </span>
          </div>

          {/* Boost Multiplier Selector */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-semibold">BOOST MULTIPLIER</span>
              <span className="text-foreground font-bold tabular font-mono text-sm">
                {boostMultiplier}× Multiplier
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {[2, 5, 10, 25, 50, 100].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setBoostMultiplier(m)}
                  className={`pill h-7 text-xs font-mono transition-all cursor-pointer ${
                    boostMultiplier === m
                      ? "pill-ink font-bold shadow-xs"
                      : "border border-border bg-[#F6F6F4] text-muted-foreground hover:text-foreground hover:bg-white"
                  }`}
                >
                  {m}×
                </button>
              ))}
            </div>
          </div>

          {/* Target Price with Radix Slider & Steppers */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-semibold">TARGET PRICE</span>
              <div className="flex items-center gap-1.5 font-mono">
                <div className="flex items-center gap-1 mr-1">
                  <button
                    type="button"
                    onClick={() => {
                      const prec = getTargetPrecision(spot);
                      setTargetPrice((p) => Math.max(minTarget, roundToPrecision(p - sliderStep, prec)));
                    }}
                    className="size-5 rounded border border-border bg-white flex items-center justify-center hover:bg-secondary cursor-pointer"
                    title="Decrease target price"
                  >
                    <Minus className="size-2.5 text-muted-foreground" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const prec = getTargetPrecision(spot);
                      setTargetPrice((p) => Math.min(maxTarget, roundToPrecision(p + sliderStep, prec)));
                    }}
                    className="size-5 rounded border border-border bg-white flex items-center justify-center hover:bg-secondary cursor-pointer"
                    title="Increase target price"
                  >
                    <Plus className="size-2.5 text-muted-foreground" />
                  </button>
                </div>
                <span className="text-foreground font-bold text-sm tabular">
                  ${formatTargetPrice(targetPrice, spot)}
                </span>
                <span
                  className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                    movePct >= 0 ? "bg-[#E3F8EC] text-[#06964A]" : "bg-[#FFECEA] text-[#FF3B30]"
                  }`}
                >
                  {movePct >= 0 ? "+" : ""}
                  {movePct.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="py-2">
              <Slider
                value={[targetPrice]}
                min={minTarget}
                max={maxTarget}
                step={sliderStep}
                onValueChange={([val]) => {
                  if (typeof val === "number") {
                    setTargetPrice(roundToPrecision(val, getTargetPrecision(spot)));
                  }
                }}
                className="py-1 cursor-grab active:cursor-grabbing"
              />
              <div className="flex justify-between text-xs text-muted-foreground font-mono mt-1.5">
                <span>${formatTargetPrice(minTarget, spot)}</span>
                <span>Spot: ${formatTargetPrice(spot, spot)}</span>
                <span>${formatTargetPrice(maxTarget, spot)}</span>
              </div>
            </div>
          </div>

          {/* Quick Target Move Chips */}
          <div className="space-y-1.5 pt-2 border-t border-border">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block">
              Quick Target Presets ({direction})
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {[5, 10, 20, 40].map((pct) => {
                const precision = getTargetPrecision(spot);
                const target =
                  direction === "LONG"
                    ? roundToPrecision(spot * (1 + pct / 100), precision)
                    : roundToPrecision(spot * (1 - pct / 100), precision);
                return (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setTargetPrice(target)}
                    className="p-2 rounded-xl border border-border bg-[#F6F6F4] text-center hover:bg-white hover:border-foreground/30 transition-all cursor-pointer"
                  >
                    <div
                      className={`text-xs font-bold ${
                        direction === "LONG" ? "text-[#06964A]" : "text-[#FF3B30]"
                      }`}
                    >
                      {direction === "LONG" ? `+${pct}%` : `-${pct}%`}
                    </div>
                    <div className="text-xs font-mono text-muted-foreground mt-0.5">
                      ${formatTargetPrice(target, spot)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Capital Allocation */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-semibold">CAPITAL AMOUNT</span>
              <span className="text-foreground font-bold tabular font-mono text-sm">
                ${amount.toLocaleString()}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[1000, 5000, 10000, 25000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  className={`pill h-7 text-xs font-mono transition-all cursor-pointer ${
                    amount === val
                      ? "pill-ink font-semibold shadow-xs"
                      : "border border-border bg-[#F6F6F4] text-muted-foreground hover:text-foreground hover:bg-white"
                  }`}
                >
                  ${val >= 1000 ? `${val / 1000}k` : val}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-semibold">TIME HORIZON</span>
              <span className="text-foreground font-bold tabular font-mono">{days} Days</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[7, 14, 30, 60].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={`pill h-7 text-xs font-mono transition-all cursor-pointer ${
                    days === d
                      ? "pill-ink font-semibold shadow-xs"
                      : "border border-border bg-[#F6F6F4] text-muted-foreground hover:text-foreground hover:bg-white"
                  }`}
                >
                  {d}D
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <Button
              type="button"
              onClick={handleLockInBoost}
              className={`pill w-full h-10 text-xs font-bold tracking-wide transition-all shadow-xs cursor-pointer ${
                boostLocked ? "bg-[#06964A] text-white" : "pill-ink"
              }`}
            >
              {boostLocked ? (
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4" />
                  {boostMultiplier}× Boost Active ✓
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Zap className="size-3.5" />
                  Set {boostMultiplier}× Boost →
                </span>
              )}
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShareModalOpen(true)}
                className="pill h-8 text-xs font-semibold border-border bg-white hover:bg-secondary text-foreground cursor-pointer"
              >
                <Share2 className="mr-1.5 size-3" />
                Share Boost
              </Button>
              <Button
                asChild
                variant="outline"
                className="pill h-8 text-xs font-semibold border-border bg-white hover:bg-secondary text-foreground cursor-pointer"
              >
                <Link to="/" search={{ pair: `${underlying}-USD` } as any}>
                  Terminal <ArrowUpRight className="ml-1 size-3" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Center / Right: Convex Payout Orb & Matrix */}
        <div className={`lg:col-span-8 space-y-3 sm:space-y-5 ${
          mobileTab === "payoff" ? "block" : "hidden lg:block"
        }`}>
          {/* Holographic Showcase */}
          <div className="relative overflow-hidden rounded-3xl border border-border bg-white p-3.5 sm:p-6 shadow-xs">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#CDC3F0] via-[#FFDAC8] to-[#A0D4CA]" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-center">
              {/* Iridescent Return Orb */}
              <div className="flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl bg-[#FAFAF8] border border-border relative overflow-hidden shadow-2xs">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#CDC3F0]/40 via-[#FFDAC8]/30 to-[#A0D4CA]/35 blur-2xl opacity-80" />

                <div className="relative z-10 size-36 sm:size-44 rounded-full flex flex-col items-center justify-center text-center p-3 sm:p-4 border border-border bg-white/90 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
                  <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold font-sans">
                    Estimated Return
                  </span>
                  <span
                    className={`font-mono tabular text-2xl sm:text-3xl font-bold tracking-tight my-0.5 sm:my-1 ${
                      roiPct >= 0 ? "text-[#06964A]" : "text-[#FF3B30]"
                    }`}
                  >
                    {roiPct >= 0 ? "+" : ""}
                    {roiPct.toFixed(1)}%
                  </span>
                  <span className="font-mono tabular text-xs font-semibold text-foreground">
                    ${(amount + payout).toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground mt-0.5 sm:mt-1 font-sans">
                    {boostMultiplier}× Multiplier
                  </span>
                </div>
              </div>

              {/* Multiplier Stats */}
              <div className="space-y-3 font-sans">
                <div>
                  <h3 className="text-sm font-bold text-foreground font-sans">
                    Payout &amp; Return Summary
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Estimated payout based on reaching the target price with your selected multiplier.
                  </p>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between py-1.5 border-b border-border">
                    <span className="text-muted-foreground font-sans">Direction</span>
                    <span
                      className={`font-bold tabular ${
                        direction === "LONG" ? "text-[#06964A]" : "text-[#FF3B30]"
                      }`}
                    >
                      {direction === "LONG" ? "LONG ↗ (Upside)" : "SHORT ↘ (Downside)"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border">
                    <span className="text-muted-foreground font-sans">Current Price</span>
                    <span className="font-bold tabular text-foreground">
                      $
                      {spot.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border">
                    <span className="text-muted-foreground font-sans">Target Price</span>
                    <span className="font-bold tabular text-foreground">
                      ${formatTargetPrice(targetPrice, spot)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border">
                    <span className="text-muted-foreground font-sans">Price Distance</span>
                    <span
                      className={`font-bold tabular ${
                        movePct >= 0 ? "text-[#06964A]" : "text-[#FF3B30]"
                      }`}
                    >
                      {movePct >= 0 ? "+" : ""}
                      {movePct.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border">
                    <span className="text-muted-foreground font-sans">Estimated Profit</span>
                    <span
                      className={`font-bold tabular ${
                        payout >= 0 ? "text-[#06964A]" : "text-[#FF3B30]"
                      }`}
                    >
                      {payout >= 0 ? "+" : ""}${payout.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-muted-foreground font-sans">Settlement</span>
                    <span className="font-bold text-[#06964A] font-sans">
                      HyperEVM Settlement
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modeled Non-Linear Curve */}
          <div className="relative overflow-hidden rounded-3xl border border-border bg-white p-3.5 sm:p-5 shadow-xs space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="size-3.5 text-[#06964A]" />
                Boosted Payoff Curve
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {boostMultiplier}× Target Curve ({direction})
              </span>
            </div>
            <div className="pt-1">
              <ChartCanvas height={130} kind="curve" values={trajectoryValues} />
            </div>
          </div>

          {/* Convex Multiplier Ladder */}
          <div className="relative overflow-hidden rounded-3xl border border-border bg-white p-3.5 sm:p-5 shadow-xs space-y-2.5 sm:space-y-3">
            <h3 className="font-bold text-foreground text-xs tracking-wider uppercase">
              Payout at Different Multipliers ({direction} {movePct >= 0 ? "+" : ""}
              {movePct.toFixed(1)}% Move)
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              {[2, 5, 10, 25].map((m) => {
                const r = movePct * m;
                const p = Math.round(amount * (r / 100));
                return (
                  <div
                    key={m}
                    className="p-2 sm:p-3 rounded-2xl border border-border bg-[#F6F6F4] space-y-0.5 sm:space-y-1 transition-all hover:bg-white hover:border-foreground/30 shadow-2xs"
                  >
                    <div className="text-xs sm:text-xs text-muted-foreground font-semibold font-sans">
                      {m}× Multiplier
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-foreground font-mono tabular">
                      ${(amount + p).toLocaleString()}
                    </div>
                    <div className="text-xs sm:text-xs font-bold text-[#06964A] font-mono tabular">
                      +${p.toLocaleString()} (+{r.toFixed(0)}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal Dialog */}
      <ShareModal
        trade={shareTradeData}
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        initialMode="boost"
      />
    </main>
  );
}
