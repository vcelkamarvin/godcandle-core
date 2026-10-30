import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Zap,
  TrendingUp,
  SlidersHorizontal,
  Shield,
  Layers,
  Sparkles,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useTrading } from "@/components/godcandle/TradingProvider";
import { fmtUsd, fmtSigned } from "@/lib/engine";

export const Route = createFileRoute("/boost")({
  head: () => ({
    meta: [
      { title: "godcandle — Convexity Boost Multiplier" },
      {
        name: "description",
        content:
          "Model high-convexity crypto options boost with non-linear payout multipliers in signature godcandle light rainbow style.",
      },
    ],
  }),
  component: BoostPage,
});

type Underlying = "BTC" | "ETH" | "SOL";

const DEFAULT_SPOTS: Record<Underlying, number> = {
  BTC: 68420.5,
  ETH: 2540.2,
  SOL: 182.4,
};

export function BoostPage() {
  const t = useTrading();
  const [underlying, setUnderlying] = useState<Underlying>("BTC");
  const [amount, setAmount] = useState(10_000);
  const [days, setDays] = useState(30);
  const [boostMultiplier, setBoostMultiplier] = useState(10);

  const spot = t?.feeds?.[underlying]?.price ?? DEFAULT_SPOTS[underlying];
  const [targetPrice, setTargetPrice] = useState(Math.round(spot * 1.15));

  useEffect(() => {
    setTargetPrice(Math.round(spot * 1.15));
  }, [underlying]);

  const targetMove = spot > 0 ? ((targetPrice - spot) / spot) * 100 : 0;
  const rawRoiPct = Math.max(-100, targetMove * boostMultiplier);
  const payout = Math.round(amount * (rawRoiPct / 100));
  const isUp = targetPrice >= spot;

  const minTarget = Math.round(spot * 0.7);
  const maxTarget = Math.round(spot * 1.6);

  const handleLockInBoost = () => {
    if (t?.open) {
      t.open(underlying, isUp ? "LONG" : "SHORT", Math.min(amount, 500), Math.min(boostMultiplier * 10, 1000));
    }
    toast.success(`Convexity Boost Multiplier Active!`, {
      description: `${underlying} ${boostMultiplier}× Boost · Target $${targetPrice.toLocaleString()} (${targetMove >= 0 ? "+" : ""}${targetMove.toFixed(1)}%). Projected Payout: $${(amount + payout).toLocaleString()}`,
    });
  };

  return (
    <main className="relative page-content max-w-7xl mx-auto space-y-6 font-mono text-xs text-foreground">
      {/* Top Banner with Iridescent Rainbow Accent */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-white p-6 shadow-sm">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#CDC3F0] via-[#FFDAC8] to-[#A0D4CA]" />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-gradient-to-r from-[#CDC3F0]/50 to-[#FFDAC8]/50 text-foreground">
                <Zap className="size-4 text-foreground" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-foreground font-sans">
                Asymmetric Convexity Multiplier
              </h1>
              <span className="rounded-full bg-gradient-to-r from-[#CDC3F0]/40 via-[#FFDAC8]/40 to-[#A0D4CA]/40 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-foreground border border-border">
                High Convexity
              </span>
            </div>
            <p className="text-muted-foreground text-xs font-sans">
              Non-linear payout boost curves with up to 100× asymmetric multipliers directly on HyperEVM.
            </p>
          </div>

          {/* Asset Selector */}
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
        {/* Left Column: Boost Config */}
        <div className="lg:col-span-4 space-y-5">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-white p-5 shadow-sm space-y-5">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#CDC3F0] to-[#A0D4CA] opacity-70" />

            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="font-bold text-foreground tracking-wide">CONVEXITY PARAMETERS</span>
              <span className="tabular text-xs font-bold px-2 py-0.5 rounded-full bg-[#E3F8EC] text-[#06964A]">
                {boostMultiplier}× Multiplier
              </span>
            </div>

            {/* Boost Multiplier Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-muted-foreground text-[11px]">
                <span>CONVEXITY MULTIPLIER</span>
                <span className="text-foreground font-bold tabular text-base">{boostMultiplier}×</span>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {[2, 5, 10, 20, 50, 100].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setBoostMultiplier(m)}
                    className={`pill h-7 text-[11px] transition-all ${
                      boostMultiplier === m
                        ? "pill-ink font-bold shadow-sm"
                        : "border border-border bg-[#F6F6F4] text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {m}×
                  </button>
                ))}
              </div>
            </div>

            {/* Target Price */}
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

            <Button
              type="button"
              onClick={handleLockInBoost}
              className="pill pill-ink w-full h-11 text-xs font-bold tracking-wide shadow-sm"
            >
              Lock in {boostMultiplier}× Convexity Boost →
            </Button>
          </div>
        </div>

        {/* Center / Right: Convex Payout Orb & Matrix */}
        <div className="lg:col-span-8 space-y-5">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-white to-[#F6F6F4] p-6 shadow-sm">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#CDC3F0] via-[#FFDAC8] to-[#A0D4CA]" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Orb */}
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white border border-border relative overflow-hidden shadow-sm">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#CDC3F0]/30 via-[#FFDAC8]/25 to-[#A0D4CA]/30 blur-2xl opacity-75" />

                <div className="relative z-10 size-44 rounded-full flex flex-col items-center justify-center text-center p-4 border border-border bg-white/80 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                    Convex Return
                  </span>
                  <span className={`tabular text-3xl font-bold tracking-tight my-1 ${rawRoiPct >= 0 ? "text-[#06964A]" : "text-[#FF3B30]"}`}>
                    {rawRoiPct >= 0 ? "+" : ""}{rawRoiPct.toFixed(1)}%
                  </span>
                  <span className="tabular text-xs font-semibold text-foreground">
                    ${(amount + payout).toLocaleString()}
                  </span>
                  <span className="text-[9px] text-muted-foreground mt-1">
                    {boostMultiplier}× Boost Factor
                  </span>
                </div>
              </div>

              {/* Convexity Stats */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground font-sans">Asymmetric Non-Linear Payout</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Modeled for outlier market moves with zero counterparty slippage.
                  </p>
                </div>

                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between py-1.5 border-b border-border">
                    <span className="text-muted-foreground">Spot Reference</span>
                    <span className="font-bold tabular text-foreground">${spot.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border">
                    <span className="text-muted-foreground">Target Price</span>
                    <span className="font-bold tabular text-foreground">${targetPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border">
                    <span className="text-muted-foreground">Price Move</span>
                    <span className="font-bold tabular text-[#06964A]">+{targetMove.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border">
                    <span className="text-muted-foreground">Boosted Net Payout</span>
                    <span className="font-bold tabular text-[#06964A]">+${payout.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-muted-foreground">FIFO Settlement</span>
                    <span className="font-bold text-[#06964A]">100% Guaranteed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Convex Multiplier Ladder */}
          <div className="relative overflow-hidden rounded-2xl border border-border bg-white p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-foreground text-xs tracking-wider uppercase">
              Payout at Alternate Boost Multipliers (+{targetMove.toFixed(1)}% Move)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {[2, 5, 10, 25].map((m) => {
                const r = targetMove * m;
                const p = Math.round(amount * (r / 100));
                return (
                  <div key={m} className="p-3 rounded-xl border border-border bg-[#F6F6F4] space-y-1">
                    <div className="text-[10px] text-muted-foreground font-semibold">
                      {m}× Multiplier
                    </div>
                    <div className="text-sm font-bold text-foreground tabular">
                      ${(amount + p).toLocaleString()}
                    </div>
                    <div className="text-[11px] font-bold text-[#06964A] tabular">
                      +${p.toLocaleString()} (+{r.toFixed(0)}%)
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
