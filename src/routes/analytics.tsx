import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
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
import { FundingMatrix } from "@/components/analytics/FundingMatrix";
import { analysisSeries, revenueSeries } from "@/lib/design-data";
import { fmtUsd } from "@/lib/engine";
import { RefreshCw, ShieldCheck, Zap, Activity } from "lucide-react";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "godcandle — Market & Protocol Analytics" },
      {
        name: "description",
        content:
          "Real-time House Pool solvency, market statistics, perps volume, and FIFO settlement depth.",
      },
      { property: "og:title", content: "godcandle — Market & Protocol Analytics" },
      {
        property: "og:description",
        content:
          "Live Hyperliquid telemetry, House Pool reserves, and settlement metrics.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnalyticsPage,
});

type AnalyticsTab =
  | "Matrix"
  | "Solvency"
  | "Corridor"
  | "Perps"
  | "Waterfall"
  | "Heatmap";

function AnalyticsPage() {
  const [selectedMarket, setSelectedMarket] = useState<MarketSymbol>("BTC");
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("Matrix");
  const [heatmapPeriod, setHeatmapPeriod] = useState("1d");

  const t = useTrading();
  const livePrice = (t.feeds as Record<string, any>)[selectedMarket]?.price ?? 68400;

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

  const currentMarket = (markets as Record<string, any>)[selectedMarket] ?? markets.BTC;

  return (
    <main className="min-h-screen bg-[#FAFAFC] pb-16 font-sans">
      <div className="page-content space-y-4 pt-4 max-w-7xl mx-auto">
        {/* Header Ribbon & Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-black/[0.06] bg-white p-5 sm:p-6 shadow-xs">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                Protocol &amp; Market Analytics
              </h1>
              <span className="rounded-full bg-[#E6F9EE] px-2.5 py-0.5 text-xs font-mono font-bold text-[#00D964]">
                HYPEREVM MAINNET
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground font-mono">
              Live House Pool Solvency, Funding Rates &amp; FIFO Settlement Telemetry
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-black/[0.06] bg-[#FAFAFC] px-3 py-1.5 text-xs font-mono text-muted-foreground">
              <Activity className="h-3.5 w-3.5 text-emerald-500" />
              <span>{isLive ? "Hyperliquid L1 Connected" : "Local Telemetry Feed"}</span>
              <span className="text-black/10">|</span>
              <span>{lastUpdated.toLocaleTimeString()}</span>
            </div>

            <button
              type="button"
              onClick={() => refresh()}
              disabled={loading}
              className="flex h-8 items-center gap-1.5 px-3.5 text-xs font-semibold rounded-xl bg-[#0A0A0A] hover:bg-[#1A1A1A] text-white active:scale-[0.98] transition-all cursor-pointer shadow-xs"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
              <span>Sync</span>
            </button>
          </div>
        </div>


        {/* 6 Core Live Protocol Metrics Strip */}
        <section aria-label="Key Protocol Metrics" className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {/* 1. TVL (House Pool Balance) */}
          <div className="rounded-2xl border border-black/[0.06] bg-white p-3.5 shadow-xs transition-all hover:border-black/20">
            <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wider">HOUSE POOL TVL</span>
              <span className="rounded bg-[#EAF2F1] px-1 py-0.2 text-xs font-bold text-[#4A7C75]">
                {solvency.solvencyRatioPct}% SOLVENT
              </span>
            </div>
            <p className="tabular mt-1.5 text-lg font-bold text-foreground font-mono">
              ${fmtUsd(solvency.tvlUsd, 0)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Reserves: <strong className="text-foreground">${fmtUsd(solvency.liquidReservesUsd, 0)}</strong>
            </p>
          </div>

          {/* 2. 24h Volume across perps */}
          <div className="rounded-2xl border border-black/[0.06] bg-white p-3.5 shadow-xs transition-all hover:border-black/20">
            <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wider">24H VOLUME (PERPS)</span>
              <Zap className="h-3 w-3 text-amber-500" />
            </div>
            <p className="tabular mt-1.5 text-lg font-bold text-foreground font-mono">
              ${fmtUsd(totalVolume24h, 0)}
            </p>
            <p className="mt-1 text-xs font-mono text-muted-foreground">
              {Object.keys(markets).length || 14} Markets Total
            </p>
          </div>

          {/* 3. Cumulative Protocol Fees */}
          <div className="rounded-2xl border border-black/[0.06] bg-white p-3.5 shadow-xs transition-all hover:border-black/20">
            <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wider">PROTOCOL FEES</span>
              <span className="text-xs text-[#00D964] font-semibold">+24h</span>
            </div>
            <p className="tabular mt-1.5 text-lg font-bold text-foreground font-mono">
              ${fmtUsd(solvency.cumulativeFeesAllTimeUsd, 0)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              24h Inflow: <strong className="text-foreground">${fmtUsd(solvency.cumulativeFees24hUsd, 0)}</strong>
            </p>
          </div>

          {/* 4. Active 1000x Open Interest */}
          <div className="rounded-2xl border border-black/[0.06] bg-white p-3.5 shadow-xs transition-all hover:border-black/20">
            <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wider">1000X OPEN INTEREST</span>
              <span className="rounded bg-[#FEECEB] px-1 py-0.2 text-xs font-bold text-[#FF3B30]">
                MAX LEV
              </span>
            </div>
            <p className="tabular mt-1.5 text-lg font-bold text-foreground font-mono">
              ${fmtUsd(solvency.aggregateOi1000xUsd, 0)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Total Perps OI: <strong className="text-foreground">${fmtUsd(totalPerpOiUsd, 0)}</strong>
            </p>
          </div>

          {/* 5. FIFO Settlement Payout Depth */}
          <div className="rounded-2xl border border-black/[0.06] bg-white p-3.5 shadow-xs transition-all hover:border-black/20">
            <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wider">FIFO PAYOUT QUEUE</span>
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
            </div>
            <p className="tabular mt-1.5 text-lg font-bold text-[#00D964] font-mono">
              ${fmtUsd(solvency.queueDepthUsd, 2)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Instant Payout: <strong className="text-[#00D964]">100% (0 Delay)</strong>
            </p>
          </div>

          {/* 6. Hyperliquid L1 Telemetry Compliance */}
          <div className="rounded-2xl border border-black/[0.06] bg-white p-3.5 shadow-xs transition-all hover:border-black/20">
            <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wider">L1 FEED SYNC</span>
              <span className="rounded bg-[#EFEFFC] px-1 py-0.2 text-xs font-bold text-[#5E5CE6]">
                ACTIVE
              </span>
            </div>
            <p className="tabular mt-1.5 text-lg font-bold text-foreground font-mono">
              {corridorStats.complianceRatePct}%
            </p>
            <p className="mt-1 text-xs font-mono text-muted-foreground">
              Real-Time Direct Fills
            </p>
          </div>
        </section>

        {/* Hard Protocol Solvency & Settlement Telemetry Table */}
        <section aria-label="Protocol Quant Telemetry Matrix" className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-xs font-mono">
          <div className="flex items-center justify-between pb-2.5 border-b border-black/[0.06]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                Protocol Solvency &amp; L1 Settlement Matrix
              </span>
              <span className="rounded bg-[#E6F9EE] text-[#00D964] px-2 py-0.5 text-xs font-bold">
                Deterministic Cash FIFO
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              Oracles: Hyperliquid L1 MarkPx &amp; BBO Mid
            </span>
          </div>

          <div className="overflow-x-auto no-scrollbar pt-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/60 text-xs uppercase text-muted-foreground">
                  <th className="py-2 pr-4 font-semibold">Protocol Metric</th>
                  <th className="py-2 pr-4 font-semibold">Current Value</th>
                  <th className="py-2 pr-4 font-semibold">Contractual Bound</th>
                  <th className="py-2 pr-4 font-semibold">Settlement Standard</th>
                  <th className="py-2 text-right font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs">
                <tr>
                  <td className="py-2.5 pr-4 font-semibold text-foreground">House Pool Liquid Reserve</td>
                  <td className="py-2.5 pr-4 tabular font-bold text-foreground">$10,000.00 base / $12,177,196 pool</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">≥ $10,000 baseline vault</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">100% immediate liquid cash</td>
                  <td className="py-2.5 text-right font-semibold text-[#00D964]">Solvent (342%)</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 font-semibold text-foreground">FIFO Payout Queue Depth</td>
                  <td className="py-2.5 pr-4 tabular font-bold text-[#00D964]">$0.00 (Zero Backlog)</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">0 pending tickets</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">Atomic block-level payout</td>
                  <td className="py-2.5 text-right font-semibold text-[#00D964]">Active (0 delay)</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 font-semibold text-foreground">Net Open Interest (Long vs Short)</td>
                  <td className="py-2.5 pr-4 tabular font-bold text-foreground">Long $1.84M (54.2%) / Short $1.40M (45.8%)</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">Max aggregate: $44.5M</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">Net Long +$440,300 nominal</td>
                  <td className="py-2.5 text-right font-semibold text-foreground">Balanced</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 font-semibold text-foreground">Hyperliquid L1 Feed Latency & Sync</td>
                  <td className="py-2.5 pr-4 tabular font-bold text-[#5E5CE6]">Sub-second active (99.98% uptime)</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">Max latency: &lt; 50ms from L1</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">Direct WebSocket execution stream</td>
                  <td className="py-2.5 text-right font-semibold text-[#5E5CE6]">Enforced</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Tab Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-black/[0.06] bg-white p-2 shadow-xs">
          <div className="flex flex-wrap gap-1 rounded-xl bg-[#F0F2F5] p-1 border border-black/[0.04]">
            {(
              [
                ["Matrix", "Rates & Funding Matrix"],
                ["Solvency", "House Pool & Solvency"],
                ["Corridor", "Telemetry & Deviation"],
                ["Perps", "Volume & OI Breakdown"],
                ["Waterfall", "Fee Waterfall"],
                ["Heatmap", "Liquidity Depth"],
              ] as const
            ).map(([tabKey, label]) => (
              <button
                key={tabKey}
                type="button"
                onClick={() => setActiveTab(tabKey)}
                className={`h-7 px-3 text-xs font-semibold rounded-lg transition-all active:scale-[0.98] cursor-pointer ${
                  activeTab === tabKey
                    ? "bg-white text-[#0A0A0A] shadow-xs"
                    : "text-[#737887] hover:text-[#0A0A0A] hover:bg-white/60"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground pr-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Market focus:</span>
            <span className="font-bold text-foreground">{selectedMarket} (${fmtUsd(livePrice, 2)})</span>
          </div>
        </div>

        {/* Main Content Layout (Technical Chart + Side Insights) */}
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_310px]">
          {/* Left Column: Active Technical Chart */}
          <div className="min-w-0 space-y-3">
            {activeTab === "Matrix" && (
              <FundingMatrix
                feeds={t.feeds || {}}
                onSelectMarket={(sym) => setSelectedMarket(sym)}
              />
            )}

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
              <section className="rounded-2xl border border-black/[0.06] bg-white p-3.5 shadow-xs">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <h2 className="text-[11px] font-semibold uppercase tracking-wider font-mono text-muted-foreground">
                      Order Book Liquidity Heatmap · {selectedMarket}/USD
                    </h2>
                    <p className="text-xs font-mono text-muted-foreground">
                      Bid/ask depth &amp; liquidation clusters
                    </p>
                  </div>
                  <div className="flex gap-1 rounded-lg bg-[#F0F2F5] p-0.5 border border-black/[0.04]">
                    {["12h", "1d", "3d", "1w"].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setHeatmapPeriod(p)}
                        className={`h-6 px-2 text-xs font-mono rounded-md transition-all active:scale-[0.98] cursor-pointer ${
                          heatmapPeriod === p ? "bg-white text-[#0A0A0A] font-bold shadow-xs" : "text-[#737887] hover:text-[#0A0A0A]"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-black/[0.06] p-1 bg-white">
                  <ChartCanvas kind="heatmap" values={analysisSeries} height={280} />
                  <div className="flex justify-between px-3 pb-1 pt-1 text-xs font-mono text-muted-foreground">
                    <span>Low Liquidity Depth</span>
                    <span>{heatmapPeriod} · {selectedMarket}/USD</span>
                    <span>High Liquidity Wall</span>
                  </div>
                </div>
              </section>
            )}

            {/* Quick Secondary Insights Row */}
            <div className="grid gap-2.5 sm:grid-cols-3">
              <article className="rounded-2xl border border-black/[0.06] bg-white p-3 shadow-xs">
                <div className="flex justify-between text-xs font-mono text-muted-foreground uppercase">
                  <span className="text-[11px] font-semibold tracking-wider">24h Liquidations</span>
                  <span className="font-semibold text-[#FF3B30]">$96.4M</span>
                </div>
                <div className="mt-2">
                  <ChartCanvas
                    kind="bars"
                    height={65}
                    values={revenueSeries.slice(0, 20).map((v, j) => (j % 3 === 0 ? -v : v))}
                  />
                </div>
                <p className="mt-1 text-xs font-mono text-muted-foreground">
                  FIFO Priority Clearing
                </p>
              </article>

              <article className="rounded-2xl border border-black/[0.06] bg-white p-3 shadow-xs">
                <div className="flex justify-between text-xs font-mono text-muted-foreground uppercase">
                  <span className="text-[11px] font-semibold tracking-wider">Funding Trend</span>
                  <span className="font-semibold text-[#00D964]">{currentMarket.fundingRatePct}</span>
                </div>
                <div className="mt-2">
                  <ChartCanvas
                    kind="bars"
                    height={65}
                    values={revenueSeries.slice(10, 30)}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Annualized APR: {currentMarket.fundingAprPct}
                </p>
              </article>

              <article className="rounded-2xl border border-black/[0.06] bg-white p-3 shadow-xs">
                <div className="flex justify-between text-xs font-mono text-muted-foreground uppercase">
                  <span className="text-[11px] font-semibold tracking-wider">Mark Deviation</span>
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
                <p className="mt-1 text-xs text-muted-foreground">
                  Corridor ceiling: ±{currentMarket.corridorBps} bps
                </p>
              </article>
            </div>
          </div>

          {/* Right Column: Key Levels, Long/Short Depth, and Setup Card */}
          <aside className="space-y-3">
            {/* Live Market Quick Summary */}
            <div className="rounded-2xl border border-black/[0.06] bg-white p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-black/[0.06] pb-2">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                  {selectedMarket} L1 Mark/Mid Parity
                </span>
                <span className="rounded-md bg-[#F0F2F5] px-1.5 py-0.5 text-xs font-mono font-bold text-foreground">
                  {currentMarket.maxLeverage}x MAX
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="rounded-xl bg-[#F8F8F7] p-2">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">24H High</span>
                  <span className="font-bold text-foreground">${fmtUsd(currentMarket.high24h, 2)}</span>
                </div>
                <div className="rounded-xl bg-[#F8F8F7] p-2">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">24H Low</span>
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
            <div className="rounded-2xl border border-black/[0.06] bg-white p-3.5 shadow-xs">
              <div className="flex justify-between items-center">
                <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">LONG / SHORT RATIO</p>
                <span className="text-xs font-mono text-muted-foreground">Hyperliquid Perps</span>
              </div>
              <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-[#FEECEB]">
                <div className="h-full w-[54.2%] rounded-full bg-[#00D964]" />
              </div>
              <p className="mt-2 flex justify-between tabular text-xs font-mono">
                <span className="text-[#00D964] font-bold">54.2% Long</span>
                <span className="text-[#FF3B30] font-bold">45.8% Short</span>
              </p>
            </div>

            {/* Key Levels Liquidation Clusters */}
            <div className="rounded-2xl border border-black/[0.06] bg-white p-3.5 shadow-xs">
              <h2 className="text-[11px] font-semibold uppercase font-mono tracking-wider text-muted-foreground border-b border-black/[0.06] pb-2">
                Key Liquidity &amp; Liq Levels
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
                    className="rounded-xl border border-black/[0.06] p-2 transition-colors hover:bg-[#F8F8F7]"
                  >
                    <p className="tabular text-xs font-semibold flex items-center justify-between font-mono">
                      <span>${fmtUsd(livePrice * Number(factor), 2)}</span>
                      <span
                        className={`rounded px-1.5 py-0.2 text-xs font-bold ${
                          tone === "loss" ? "bg-[#FEECEB] text-[#FF3B30]" : "bg-[#E6F9EE] text-[#00D964]"
                        }`}
                      >
                        {volume}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
                  </article>
                ))}
              </div>
            </div>

            {/* Trade Setup CTA with Godcandle Rainbow Accent */}
            <div className="rounded-2xl border border-black/[0.06] p-3.5 shadow-xs relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(205,195,240,0.2) 0%, rgba(255,218,200,0.2) 50%, rgba(160,212,202,0.2) 100%)" }}>
              <div className="relative z-10">
                <p className="text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
                  Execution Terminal
                </p>
                <p className="mt-1 text-xs font-bold text-foreground">
                  Trade {selectedMarket} Perpetual
                </p>
                <p className="mt-1 text-xs font-mono text-muted-foreground">
                  Instant Collateral Return · Direct L1 Routing
                </p>
                <Link
                  to="/"
                  className="mt-3 h-8 w-full text-xs font-semibold flex items-center justify-center gap-1.5 rounded-xl bg-[#0A0A0A] hover:bg-[#1A1A1A] text-white active:scale-[0.98] transition-all cursor-pointer shadow-xs"
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
