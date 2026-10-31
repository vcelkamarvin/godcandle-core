import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Target,
  Zap,
  Share2,
  TrendingUp,
  CheckCircle2,
  ShieldCheck,
  ArrowUpRight,
  TrendingDown,
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

export const Route = createFileRoute("/goal")({
  head: () => ({
    meta: [
      { title: "godcandle — Price Target Goal" },
      {
        name: "description",
        content:
          "Calculate your potential profit and payoff when an asset reaches your target price.",
      },
      { property: "og:title", content: "godcandle — Price Target Goal" },
      {
        property: "og:description",
        content:
          "Calculate crypto price targets and payoff outcomes on godcandle.",
      },
    ],
  }),
  component: GoalPage,
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

export function GoalPage() {
  const t = useTrading();
  const [underlying, setUnderlying] = useState<Underlying>("BTC");
  const [direction, setDirection] = useState<Direction>("LONG");
  const [amount, setAmount] = useState(10_000);
  const [days, setDays] = useState(30);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [goalLocked, setGoalLocked] = useState(false);

  const spot = t?.feeds?.[underlying]?.price ?? DEFAULT_SPOTS[underlying];

  // Target price state
  const [targetPrice, setTargetPrice] = useState(() => Math.round(spot * 1.15));

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
      setTargetPrice(Math.round(spot * factor));
    }
  }, [underlying, direction, spot]);

  // Pricing & ROI calculations
  const boostMultiplier = 3.2;

  // Calculate move percentage based on chosen direction
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
    if (direction === "LONG") {
      return Math.round(spot * 1.01);
    } else {
      return Math.max(1, Math.round(spot * 0.3));
    }
  }, [spot, direction]);

  const maxTarget = useMemo(() => {
    if (direction === "LONG") {
      return Math.round(spot * 2.0);
    } else {
      return Math.round(spot * 0.99);
    }
  }, [spot, direction]);

  const sliderStep = useMemo(() => {
    return Math.max(1, Math.round(spot * 0.005));
  }, [spot]);

  // Quick milestone chips
  const milestones = useMemo(() => {
    if (direction === "LONG") {
      return [
        { id: "1", label: "+5% Target", price: Math.round(spot * 1.05), pct: 5 },
        { id: "2", label: "+15% Target", price: Math.round(spot * 1.15), pct: 15 },
        { id: "3", label: "+30% Target", price: Math.round(spot * 1.3), pct: 30 },
        { id: "4", label: "+50% Target", price: Math.round(spot * 1.5), pct: 50 },
      ];
    } else {
      return [
        { id: "1", label: "-5% Target", price: Math.round(spot * 0.95), pct: -5 },
        { id: "2", label: "-15% Target", price: Math.round(spot * 0.85), pct: -15 },
        { id: "3", label: "-30% Target", price: Math.round(spot * 0.7), pct: -30 },
        { id: "4", label: "-50% Target", price: Math.round(spot * 0.5), pct: -50 },
      ];
    }
  }, [spot, direction]);

  // Modeled progression curve for ChartCanvas
  const trajectoryValues = useMemo(() => {
    const points = 30;
    const vals: number[] = [];
    for (let i = 0; i <= points; i++) {
      const progress = i / points;
      const simRoi = roiPct * Math.pow(progress, 1.3);
      vals.push(amount * (1 + simRoi / 100));
    }
    return vals;
  }, [amount, roiPct]);

  const handleLockInGoal = () => {
    if (t?.open) {
      t.open(underlying, direction, Math.min(amount, 500), 50);
    }
    setGoalLocked(true);
    toast.success("Target Goal Locked In!", {
      description: `${underlying} ${direction} target $${targetPrice.toLocaleString()} (${movePct >= 0 ? "+" : ""}${movePct.toFixed(1)}%). Modeled Payout: $${(amount + payout).toLocaleString()}`,
    });
    setTimeout(() => setGoalLocked(false), 2400);
  };

  const shareTradeData: ClosedTrade = useMemo(
    () => ({
      id: `goal-${Date.now()}`,
      market: underlying,
      direction: direction,
      stake: amount,
      leverage: Math.round(boostMultiplier * 10),
      entryPrice: spot,
      exitPrice: targetPrice,
      openedAt: Date.now() - days * 86400000,
      closedAt: Date.now(),
      pnl: payout,
      fees: amount * 0.001,
      reason: "take_profit",
    }),
    [underlying, direction, amount, boostMultiplier, spot, targetPrice, days, payout],
  );

  return (
    <main className="relative page-content max-w-7xl mx-auto space-y-5 font-sans text-xs text-foreground">
      {/* Top Banner & Tool Switcher */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-white p-5 sm:p-6 shadow-xs">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#CDC3F0] via-[#FFDAC8] to-[#A0D4CA]" />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-[#E3F8EC] text-[#06964A]">
                <Target className="size-4 text-[#06964A]" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-foreground font-sans">
                Price Target Goal
              </h1>
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground border border-border">
                Price Target Tool
              </span>
            </div>
            <p className="text-muted-foreground text-xs font-sans">
              Set a price target to calculate projected returns and profit milestones.
            </p>
          </div>

          {/* Mode Switch Tabs & Underlying Selector */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Switch between Goal and Boost */}
            <div className="flex items-center p-0.5 rounded-full bg-secondary border border-border shadow-2xs">
              <Link
                to="/goal"
                className="pill pill-ink h-7.5 px-3.5 text-xs font-semibold shadow-xs"
              >
                <span className="flex items-center gap-1.5">
                  <Target className="size-3" />
                  <span>Price Target</span>
                </span>
              </Link>
              <Link
                to="/boost"
                className="pill h-7.5 px-3.5 text-xs text-muted-foreground hover:text-foreground hover:bg-white/60 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Zap className="size-3 text-[#7C3AED]" />
                  <span>Boost Multiplier</span>
                </span>
              </Link>
            </div>

            {/* Asset Selector */}
            <div className="flex items-center gap-1 rounded-full bg-[#F6F6F4] p-1 border border-border">
              {(["BTC", "ETH", "SOL", "HYPE", "SPX", "DOGE"] as const).map((asset) => (
                <button
                  key={asset}
                  type="button"
                  onClick={() => setUnderlying(asset)}
                  className={`pill h-7 px-3 text-xs font-semibold transition-all cursor-pointer ${
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

      {/* Main Grid: Left Controls (4 Cols) | Right Visual Trajectory & Return Orb (8 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Interactive Modeling Controls */}
        <div className="lg:col-span-4 rounded-3xl border border-border bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <span className="font-bold tracking-wider text-xs uppercase flex items-center gap-1.5">
              <Target className="size-3.5 text-[#06964A]" />
              Target Parameters
            </span>
            <span className="text-[10px] font-mono font-bold text-[#06964A] bg-[#E3F8EC] px-2 py-0.5 rounded-full border border-[#06964A]/20">
              {boostMultiplier}× Multiplier
            </span>
          </div>

          {/* Direction Selector (Long vs Short) */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
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
              <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
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
            <span className="text-[10px] text-[#06964A] font-semibold flex items-center gap-1">
              <ShieldCheck className="size-3" />
              Live Price
            </span>
          </div>

          {/* Target Price with Radix Slider & Stepper Controls */}
          <div className="space-y-2 pt-1">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-muted-foreground font-semibold">TARGET PRICE</span>
              <div className="flex items-center gap-1.5 font-mono">
                {/* Stepper buttons for micro-adjustments */}
                <div className="flex items-center gap-1 mr-1">
                  <button
                    type="button"
                    onClick={() => setTargetPrice((p) => Math.max(minTarget, p - sliderStep))}
                    className="size-5 rounded border border-border bg-white flex items-center justify-center hover:bg-secondary cursor-pointer"
                    title="Decrease target price"
                  >
                    <Minus className="size-2.5 text-muted-foreground" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetPrice((p) => Math.min(maxTarget, p + sliderStep))}
                    className="size-5 rounded border border-border bg-white flex items-center justify-center hover:bg-secondary cursor-pointer"
                    title="Increase target price"
                  >
                    <Plus className="size-2.5 text-muted-foreground" />
                  </button>
                </div>
                <span className="text-foreground font-bold text-sm tabular">
                  ${targetPrice.toLocaleString()}
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    movePct >= 0 ? "bg-[#E3F8EC] text-[#06964A]" : "bg-[#FFECEA] text-[#FF3B30]"
                  }`}
                >
                  {movePct >= 0 ? "+" : ""}
                  {movePct.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Radix UI Slider Component */}
            <div className="py-2">
              <Slider
                value={[targetPrice]}
                min={minTarget}
                max={maxTarget}
                step={sliderStep}
                onValueChange={([val]) => {
                  if (typeof val === "number") setTargetPrice(val);
                }}
                className="py-1 cursor-grab active:cursor-grabbing"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1.5">
                <span>${minTarget.toLocaleString()}</span>
                <span>Spot: ${Math.round(spot).toLocaleString()}</span>
                <span>${maxTarget.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Quick Targets Matrix */}
          <div className="space-y-1.5 pt-2 border-t border-border">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block">
              Quick Target Presets ({direction})
            </span>
            <div className="grid grid-cols-2 gap-2">
              {milestones.map((m) => {
                const isSelected = Math.abs(targetPrice - m.price) < spot * 0.02;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setTargetPrice(m.price)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#06964A] bg-[#E3F8EC] text-[#06964A] font-bold shadow-xs"
                        : "border-border bg-[#F6F6F4] text-muted-foreground hover:text-foreground hover:bg-white"
                    }`}
                  >
                    <div className="text-[11px] truncate font-sans">{m.label}</div>
                    <div className="text-[10px] font-mono tabular mt-0.5 text-foreground font-bold">
                      ${m.price.toLocaleString()}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Capital Allocation Presets */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex justify-between items-center text-[11px]">
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
                  className={`pill h-7 text-[11px] font-mono transition-all cursor-pointer ${
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

          {/* Expiry / Timeline */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-muted-foreground font-semibold">TIME HORIZON</span>
              <span className="text-foreground font-bold tabular font-mono">{days} Days</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[7, 14, 30, 60].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={`pill h-7 text-[11px] font-mono transition-all cursor-pointer ${
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
              onClick={handleLockInGoal}
              className={`pill w-full h-10 text-xs font-bold tracking-wide transition-all shadow-xs cursor-pointer ${
                goalLocked ? "bg-[#06964A] text-white" : "pill-ink"
              }`}
            >
              {goalLocked ? (
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4" />
                  Target Goal Set ✓
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Target className="size-3.5" />
                  Set ${targetPrice.toLocaleString()} Goal →
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
                Share Goal
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

        {/* Center / Right: Holographic Showcase, Orb & Payoff Trajectory */}
        <div className="lg:col-span-8 space-y-5">
          {/* Holographic Expected Return Showcase Card */}
          <div className="relative overflow-hidden rounded-3xl border border-border bg-white p-5 sm:p-6 shadow-xs">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#CDC3F0] via-[#FFDAC8] to-[#A0D4CA]" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Iridescent Glowing Return Orb */}
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[#FAFAF8] border border-border relative overflow-hidden shadow-2xs">
                {/* Iridescent background glow aura */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#CDC3F0]/40 via-[#FFDAC8]/30 to-[#A0D4CA]/35 blur-2xl opacity-80" />

                <div className="relative z-10 size-44 rounded-full flex flex-col items-center justify-center text-center p-4 border border-border bg-white/90 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold font-sans">
                    Estimated Return
                  </span>
                  <span
                    className={`font-mono tabular text-3xl font-bold tracking-tight my-1 ${
                      roiPct >= 0 ? "text-[#06964A]" : "text-[#FF3B30]"
                    }`}
                  >
                    {roiPct >= 0 ? "+" : ""}
                    {roiPct.toFixed(1)}%
                  </span>
                  <span className="font-mono tabular text-xs font-semibold text-foreground">
                    ${(amount + payout).toLocaleString()}
                  </span>
                  <span className="text-[9px] text-muted-foreground mt-1 font-sans">
                    {boostMultiplier}× Multiplier
                  </span>
                </div>
              </div>

              {/* Trajectory Breakdown */}
              <div className="space-y-3 font-sans">
                <div>
                  <h3 className="text-sm font-bold text-foreground font-sans">
                    Payout &amp; Return Summary
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Estimated payout based on reaching the target price with your selected settings.
                  </p>
                </div>

                <div className="space-y-2 text-[11px] font-mono">
                  <div className="flex justify-between py-1.5 border-b border-border">
                    <span className="text-muted-foreground font-sans">Direction</span>
                    <span
                      className={`font-bold tabular ${
                        direction === "LONG" ? "text-[#06964A]" : "text-[#FF3B30]"
                      }`}
                    >
                      {direction === "LONG" ? "LONG ↗ (Upward)" : "SHORT ↘ (Downward)"}
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
                      ${targetPrice.toLocaleString()}
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
                    <span className="font-bold text-foreground font-sans">
                      HyperEVM Settlement
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modeled Trajectory Chart Canvas */}
          <div className="relative overflow-hidden rounded-3xl border border-border bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="size-3.5 text-[#06964A]" />
                Capital Payoff Curve
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {days}D Target Curve ({direction})
              </span>
            </div>
            <div className="pt-1">
              <ChartCanvas height={140} kind="curve" values={trajectoryValues} />
            </div>
          </div>

          {/* Modeled Milestones Ladder */}
          <div className="relative overflow-hidden rounded-3xl border border-border bg-white p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-foreground text-xs tracking-wider uppercase">
              Payout at Price Milestones (${amount.toLocaleString()} Principal · {direction})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(direction === "LONG" ? [1.05, 1.15, 1.3, 1.5] : [0.95, 0.85, 0.7, 0.5]).map(
                (mult) => {
                  const p = Math.round(spot * mult);
                  const move =
                    direction === "LONG" ? ((p - spot) / spot) * 100 : ((spot - p) / spot) * 100;
                  const r = move * boostMultiplier;
                  const g = Math.round(amount * (r / 100));
                  return (
                    <div
                      key={mult}
                      className="p-3 rounded-2xl border border-border bg-[#F6F6F4] space-y-1 transition-all hover:bg-white hover:border-foreground/30 shadow-2xs"
                    >
                      <div className="text-[10px] text-muted-foreground font-semibold font-sans">
                        {direction === "LONG"
                          ? `+${move.toFixed(0)}% Target Move`
                          : `-${move.toFixed(0)}% Target Move`}
                      </div>
                      <div className="text-sm font-bold text-foreground font-mono tabular">
                        ${p.toLocaleString()}
                      </div>
                      <div className="text-[11px] font-bold text-[#06964A] font-mono tabular">
                        +${g.toLocaleString()} (+{r.toFixed(0)}%)
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal Dialog */}
      <ShareModal
        trade={shareTradeData}
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        initialMode="goal"
      />
    </main>
  );
}
