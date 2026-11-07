import React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Zap, Target, TrendingUp, SlidersHorizontal, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/options")({
  head: () => ({
    meta: [
      { title: "godcandle — Options & Convex Studios" },
      {
        name: "description",
        content: "Institutional synthetic options, Goal Price Target Studio, and Asymmetric Boost Multipliers.",
      },
    ],
  }),
  component: OptionsLandingPage,
});

function OptionsLandingPage() {
  return (
    <main className="page-content max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Header */}
      <div className="space-y-2 border-b border-border pb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs font-mono">
          <span className="size-2 rounded-full bg-[#00D964] animate-pulse" />
          <span>HYPEREVM SYNTHETIC OPTIONS</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-sans">
          Options &amp; Convexity Studios
        </h1>
        <p className="text-sm text-muted-foreground font-sans max-w-2xl">
          Non-linear payout modeling with zero counterparty risk and pure FIFO House Pool settlement.
        </p>
      </div>

      {/* 2 Flagship Studios: Goal and Boost */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Goal Card */}
        <Link
          to="/goal"
          className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-white p-6 sm:p-8 transition-all hover:border-foreground/40 hover:shadow-lg"
        >
          <div className="space-y-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-[#E3F8EC] text-[#06964A]">
              <Target className="size-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Target Goal Studio</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Model target price milestones, customized profit scenarios, and capital trajectories for BTC, ETH, and SOL.
              </p>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-[#06964A] font-mono group-hover:translate-x-1 transition-transform">
            <span>Launch Goal Studio</span>
            <ArrowUpRight className="size-4" />
          </div>
        </Link>

        {/* Boost Card */}
        <Link
          to="/boost"
          className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-white p-6 sm:p-8 transition-all hover:border-foreground/40 hover:shadow-lg"
        >
          <div className="space-y-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-[#FFF4E5] text-[#D97706]">
              <Zap className="size-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Convex Boost Multiplier</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Asymmetric leverage boosters with non-linear payout curves up to 25× for outlier volatility breakouts.
              </p>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-[#D97706] font-mono group-hover:translate-x-1 transition-transform">
            <span>Launch Boost Studio</span>
            <ArrowUpRight className="size-4" />
          </div>
        </Link>
      </div>
    </main>
  );
}
