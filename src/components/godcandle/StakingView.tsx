import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChartCanvas } from "./ChartCanvas";
import { Metric, Segments } from "./Metric";
import { revenueSeries, supplySeries, rewardCurve } from "@/lib/design-data";

export function StakingView({ full = false }: { full?: boolean }) {
  const [mode, setMode] = useState("Stake");
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState("4h");
  const [supplyPeriod, setSupplyPeriod] = useState("1m");

  return (
    <main className="page-content">
      <h1 className="sr-only">{full ? "CANDLE" : "Staking"}</h1>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_280px]">
        {/* Claimable Rewards */}
        <section className="reward-panel p-4">
          <div className="flex items-center justify-between">
            <h2 className="data-label text-foreground">Claimable rewards</h2>
            <span className="pill bg-card px-2 py-0.5 text-[9px] font-semibold">Paid in USDC</span>
          </div>
          <p className="tabular my-3 text-3xl font-semibold">$0.00</p>
          <Button
            variant="terminal"
            className="pill pill-ink h-9 w-full text-xs font-semibold"
            onClick={() => toast("No connected staking wallet or claimable rewards.")}
          >
            Claim USDC
          </Button>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              ["Rewards claimed", "$0.00"],
              ["Your stake share", "0%"],
              ["Staker rewards", "—"],
            ].map(([l, v]) => (
              <div key={l} className="min-w-0 rounded-xl bg-card p-2">
                <p className="data-label text-[8px]">{l}</p>
                <p className="tabular mt-0.5 text-xs font-semibold">{v}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Stake / Unstake Form */}
        <section className="rounded-2xl border p-4 bg-white">
          <div className="flex justify-between items-center">
            <Segments items={["Stake", "Unstake"]} value={mode} onChange={setMode} />
            <span className="text-[10px] text-muted-foreground font-mono">Wallet not connected</span>
          </div>
          <div className="mt-2.5 flex items-center rounded-xl border border-foreground/30 px-3 bg-[#F8F8F7]">
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
            <Button disabled variant="terminal" className="pill bg-secondary text-[9px] h-6 px-2">
              MAX
            </Button>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {["25%", "50%", "75%", "MAX"].map((n) => (
              <Button key={n} disabled variant="terminal" className="h-7 rounded-lg bg-secondary px-1 text-[10px]">
                {n}
              </Button>
            ))}
          </div>
          <Button
            variant="terminal"
            className="pill pill-ink mt-3 h-9 w-full text-xs font-semibold"
            onClick={() => toast("Staking is not connected. No tokens will be transferred.")}
          >
            {mode} CANDLE
          </Button>
          <p className="mt-2 text-[10px] text-muted-foreground text-center">No connected wallet · 0 CANDLE staked</p>
        </section>

        {/* Distribution Details */}
        <section className="rounded-2xl bg-secondary p-4">
          <p className="data-label">Distribution</p>
          <div className="mt-2 flex justify-between items-baseline">
            <span className="text-xs text-muted-foreground">Pending rewards:</span>
            <span className="tabular text-lg font-semibold text-foreground">$0.00</span>
          </div>
          <div className="mt-1 flex justify-between items-baseline">
            <span className="text-xs text-muted-foreground">Latest distribution:</span>
            <span className="text-xs font-semibold text-foreground">—</span>
          </div>
          <p className="mt-3 data-label">Reward split</p>
          <div className="mt-1.5 flex h-2 overflow-hidden rounded-full">
            <span className="w-[3%] bg-chart-peach" title="Treasury 3%" />
            <span className="w-[7%] bg-chart-lavender" title="Points 7%" />
            <span className="w-[90%] bg-foreground" title="Stakers 90%" />
          </div>
          <p className="mt-1.5 text-[9px] text-muted-foreground flex justify-between">
            <span>Treasury (3%)</span>
            <span>Points (7%)</span>
            <span className="font-semibold text-foreground">Stakers (90%)</span>
          </p>
        </section>
      </div>

      {/* Revenue & Reward Curve */}
      <div className="mt-3 grid gap-3 lg:grid-cols-[1.5fr_1fr]">
        <section className="min-w-0 rounded-2xl border p-3.5 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xs font-semibold uppercase font-mono text-muted-foreground">
              Staking revenue <span className="text-foreground">· USDC / hour</span>
            </h2>
            <Segments items={["15m", "1h", "4h", "1d"]} value={period} onChange={setPeriod} />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric label="24h revenue" value="$41.2K" />
            <Metric label="7d revenue" value="$288K" />
            <Metric label="Annual APR" value="12.4%" tone="text-gain" />
            <Metric label="Last hour" value="$1,371" />
          </div>
          <div className="mt-2">
            <ChartCanvas height={130} kind="bars" values={period === "1h" ? revenueSeries.slice(16, 32) : revenueSeries} />
          </div>
        </section>

        <section className="min-w-0 rounded-2xl border p-3.5 bg-white">
          <h2 className="text-xs font-semibold uppercase font-mono text-muted-foreground">CANDLE reward curve</h2>
          <p className="mt-0.5 data-label">Minted per $1 realized loss</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Metric label="Your rate" value="10.0 / $1" />
            <Metric label="House LP" value="$4.96M" />
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
            <section className="min-w-0 rounded-2xl border p-3.5 bg-white">
              <div className="flex flex-wrap justify-between gap-2">
                <h2 className="text-xs font-semibold uppercase font-mono text-muted-foreground">Total CANDLE supply</h2>
                <Segments items={["1d", "1w", "1m", "All"]} value={supplyPeriod} onChange={setSupplyPeriod} />
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <Metric label="Total supply" value="9.08B" />
                <Metric label="Staked" value="9.02B" tone="text-gain" />
                <Metric label="Stake ratio" value="99.3%" tone="text-gain" />
              </div>
              <div className="mt-2">
                <ChartCanvas height={130} values={supplyPeriod === "1d" ? supplySeries.slice(50) : supplySeries} />
              </div>
            </section>

            <section className="min-w-0 rounded-2xl border p-3.5 bg-white">
              <h2 className="text-xs font-semibold uppercase font-mono text-muted-foreground">Total staking rewards</h2>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Metric label="Total paid" value="$60.98M" tone="text-gain" />
                <Metric label="Per 1M CANDLE" value="$6.77" />
              </div>
              <div className="mt-2">
                <ChartCanvas height={130} values={supplySeries.map((n) => n * n)} />
              </div>
            </section>
          </div>

          <section className="mt-3 border-t border-border pt-4">
            <h2 className="text-base font-semibold">CANDLE Architecture</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              {[
                ["Stake", "Share in continuous FIFO staking distributions."],
                ["Rewards", "USDC distributions to stakers funded by net protocol settlements."],
                ["Supply", "Deterministic emission curve tied to trading volume."],
              ].map(([h, p]) => (
                <div key={h} className="rounded-xl border p-3 bg-white">
                  <h3 className="text-xs font-semibold">{h}</h3>
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