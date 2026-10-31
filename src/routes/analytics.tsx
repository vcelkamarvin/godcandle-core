import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MarketBar } from "@/components/godcandle/MarketBar";
import { ChartCanvas } from "@/components/godcandle/ChartCanvas";
import { useTrading } from "@/components/godcandle/TradingProvider";
import {
  useHyperliquidAnalytics,
  type MarketSymbol,
} from "@/lib/hyperliquid";
import { HousePoolSolvencyChart } from "@/components/analytics/HousePoolSolvencyChart";
import { CorridorDeviationChart } from "@/components/analytics/CorridorDeviationChart";
import { PerpsBreakdownChart } from "@/components/analytics/PerpsBreakdownChart";
import { FeeWaterfallChart } from "@/components/analytics/FeeWaterfallChart";
import { analysisSeries, revenueSeries } from "@/lib/design-data";
import { fmtUsd } from "@/lib/engine";
import { RefreshCw, ShieldCheck, Zap, Activity } from "lucide-react";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "godcandle — Protocol Analytics & Hyperliquid L1 Telemetry" },
      {
        name: "description",
        content:
          "Real-time House Pool solvency, mark-clamped corridor statistics, perps volume, and FIFO settlement depth.",
      },
      { property: "og:title", content: "godcandle — Protocol Analytics" },
      {
        property: "og:description",
        content:
          "Live Hyperliquid precompiles, House Pool reserves, and corridor telemetry.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnalyticsPage,
});

type AnalyticsTab =
  | "Solvency"
  | "Corridor"
  | "Perps"
  | "Waterfall"
  | "Heatmap";

function AnalyticsPage() {
  const [selectedMarket, setSelectedMarket] = useState<MarketSymbol>("BTC");
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("Solvency");
  const [heatmapPeriod, setHeatmapPeriod] = useState("1d");

  const t = useTrading();
  const livePrice = t.feeds[selectedMarket]?.price ?? 68400;

  // Real data integration from Hyperliquid feeds
  const {
    markets,
    totalVolume24h,
    totalPerpOiUsd,
    solvency,
    corridorStats,
    isLive,
    loading,
    lastUpdated,
    refresh,
  } = useHyperliquidAnalytics();

  const currentMarket = markets[selectedMarket] ?? markets.BTC;

  return (
    <main className="min-h-screen bg-[#F6F6F4] pb-16">
      {/* Top Market Bar */}
      <MarketBar
        market={selectedMarket}
        onSelect={setSelectedMarket}
        compact
      />

      <div className="page-content space-y-4 pt-3">
        {/* Header Ribbon & Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-hairline bg-white p-3.5 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <h1 className="text-base font-bold tracking-tight text-foreground">
                Protocol Analytics & Hyperliquid L1 Telemetry
              </h1>
              <span className="rounded-full bg-[#EFEFFC] px-2 py-0.5 text-[9px] font-mono font-bold text-[#5E5CE6]">
                MAINNET LIVE
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Atomic House Pool solvency, Mark-Clamped BBO corridor (±1.5 bps), and FIFO settlement payout queue.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-hairline bg-[#F8F8F7] px-2.5 py-1 text-[11px] font-mono text-muted-foreground">
              <Activity className="h-3 w-3 text-emerald-500" />
              <span>{isLive ? "Hyperliquid API Connected" : "Local Telemetry Feed"}</span>
              <span className="text-hairline">|</span>
              <span>{lastUpdated.toLocaleTimeString()}</span>
            </div>

            <button
              type="button"
              onClick={() => refresh()}
              disabled={loading}
              className="pill pill-ink flex h-7 items-center gap-1.5 px-3 text-[10px] font-semibold"
            >
              <RefreshCw className={`h-2.5 w-2.5 ${loading ? "animate-spin" : ""}`} />
              Sync
            </button>
          </div>
        </div>

        {/* 6 Core Live Protocol Metrics Strip */}
        <section aria-label="Key Protocol Metrics" className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {/* 1. TVL (House Pool Balance) */}
          <div className="rounded-2xl border border-hairline bg-white p-3.5 shadow-2xs transition-all hover:border-foreground/20">
            <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
              <span>HOUSE POOL TVL</span>
              <span className="rounded bg-[#EAF2F1] px-1 py-0.2 text-[9px] font-bold text-[#4A7C75]">
                {solvency.solvencyRatioPct}% SOLVENT
              </span>
            </div>
            <p className="tabular mt-1.5 text-lg font-bold text-foreground font-mono">
              ${fmtUsd(solvency.tvlUsd, 0)}
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Reserves: <strong className="text-foreground">${fmtUsd(solvency.liquidReservesUsd, 0)}</strong>
            </p>
          </div>

          {/* 2. 24h Volume across perps */}
          <div className="rounded-2xl border border-hairline bg-white p-3.5 shadow-2xs transition-all hover:border-foreground/20">
            <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
              <span>24H VOLUME (PERPS)</span>
              <Zap className="h-3 w-3 text-amber-500" />
            </div>
            <p className="tabular mt-1.5 text-lg font-bold text-foreground font-mono">
              ${fmtUsd(totalVolume24h, 0)}
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Across 6 core perps markets
            </p>
          </div>

          {/* 3. Cumulative Protocol Fees */}
          <div className="rounded-2xl border border-hairline bg-white p-3.5 shadow-2xs transition-all hover:border-foreground/20">
            <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
              <span>PROTOCOL FEES</span>
              <span className="text-[9px] text-gain font-semibold">+24h</span>
            </div>
            <p className="tabular mt-1.5 text-lg font-bold text-foreground font-mono">
              ${fmtUsd(solvency.cumulativeFeesAllTimeUsd, 0)}
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              24h Inflow: <strong className="text-foreground">${fmtUsd(solvency.cumulativeFees24hUsd, 0)}</strong>
            </p>
          </div>

          {/* 4. Active 1000x Open Interest */}
          <div className="rounded-2xl border border-hairline bg-white p-3.5 shadow-2xs transition-all hover:border-foreground/20">
            <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
              <span>1000X OPEN INTEREST</span>
              <span className="rounded bg-[#FFECEA] px-1 py-0.2 text-[9px] font-bold text-[#FF3B30]">
                MAX LEV
              </span>
            </div>
            <p className="tabular mt-1.5 text-lg font-bold text-foreground font-mono">
              ${fmtUsd(solvency.aggregateOi1000xUsd, 0)}
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Total Perps OI: <strong className="text-foreground">${fmtUsd(totalPerpOiUsd, 0)}</strong>
            </p>
          </div>

          {/* 5. FIFO Settlement Payout Depth */}
          <div className="rounded-2xl border border-hairline bg-white p-3.5 shadow-2xs transition-all hover:border-foreground/20">
            <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
              <span>FIFO PAYOUT QUEUE</span>
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
            </div>
            <p className="tabular mt-1.5 text-lg font-bold text-gain font-mono">
              ${fmtUsd(solvency.queueDepthUsd, 2)}
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Instant Payout: <strong className="text-gain">100% (0 Delay)</strong>
            </p>
          </div>

          {/* 6. Mark-Clamped BBO Corridor Compliance */}
          <div className="rounded-2xl border border-hairline bg-white p-3.5 shadow-2xs transition-all hover:border-foreground/20">
            <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
              <span>CORRIDOR LIMIT</span>
              <span className="rounded bg-[#EFEFFC] px-1 py-0.2 text-[9px] font-bold text-[#5E5CE6]">
                ±1.5 BPS
              </span>
            </div>
            <p className="tabular mt-1.5 text-lg font-bold text-foreground font-mono">
              {corridorStats.complianceRatePct}%
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Zero front-running slippage
            </p>
          </div>
        </section>

        {/* Tab Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-hairline bg-white p-2 shadow-2xs">
          <div className="flex flex-wrap gap-1">
            {(
              [
                ["Solvency", "House Pool & Solvency"],
                ["Corridor", "Corridor Clamping (±1.5 bps)"],
                ["Perps", "Perps Volume & OI Breakdown"],
                ["Waterfall", "Fee Waterfall Distribution"],
                ["Heatmap", "Liquidity Heatmap & Depth"],
              ] as const
            ).map(([tabKey, label]) => (
              <button
                key={tabKey}
                type="button"
                onClick={() => setActiveTab(tabKey)}
                className={`pill h-8 px-3 text-xs font-medium transition-all ${
                  activeTab === tabKey
                    ? "pill-ink font-semibold shadow-2xs"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground pr-2">
            <span>Market focus:</span>
            <span className="font-bold text-foreground">{selectedMarket} (${fmtUsd(livePrice, 2)})</span>
          </div>
        </div>

        {/* Main Content Layout (Technical Chart + Side Insights) */}
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_310px]">
          {/* Left Column: Active Technical Chart */}
          <div className="min-w-0 space-y-3">
            {activeTab === "Solvency" && (
              <HousePoolSolvencyChart
                currentTvl={solvency.tvlUsd}
                currentVolume={totalVolume24h}
                liquidReserves={solvency.liquidReservesUsd}
                solvencyRatio={solvency.solvencyRatioPct}
              />
            )}

            {activeTab === "Corridor" && (
              <CorridorDeviationChart
                markets={markets}
                selectedMarket={selectedMarket}
                onSelectMarket={setSelectedMarket}
              />
            )}

            {activeTab === "Perps" && (
              <PerpsBreakdownChart
                markets={markets}
                totalVolume={totalVolume24h}
                totalOi={totalPerpOiUsd}
              />
            )}

            {activeTab === "Waterfall" && (
              <FeeWaterfallChart solvency={solvency} />
            )}

            {activeTab === "Heatmap" && (
              <section className="rounded-2xl border border-hairline bg-white p-3.5 shadow-2xs">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <h2 className="text-xs font-semibold uppercase tracking-wider font-mono text-muted-foreground">
                      Order Book Liquidity Heatmap · {selectedMarket}/USD
                    </h2>
                    <p className="text-[11px] text-muted-foreground">
                      Concentrated bid/ask liquidity depth and liquidation cluster walls
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {["12h", "1d", "3d", "1w"].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setHeatmapPeriod(p)}
                        className={`pill h-6 px-2 text-[10px] font-mono ${
                          heatmapPeriod === p ? "pill-ink font-bold" : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-hairline p-1 bg-white">
                  <ChartCanvas kind="heatmap" values={analysisSeries} height={280} />
                  <div className="flex justify-between px-3 pb-1 pt-1 text-[9px] font-mono text-muted-foreground">
                    <span>Low Liquidity Depth</span>
                    <span>{heatmapPeriod} · {selectedMarket}/USD</span>
                    <span>High Liquidity Wall</span>
                  </div>
                </div>
              </section>
            )}

            {/* Quick Secondary Insights Row */}
            <div className="grid gap-2.5 sm:grid-cols-3">
              <article className="rounded-2xl border border-hairline bg-white p-3 shadow-2xs">
                <div className="flex justify-between text-[10px] font-mono text-muted-foreground uppercase">
                  <span>24h Liquidations</span>
                  <span className="font-semibold text-loss">$96.4M</span>
                </div>
                <div className="mt-2">
                  <ChartCanvas
                    kind="bars"
                    height={65}
                    values={revenueSeries.slice(0, 20).map((v, j) => (j % 3 === 0 ? -v : v))}
                  />
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Flows 100% to clearing FIFO claims when queue &gt; $0.
                </p>
              </article>

              <article className="rounded-2xl border border-hairline bg-white p-3 shadow-2xs">
                <div className="flex justify-between text-[10px] font-mono text-muted-foreground uppercase">
                  <span>Funding Trend</span>
                  <span className="font-semibold text-gain">{currentMarket.fundingRatePct}</span>
                </div>
                <div className="mt-2">
                  <ChartCanvas
                    kind="bars"
                    height={65}
                    values={revenueSeries.slice(10, 30)}
                  />
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Annualized APR: {currentMarket.fundingAprPct}
                </p>
              </article>

              <article className="rounded-2xl border border-hairline bg-white p-3 shadow-2xs">
                <div className="flex justify-between text-[10px] font-mono text-muted-foreground uppercase">
                  <span>Mark Deviation</span>
                  <span className="font-semibold text-foreground font-mono">
                    {currentMarket.deviationBps >= 0 ? "+" : ""}
                    {currentMarket.deviationBps} bps
                  </span>
                </div>
                <div className="mt-2">
                  <ChartCanvas
                    kind="line"
                    height={65}
                    values={analysisSeries.slice(30, 55)}
                  />
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Corridor ceiling: ±{currentMarket.corridorBps} bps
                </p>
              </article>
            </div>
          </div>

          {/* Right Column: Key Levels, Long/Short Depth, and Setup Card */}
          <aside className="space-y-3">
            {/* Live Market Quick Summary */}
            <div className="rounded-2xl border border-hairline bg-white p-3.5 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-hairline pb-2">
                <span className="text-[10px] font-mono font-semibold uppercase text-muted-foreground">
                  {selectedMarket} Spot/Perp Parity
                </span>
                <span className="rounded bg-secondary px-1.5 py-0.2 text-[10px] font-mono font-bold text-foreground">
                  {currentMarket.maxLeverage}x MAX
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="rounded-xl bg-[#F8F8F7] p-2">
                  <span className="text-[9px] text-muted-foreground block">24H High</span>
                  <span className="font-bold text-foreground">${fmtUsd(currentMarket.high24h, 2)}</span>
                </div>
                <div className="rounded-xl bg-[#F8F8F7] p-2">
                  <span className="text-[9px] text-muted-foreground block">24H Low</span>
                  <span className="font-bold text-foreground">${fmtUsd(currentMarket.low24h, 2)}</span>
                </div>
              </div>

              <div className="rounded-xl bg-[#F8F8F7] p-2.5 font-mono text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Market OI (USD):</span>
                  <span className="font-bold text-foreground">${fmtUsd(currentMarket.openInterestUsd, 0)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground mt-1">
                  <span>Market Volume (24h):</span>
                  <span className="font-bold text-foreground">${fmtUsd(currentMarket.volume24hUsd, 0)}</span>
                </div>
              </div>
            </div>

            {/* Long / Short Ratio */}
            <div className="rounded-2xl border border-hairline bg-white p-3.5 shadow-2xs">
              <div className="flex justify-between items-center">
                <p className="data-label text-[10px] font-mono">LONG / SHORT RATIO</p>
                <span className="text-[10px] font-mono text-muted-foreground">Hyperliquid Perps</span>
              </div>
              <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-[#FFECEA]">
                <div className="h-full w-[54.2%] rounded-full bg-[#00D964]" />
              </div>
              <p className="mt-2 flex justify-between tabular text-xs font-mono">
                <span className="text-gain font-bold">54.2% Long</span>
                <span className="text-loss font-bold">45.8% Short</span>
              </p>
            </div>

            {/* Key Levels Liquidation Clusters */}
            <div className="rounded-2xl border border-hairline bg-white p-3.5 shadow-2xs">
              <h2 className="text-xs font-semibold uppercase font-mono text-muted-foreground border-b border-hairline pb-2">
                Key Liquidity & Liq Levels
              </h2>
              <div className="mt-2.5 space-y-1.5">
                {[
                  [1.012, "Short liquidation cluster", "$42.5M", "loss"],
                  [1.009, "Hyperliquid ask wall", "$18.5M", "loss"],
                  [0.993, "BBO bid support cluster", "$22.1M", "gain"],
                  [0.989, "Long liquidation cluster", "$68.2M", "gain"],
                ].map(([factor, label, volume, tone]) => (
                  <article
                    key={String(label)}
                    className="rounded-xl border border-hairline p-2 transition-colors hover:bg-[#F8F8F7]"
                  >
                    <p className="tabular text-xs font-semibold flex items-center justify-between font-mono">
                      <span>${fmtUsd(livePrice * Number(factor), 2)}</span>
                      <span
                        className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                          tone === "loss" ? "bg-loss-soft text-loss" : "bg-gain-soft text-gain"
                        }`}
                      >
                        {volume}
                      </span>
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{label}</p>
                  </article>
                ))}
              </div>
            </div>

            {/* Trade Setup CTA with Godcandle Rainbow Accent */}
            <div className="rounded-2xl border border-hairline p-3.5 shadow-xs relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(205,195,240,0.2) 0%, rgba(255,218,200,0.2) 50%, rgba(160,212,202,0.2) 100%)" }}>
              <div className="relative z-10">
                <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase">
                  Execution Terminal
                </p>
                <p className="mt-1 text-xs font-bold text-foreground">
                  Trade {selectedMarket} with 1.5 bps Zero Slippage
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Mark-clamped execution, instant collateral return, and up to 1000x leverage.
                </p>
                <Link
                  to="/"
                  className="pill pill-ink mt-3 h-8 w-full text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  Open {selectedMarket} Terminal →
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
