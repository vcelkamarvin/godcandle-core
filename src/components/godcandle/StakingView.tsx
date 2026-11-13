import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChartCanvas } from "./ChartCanvas";
import { Metric, Segments } from "./Metric";
import { revenueSeries, supplySeries, rewardCurve } from "@/lib/design-data";
import { useHyperliquidAnalytics } from "@/lib/hyperliquid";

export function StakingView({ full = false }: { full?: boolean }) {
  const [mode, setMode] = useState("Stake");
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState("4h");
  const [supplyPeriod, setSupplyPeriod] = useState("1m");
  const { solvency } = useHyperliquidAnalytics();

  return (
    <main className="page-content">
      <h1 className="sr-only">{full ? "CANDLE" : "Staking"}</h1>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_280px]">
        {/* Claimable Rewards */}
        <section className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-mono">Claimable rewards</h2>
            <span className="rounded-full bg-[#F0F2F5] px-2 py-0.5 text-[10px] font-semibold text-[#0A0A0A]">Paid in USDC</span>
          </div>
          <p className="tabular my-3 text-3xl font-bold tracking-tight text-foreground font-mono">$0.00</p>
          <button
            type="button"
            className="h-9 w-full text-xs font-semibold rounded-xl bg-[#0A0A0A] hover:bg-[#1A1A1A] text-white active:scale-[0.98] transition-all cursor-pointer shadow-xs flex items-center justify-center"
            onClick={() => toast("No connected staking wallet or claimable rewards.")}
          >
            Claim USDC
          </button>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              ["Rewards claimed", "$0.00"],
              ["Your stake share", "0%"],
              ["Staker rewards", "—"],
            ].map(([l, v]) => (
              <div key={l} className="min-w-0 rounded-xl bg-[#F8F8F7] p-2.5">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground font-mono truncate">{l}</p>
                <p className="tabular mt-0.5 text-xs font-semibold font-mono text-foreground">{v}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Stake / Unstake Form */}
        <section className="rounded-2xl border border-black/[0.06] p-4 bg-white shadow-xs">
          <div className="flex justify-between items-center">
            <Segments items={["Stake", "Unstake"]} value={mode} onChange={setMode} />
            <span className="text-[10px] text-muted-foreground font-mono">Wallet not connected</span>
          </div>
          <div className="mt-2.5 flex items-center rounded-xl border border-black/[0.06] px-3 bg-[#F8F8F7] focus-within:bg-white focus-within:ring-2 focus-within:ring-black/10">
            <input
              aria-label="CANDLE amount"
              id="candle-amount"
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="tabular h-10 w-full min-w-0 bg-transparent text-lg font-semibold outline-none"
            />
            <button disabled type="button" className="rounded-md bg-[#E4E7EC] text-[10px] font-semibold text-[#737887] h-6 px-2 cursor-not-allowed">
              MAX
            </button>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {["25%", "50%", "75%", "MAX"].map((n) => (
              <button key={n} disabled type="button" className="h-7 rounded-lg bg-[#F0F2F5] px-1 text-[10px] font-semibold text-[#737887] cursor-not-allowed">
                {n}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="mt-3 h-9 w-full text-xs font-semibold rounded-xl bg-[#0A0A0A] hover:bg-[#1A1A1A] text-white active:scale-[0.98] transition-all cursor-pointer shadow-xs flex items-center justify-center"
            onClick={() => toast("Staking is not connected. No tokens will be transferred.")}
          >
            {mode} CANDLE
          </button>
          <p className="mt-2 text-[10px] text-muted-foreground text-center">No connected wallet · 0 CANDLE staked</p>
        </section>

        {/* Distribution Details */}
        <section className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-mono">Distribution</p>
          <div className="mt-2 flex justify-between items-baseline">
            <span className="text-xs text-muted-foreground">Pending rewards:</span>
            <span className="tabular text-lg font-bold text-foreground font-mono">$0.00</span>
          </div>
          <div className="mt-1 flex justify-between items-baseline">
            <span className="text-xs text-muted-foreground">Latest distribution:</span>
            <span className="text-xs font-semibold text-foreground">—</span>
          </div>
          <p className="mt-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-mono">Reward split</p>
          <div className="mt-1.5 flex h-2 overflow-hidden rounded-full bg-[#F0F2F5]">
            <span className="w-[3%] bg-chart-peach" title="Treasury 3%" />
            <span className="w-[7%] bg-chart-lavender" title="Points 7%" />
            <span className="w-[90%] bg-foreground" title="Stakers 90%" />
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground flex justify-between font-mono">
            <span>Treasury (3%)</span>
            <span>Points (7%)</span>
            <span className="font-semibold text-foreground">Stakers (90%)</span>
          </p>
        </section>
      </div>

      {/* Revenue & Reward Curve */}
      <div className="mt-3 grid gap-3 lg:grid-cols-[1.5fr_1fr]">
        <section className="min-w-0 rounded-2xl border border-black/[0.06] p-3.5 bg-white shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[11px] font-semibold uppercase font-mono tracking-wider text-muted-foreground">
              Staking revenue <span className="text-foreground">· USDC / hour</span>
            </h2>
            <Segments items={["15m", "1h", "4h", "1d"]} value={period} onChange={setPeriod} />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric
              label="24h revenue"
              value={`$${((solvency.feeWaterfall.stakingYieldAndBurn) / 1000).toFixed(1)}K`}
            />
            <Metric
              label="7d revenue"
              value={`$${((solvency.feeWaterfall.stakingYieldAndBurn * 7) / 1000).toFixed(0)}K`}
            />
            <Metric
              label="Annual APR"
              value={`${(((solvency.feeWaterfall.stakingYieldAndBurn * 365) / Math.max(1, solvency.tvlUsd)) * 100).toFixed(1)}%`}
              tone="text-[#00D964]"
            />
            <Metric
              label="Last hour"
              value={`$${Math.round(solvency.feeWaterfall.stakingYieldAndBurn / 24).toLocaleString()}`}
            />
          </div>
          <div className="mt-2">
            <ChartCanvas height={130} kind="bars" values={period === "1h" ? revenueSeries.slice(16, 32) : revenueSeries} />
          </div>
        </section>

        <section className="min-w-0 rounded-2xl border border-black/[0.06] p-3.5 bg-white shadow-xs">
          <h2 className="text-[11px] font-semibold uppercase font-mono tracking-wider text-muted-foreground">CANDLE reward curve</h2>
          <p className="mt-0.5 text-[10px] text-muted-foreground font-mono">Minted per $1 realized loss</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Metric label="Your rate" value="10.0 / $1" />
            <Metric label="House LP" value={`$${(solvency.tvlUsd / 1000000).toFixed(2)}M`} />
          </div>
          <div className="mt-2">
            <ChartCanvas height={130} kind="curve" values={rewardCurve} />
          </div>
        </section>
      </div>

      {/* Full CANDLE view (/candle) */}
      {full && (
        <>
          <div className="mt-3 grid gap-3 lg:grid-cols-[1.5fr_1fr]">
            <section className="min-w-0 rounded-2xl border border-black/[0.06] p-3.5 bg-white shadow-xs">
              <div className="flex flex-wrap justify-between gap-2">
                <h2 className="text-[11px] font-semibold uppercase font-mono tracking-wider text-muted-foreground">Total CANDLE supply</h2>
                <Segments items={["1d", "1w", "1m", "All"]} value={supplyPeriod} onChange={setSupplyPeriod} />
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <Metric label="Total supply" value="9.08B" />
                <Metric label="Staked" value="9.02B" tone="text-[#00D964]" />
                <Metric label="Stake ratio" value="99.3%" tone="text-[#00D964]" />
              </div>
              <div className="mt-2">
                <ChartCanvas height={130} values={supplyPeriod === "1d" ? supplySeries.slice(50) : supplySeries} />
              </div>
            </section>

            <section className="min-w-0 rounded-2xl border border-black/[0.06] p-3.5 bg-white shadow-xs">
              <h2 className="text-[11px] font-semibold uppercase font-mono tracking-wider text-muted-foreground">Total staking rewards</h2>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Metric label="Total paid" value="$60.98M" tone="text-[#00D964]" />
                <Metric label="Per 1M CANDLE" value="$6.77" />
              </div>
              <div className="mt-2">
                <ChartCanvas height={130} values={supplySeries.map((n) => n * n)} />
              </div>
            </section>
          </div>

          <section className="mt-3 border-t border-black/[0.06] pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-bold tracking-tight text-foreground">CANDLE Architecture</h2>
              <Link
                to="/docs"
                className="text-xs font-semibold text-foreground hover:underline flex items-center gap-1"
              >
                <span>Read Protocol Specs &amp; Tokenomics</span>
                <span className="font-mono">→</span>
              </Link>
            </div>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              {[
                ["Stake", "Share in continuous FIFO staking distributions."],
                ["Rewards", "USDC distributions to stakers funded by net protocol settlements."],
                ["Supply", "Deterministic emission curve tied to trading volume."],
              ].map(([h, p]) => (
                <div key={h} className="rounded-xl border border-black/[0.06] p-3 bg-white shadow-xs">
                  <h3 className="text-xs font-semibold text-foreground">{h}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{p}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}