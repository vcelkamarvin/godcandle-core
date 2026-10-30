import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Target,
  Share2,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  Shield,
  Layers,
  ChevronRight,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useTrading } from "@/components/godcandle/TradingProvider";
import { fmtUsd, fmtSigned } from "@/lib/engine";

export const Route = createFileRoute("/goal")({
  head: () => ({
    meta: [
      { title: "godcandle — Target Goal Studio" },
      {
        name: "description",
        content:
          "Model high-leverage target price milestones and payoff trajectories in signature light rainbow style on HyperEVM.",
      },
    ],
  }),
  component: GoalPage,
});

type Underlying = "BTC" | "ETH" | "SOL";

const DEFAULT_SPOTS: Record<Underlying, number> = {
  BTC: 68420.5,
  ETH: 2540.2,
  SOL: 182.4,
};

export function GoalPage() {
  const t = useTrading();
  const [underlying, setUnderlying] = useState<Underlying>("BTC");
  const [amount, setAmount] = useState(10_000);
  const [days, setDays] = useState(30);

  const spot = t?.feeds?.[underlying]?.price ?? DEFAULT_SPOTS[underlying];
  const [targetPrice, setTargetPrice] = useState(Math.round(spot * 1.15));

  useEffect(() => {
    setTargetPrice(Math.round(spot * 1.15));
  }, [underlying]);

  const targetMove = spot > 0 ? ((targetPrice - spot) / spot) * 100 : 0;
  const isUp = targetPrice >= spot;
  const boostMultiplier = 3.2;
  const roiPct = targetMove * boostMultiplier;
  const payout = Math.round(amount * (roiPct / 100));

  const minTarget = Math.round(spot * 0.65);
  const maxTarget = Math.round(spot * 1.55);

  const milestones = useMemo(() => [
    { id: "1", label: "+5% Near Pivot", price: Math.round(spot * 1.05), pct: 5 },
    { id: "2", label: "+15% Structural Move", price: Math.round(spot * 1.15), pct: 15 },
    { id: "3", label: "+30% Godcandle Run", price: Math.round(spot * 1.30), pct: 30 },
    { id: "4", label: "+50% Macro Expansion", price: Math.round(spot * 1.50), pct: 50 },
  ], [spot]);

  const handleLockInGoal = () => {
    if (t?.open) {
      t.open(underlying, isUp ? "LONG" : "SHORT", Math.min(amount, 500), 100);
    }
    toast.success(`Target Goal Locked In!`, {
      description: `${underlying} target $${targetPrice.toLocaleString()} (${targetMove >= 0 ? "+" : ""}${targetMove.toFixed(1)}%). Projected Payout: $${(amount + payout).toLocaleString()}`,
    });
  };

  return (
    <main className="relative page-content max-w-7xl mx-auto space-y-6 font-mono text-xs text-foreground">
      {/* Top Breadcrumb & Header with Iridescent Rainbow Accent */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-white p-6 shadow-sm">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#CDC3F0] via-[#FFDAC8] to-[#A0D4CA]" />
        
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-gradient-to-r from-[#CDC3F0]/50 to-[#FFDAC8]/50 text-foreground">
                <Target className="size-4 text-foreground" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-foreground font-sans">Target Goal Studio</h1>
              <span className="rounded-full bg-gradient-to-r from-[#CDC3F0]/40 via-[#FFDAC8]/40 to-[#A0D4CA]/40 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-foreground border border-border">
                0DTE & Swing Convexity
              </span>
            </div>
            <p className="text-muted-foreground text-xs font-sans">
              Model non-linear outcome scenarios, target price payoff milestones, and capital trajectory on HyperEVM.
            </p>
          </div>

          {/* Underlying Asset Switcher */}
          <div className="flex items-center gap-1.5 rounded-full bg-[#F6F6F4] p-1 border border-border">
            {(["BTC", "ETH", "SOL"] as const).map((asset) => (
              <button
                key={asset}
                type="button"
                onClick={() => setUnderlying(asset)}
                className={`pill h-8 px-4 text-xs transition-all ${
                  underlying === asset
                    ? "pill-ink font-semibold shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {asset}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Modeling Inputs */}
        <div className="lg:col-span-4 space-y-5">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-white p-5 shadow-sm space-y-5">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#CDC3F0] to-[#FFDAC8] opacity-70" />

            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="font-bold text-foreground tracking-wide">TARGET MODEL PARAMS</span>
              <span className="tabular text-xs font-bold px-2 py-0.5 rounded-full bg-[#E3F8EC] text-[#06964A]">
                {targetMove >= 0 ? "+" : ""}{targetMove.toFixed(1)}% Move
              </span>
            </div>

            {/* Target Price Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-muted-foreground text-[11px]">
                <span>TARGET PRICE</span>
                <span className="text-foreground font-bold tabular text-sm">${targetPrice.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min={minTarget}
                max={maxTarget}
                step={Math.max(1, Math.round(spot * 0.005))}
                value={targetPrice}
                onChange={(e) => setTargetPrice(Number(e.target.value))}
                className="w-full accent-foreground bg-[#E6E6E3] h-1.5 appearance-none cursor-pointer rounded-full"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Min: ${minTarget.toLocaleString()}</span>
                <span>Spot: ${Math.round(spot).toLocaleString()}</span>
                <span>Max: ${maxTarget.toLocaleString()}</span>
              </div>
            </div>

            {/* Capital Allocation */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-muted-foreground text-[11px]">
                <span>CAPITAL ALLOCATION</span>
                <span className="text-foreground font-bold tabular text-sm">${amount.toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[1000, 5000, 10000, 25000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    className={`pill h-7 text-[11px] transition-all ${
                      amount === val
                        ? "pill-ink font-semibold shadow-sm"
                        : "border border-border bg-[#F6F6F4] text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    ${val >= 1000 ? `${val / 1000}k` : val}
                  </button>
                ))}
              </div>
            </div>

            {/* Expiry Days */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-muted-foreground text-[11px]">
                <span>TIME TO TARGET</span>
                <span className="text-foreground font-bold tabular">{days} Days</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[7, 14, 30, 60].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDays(d)}
                    className={`pill h-7 text-[11px] transition-all ${
                      days === d
                        ? "pill-ink font-semibold shadow-sm"
                        : "border border-border bg-[#F6F6F4] text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {d}D
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Milestones Matrix */}
            <div className="space-y-2 pt-2 border-t border-border">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
                Quick Milestone Targets
              </span>
              <div className="grid grid-cols-2 gap-2">
                {milestones.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setTargetPrice(m.price)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      Math.abs(targetPrice - m.price) < spot * 0.02
                        ? "border-[#06964A] bg-[#E3F8EC] text-[#06964A] font-bold"
                        : "border-border bg-[#F6F6F4] text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="text-[11px] truncate">{m.label}</div>
                    <div className="text-[10px] tabular mt-0.5 text-foreground font-bold">
                      ${m.price.toLocaleString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="button"
              onClick={handleLockInGoal}
              className="pill pill-ink w-full h-11 text-xs font-bold tracking-wide shadow-sm"
            >
              Lock in Target Goal →
            </Button>
          </div>
        </div>

        {/* Center / Right: Visual Trajectory & Expected Return Orb */}
        <div className="lg:col-span-8 space-y-5">
          {/* Holographic Expected Return Showcase */}
          <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-white to-[#F6F6F4] p-6 shadow-sm">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#CDC3F0] via-[#FFDAC8] to-[#A0D4CA]" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Iridescent Glowing Return Orb */}
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white border border-border relative overflow-hidden shadow-sm">
                {/* Iridescent background glow aura */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#CDC3F0]/30 via-[#FFDAC8]/25 to-[#A0D4CA]/30 blur-2xl opacity-75" />

                <div className="relative z-10 size-44 rounded-full flex flex-col items-center justify-center text-center p-4 border border-border bg-white/80 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                    Target Return
                  </span>
                  <span className={`tabular text-3xl font-bold tracking-tight my-1 ${roiPct >= 0 ? "text-[#06964A]" : "text-[#FF3B30]"}`}>
                    {roiPct >= 0 ? "+" : ""}{roiPct.toFixed(1)}%
                  </span>
                  <span className="tabular text-xs font-semibold text-foreground">
                    ${(amount + payout).toLocaleString()}
                  </span>
                  <span className="text-[9px] text-muted-foreground mt-1">
                    {boostMultiplier}× Convex Payout
                  </span>
                </div>
              </div>

              {/* Trajectory Breakdown */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground font-sans">Payout Trajectory Breakdown</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Evaluated via HyperEVM Mark Price with synthetic outcome payoff curves.
                  </p>
                </div>

                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between py-1.5 border-b border-border">
                    <span className="text-muted-foreground">Current Spot</span>
                    <span className="font-bold tabular text-foreground">${spot.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border">
                    <span className="text-muted-foreground">Modeled Target</span>
                    <span className="font-bold tabular text-foreground">${targetPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border">
                    <span className="text-muted-foreground">Underlying Distance</span>
                    <span className="font-bold tabular text-[#06964A]">+{targetMove.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border">
                    <span className="text-muted-foreground">Net Profit if Hit</span>
                    <span className="font-bold tabular text-[#06964A]">+${payout.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-muted-foreground">Settlement Layer</span>
                    <span className="font-bold text-foreground">HyperEVM FIFO House Pool</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modeled Milestones Ladder */}
          <div className="relative overflow-hidden rounded-2xl border border-border bg-white p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-foreground text-xs tracking-wider uppercase">
              Target Milestone Ladder (${amount.toLocaleString()} Principal)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {[1.05, 1.15, 1.30, 1.50].map((mult) => {
                const p = Math.round(spot * mult);
                const move = ((p - spot) / spot) * 100;
                const r = move * boostMultiplier;
                const g = Math.round(amount * (r / 100));
                return (
                  <div key={mult} className="p-3 rounded-xl border border-border bg-[#F6F6F4] space-y-1">
                    <div className="text-[10px] text-muted-foreground font-semibold">
                      +{move.toFixed(0)}% Expansion
                    </div>
                    <div className="text-sm font-bold text-foreground tabular">
                      ${p.toLocaleString()}
                    </div>
                    <div className="text-[11px] font-bold text-[#06964A] tabular">
                      +${g.toLocaleString()} (+{r.toFixed(0)}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
