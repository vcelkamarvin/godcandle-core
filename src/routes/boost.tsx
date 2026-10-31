import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Zap,
  Target,
  Share2,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  ArrowUpRight,
  Layers,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useTrading } from "@/components/godcandle/TradingProvider";
import { ShareModal } from "@/components/godcandle/ShareModal";
import { ChartCanvas } from "@/components/godcandle/ChartCanvas";
import { fmtUsd, fmtSigned, type ClosedTrade } from "@/lib/engine";

export const Route = createFileRoute("/boost")({
  head: () => ({
    meta: [
      { title: "godcandle — Convexity Boost Multiplier" },
      {
        name: "description",
        content:
          "Model high-convexity crypto options boost with non-linear payout multipliers in signature godcandle light rainbow style.",
      },
      { property: "og:title", content: "godcandle — Convexity Boost Multiplier" },
      {
        property: "og:description",
        content:
          "Model non-linear payout boost curves with up to 100× asymmetric multipliers directly on HyperEVM.",
      },
    ],
  }),
  component: BoostPage,
});

type Underlying = "BTC" | "ETH" | "SOL" | "HYPE";

const DEFAULT_SPOTS: Record<Underlying, number> = {
  BTC: 68420.5,
  ETH: 2540.2,
  SOL: 182.4,
  HYPE: 42.8,
};

export function BoostPage() {
  const t = useTrading();
  const [underlying, setUnderlying] = useState<Underlying>("BTC");
  const [amount, setAmount] = useState(10_000);
  const [days, setDays] = useState(30);
  const [boostMultiplier, setBoostMultiplier] = useState(10);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [boostLocked, setBoostLocked] = useState(false);

  const spot = t?.feeds?.[underlying]?.price ?? DEFAULT_SPOTS[underlying];
  const [targetPrice, setTargetPrice] = useState(Math.round(spot * 1.15));

  useEffect(() => {
    setTargetPrice(Math.round(spot * 1.15));
  }, [underlying, spot]);

  const targetMove = spot > 0 ? ((targetPrice - spot) / spot) * 100 : 0;
  const isUp = targetPrice >= spot;
  const rawRoiPct = Math.max(-100, targetMove * boostMultiplier);
  const payout = Math.round(amount * (rawRoiPct / 100));

  const minTarget = Math.round(spot * 0.7);
  const maxTarget = Math.round(spot * 1.6);

  const trajectoryValues = useMemo(() => {
    const points = 30;
    const vals: number[] = [];
    for (let i = 0; i <= points; i++) {
      const progress = i / points;
      const curPrice = spot + (targetPrice - spot) * Math.pow(progress, 1.4);
      const movePct = spot > 0 ? ((curPrice - spot) / spot) * 100 : 0;
      const simRoi = movePct * boostMultiplier;
      vals.push(amount * (1 + simRoi / 100));
    }
    return vals;
  }, [spot, targetPrice, amount, boostMultiplier]);

  const handleLockInBoost = () => {
    if (t?.open) {
      t.open(underlying, isUp ? "LONG" : "SHORT", Math.min(amount, 500), Math.min(boostMultiplier * 10, 50));
    }
    setBoostLocked(true);
    toast.success(`${boostMultiplier}× Convexity Boost Active!`, {
      description: `${underlying} ${boostMultiplier}× Boost · Target $${targetPrice.toLocaleString()} (${targetMove >= 0 ? "+" : ""}${targetMove.toFixed(1)}%). Modeled Payout: $${(amount + payout).toLocaleString()}`,
    });
    setTimeout(() => setBoostLocked(false), 2400);
  };

  const shareTradeData: ClosedTrade = useMemo(
    () => ({
      id: `boost-${Date.now()}`,
      market: underlying,
      direction: isUp ? "LONG" : "SHORT",
      stake: amount,
      leverage: Math.round(boostMultiplier * 5),
      entryPrice: spot,
      exitPrice: targetPrice,
      openedAt: Date.now() - days * 86400000,
      closedAt: Date.now(),
      pnl: payout,
      fees: amount * 0.001,
      reason: "take_profit",
    }),
    [underlying, isUp, amount, boostMultiplier, spot, targetPrice, days, payout]
  );

  return (
    <main className="relative page-content max-w-7xl mx-auto space-y-5 font-sans text-xs text-foreground">
      {/* Top Banner with Iridescent Rainbow Accent */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-white p-5 sm:p-6 shadow-xs">
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
              <span className="rounded-full bg-gradient-to-r from-[#CDC3F0]/40 via-[#FFDAC8]/40 to-[#A0D4CA]/40 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-foreground border border-border">
                High Convexity
              </span>
            </div>
            <p className="text-muted-foreground text-xs font-sans">
              Non-linear payout boost curves with up to 100× asymmetric multipliers directly on HyperEVM.
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
                  <span>Goal Studio</span>
                </span>
              </Link>
              <Link
                to="/boost"
                className="pill pill-ink h-7.5 px-3.5 text-xs font-semibold shadow-xs"
              >
                <span className="flex items-center gap-1.5">
                  <Zap className="size-3 text-[#06964A]" />
                  <span>Convexity Boost</span>
                </span>
              </Link>
            </div>

            {/* Asset Selector */}
            <div className="flex items-center gap-1 rounded-full bg-[#F6F6F4] p-1 border border-border">
              {(["BTC", "ETH", "SOL", "HYPE"] as const).map((asset) => (
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

      {/* Main Grid: Left Controls (4 Cols) | Right Visual Orb & Breakdown (8 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Boost Controls */}
        <div className="lg:col-span-4 rounded-3xl border border-border bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <span className="font-bold tracking-wider text-xs uppercase flex items-center gap-1.5">
              <Zap className="size-3.5 text-[#06964A]" />
              Convexity Controls
            </span>
            <span className="text-[10px] font-mono font-bold text-[#06964A] bg-[#E3F8EC] px-2 py-0.5 rounded-full border border-[#06964A]/20">
              {boostMultiplier}× Active Factor
            </span>
          </div>

          {/* Current Spot Reference */}
          <div className="p-3 rounded-2xl bg-[#F6F6F4] border border-border flex justify-between items-center">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                {underlying} Spot Reference
              </span>
              <span className="text-sm font-bold tabular text-foreground font-mono">
                ${spot.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <span className="text-[10px] text-[#06964A] font-semibold flex items-center gap-1">
              <ShieldCheck className="size-3" />
              Live Mark
            </span>
          </div>

          {/* Boost Multiplier Selector */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-muted-foreground font-semibold">BOOST MULTIPLIER</span>
              <span className="text-foreground font-bold tabular font-mono text-sm">
                {boostMultiplier}× Factor
              </span>
            </div>
            <div className="grid grid-cols-6 gap-1">
              {[2, 5, 10, 25, 50, 100].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setBoostMultiplier(m)}
                  className={`pill h-7 text-[11px] font-mono transition-all cursor-pointer ${
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

          {/* Target Price */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-muted-foreground font-semibold">TARGET PRICE</span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="text-foreground font-bold text-sm tabular">
                  ${targetPrice.toLocaleString()}
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    targetMove >= 0
                      ? "bg-[#E3F8EC] text-[#06964A]"
                      : "bg-[#FFECEA] text-[#FF3B30]"
                  }`}
                >
                  {targetMove >= 0 ? "+" : ""}
                  {targetMove.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="pt-1">
              <input
                type="range"
                min={minTarget}
                max={maxTarget}
                step={Math.max(1, Math.round(spot * 0.005))}
                value={targetPrice}
                onChange={(e) => setTargetPrice(Number(e.target.value))}
                className="w-full accent-foreground bg-[#E6E6E3] h-2 appearance-none cursor-pointer rounded-full"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
                <span>${minTarget.toLocaleString()}</span>
                <span>Spot: ${Math.round(spot).toLocaleString()}</span>
                <span>${maxTarget.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Quick Target Move Chips */}
          <div className="space-y-1.5 pt-2 border-t border-border">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block">
              Quick Target Expansion
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {[5, 10, 20, 40].map((pct) => {
                const target = Math.round(spot * (1 + pct / 100));
                return (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setTargetPrice(target)}
                    className="p-2 rounded-xl border border-border bg-[#F6F6F4] text-center hover:bg-white hover:border-foreground/30 transition-all cursor-pointer"
                  >
                    <div className="text-[10px] font-bold text-[#06964A]">+{pct}%</div>
                    <div className="text-[9px] font-mono text-muted-foreground mt-0.5">
                      ${target.toLocaleString()}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Capital Allocation */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-muted-foreground font-semibold">CAPITAL ALLOCATION</span>
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

          {/* Timeline */}
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
                  Lock In {boostMultiplier}× Convexity Boost →
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
                <Link to="/">
                  Terminal <ArrowUpRight className="ml-1 size-3" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Center / Right: Convex Payout Orb & Matrix */}
        <div className="lg:col-span-8 space-y-5">
          {/* Holographic Showcase */}
          <div className="relative overflow-hidden rounded-3xl border border-border bg-white p-5 sm:p-6 shadow-xs">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#CDC3F0] via-[#FFDAC8] to-[#A0D4CA]" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Iridescent Return Orb */}
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[#FAFAF8] border border-border relative overflow-hidden shadow-2xs">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#CDC3F0]/40 via-[#FFDAC8]/30 to-[#A0D4CA]/35 blur-2xl opacity-80" />

                <div className="relative z-10 size-44 rounded-full flex flex-col items-center justify-center text-center p-4 border border-border bg-white/90 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold font-sans">
                    Convex Return
                  </span>
                  <span
                    className={`font-mono tabular text-3xl font-bold tracking-tight my-1 ${
                      rawRoiPct >= 0 ? "text-[#06964A]" : "text-[#FF3B30]"
                    }`}
                  >
                    {rawRoiPct >= 0 ? "+" : ""}
                    {rawRoiPct.toFixed(1)}%
                  </span>
                  <span className="font-mono tabular text-xs font-semibold text-foreground">
                    ${(amount + payout).toLocaleString()}
                  </span>
                  <span className="text-[9px] text-muted-foreground mt-1 font-sans">
                    {boostMultiplier}× Boost Factor
                  </span>
                </div>
              </div>

              {/* Convexity Stats */}
              <div className="space-y-3 font-sans">
                <div>
                  <h3 className="text-sm font-bold text-foreground font-sans">
                    Asymmetric Non-Linear Payout
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Modeled for outlier market moves with zero counterparty slippage.
                  </p>
                </div>

                <div className="space-y-2 text-[11px] font-mono">
                  <div className="flex justify-between py-1.5 border-b border-border">
                    <span className="text-muted-foreground font-sans">Spot Reference</span>
                    <span className="font-bold tabular text-foreground">
                      ${spot.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border">
                    <span className="text-muted-foreground font-sans">Target Price</span>
                    <span className="font-bold tabular text-foreground">
                      ${targetPrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border">
                    <span className="text-muted-foreground font-sans">Underlying Move</span>
                    <span
                      className={`font-bold tabular ${
                        targetMove >= 0 ? "text-[#06964A]" : "text-[#FF3B30]"
                      }`}
                    >
                      {targetMove >= 0 ? "+" : ""}
                      {targetMove.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border">
                    <span className="text-muted-foreground font-sans">Boosted Net Payout</span>
                    <span
                      className={`font-bold tabular ${
                        payout >= 0 ? "text-[#06964A]" : "text-[#FF3B30]"
                      }`}
                    >
                      {payout >= 0 ? "+" : ""}
                      ${payout.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-muted-foreground font-sans">FIFO Settlement</span>
                    <span className="font-bold text-[#06964A] font-sans">
                      100% Solvent · HyperEVM
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modeled Non-Linear Curve */}
          <div className="relative overflow-hidden rounded-3xl border border-border bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="size-3.5 text-[#06964A]" />
                Non-Linear Payoff Multiplier Curve
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {boostMultiplier}× Convex Curve
              </span>
            </div>
            <div className="pt-1">
              <ChartCanvas height={140} kind="curve" values={trajectoryValues} />
            </div>
          </div>

          {/* Convex Multiplier Ladder */}
          <div className="relative overflow-hidden rounded-3xl border border-border bg-white p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-foreground text-xs tracking-wider uppercase">
              Payout at Alternate Boost Multipliers (+{targetMove.toFixed(1)}% Move)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {[2, 5, 10, 25].map((m) => {
                const r = targetMove * m;
                const p = Math.round(amount * (r / 100));
                return (
                  <div
                    key={m}
                    className="p-3 rounded-2xl border border-border bg-[#F6F6F4] space-y-1 transition-all hover:bg-white hover:border-foreground/30 shadow-2xs"
                  >
                    <div className="text-[10px] text-muted-foreground font-semibold font-sans">
                      {m}× Multiplier
                    </div>
                    <div className="text-sm font-bold text-foreground font-mono tabular">
                      ${(amount + p).toLocaleString()}
                    </div>
                    <div className="text-[11px] font-bold text-[#06964A] font-mono tabular">
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
