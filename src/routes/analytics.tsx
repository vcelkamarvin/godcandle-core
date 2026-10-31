import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MarketBar } from "@/components/godcandle/MarketBar";
import { ChartCanvas } from "@/components/godcandle/ChartCanvas";
import { Metric, Segments } from "@/components/godcandle/Metric";
import { useTrading } from "@/components/godcandle/TradingProvider";
import { analysisSeries, revenueSeries } from "@/lib/design-data";
import { fmtUsd } from "@/lib/engine";
import type { MarketSymbol } from "@/config/markets";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "godcandle — Market analysis" },
      { name: "description", content: "Market liquidity, liquidation levels, funding and open interest." },
      { property: "og:title", content: "godcandle — Market analysis" },
      { property: "og:description", content: "Explore market liquidity and key trading levels." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Analysis,
});

function Analysis() {
  const [market, setMarket] = useState<MarketSymbol>("BTC");
  const [view, setView] = useState("Heatmap");
  const [period, setPeriod] = useState("1d");
  const t = useTrading();
  const price = t.feeds[market].price;

  return (
    <main>
      <MarketBar market={market} onSelect={setMarket} compact />
      <div className="page-content grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2.5">
            <div>
              <h1 className="text-xl font-semibold">Analysis</h1>
              <p className="mt-0.5 text-xs text-muted-foreground">{market}-USD · liquidity and liquidations</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Segments items={["Heatmap", "Liquidations", "Funding", "Open interest", "Long/Short"]} value={view} onChange={setView} />
              <Segments items={["12h", "1d", "3d", "1w"]} value={period} onChange={setPeriod} />
            </div>
          </div>

          <section className="overflow-hidden rounded-2xl border border-hairline p-2 bg-white">
            <ChartCanvas
              kind={view === "Heatmap" ? "heatmap" : view === "Liquidations" || view === "Funding" ? "bars" : "line"}
              values={view === "Heatmap" ? analysisSeries : revenueSeries.map((v, i) => view === "Liquidations" && i % 3 === 0 ? -v : v)}
              height={300}
            />
            <div className="flex justify-between px-3 pb-1 pt-1 text-[9px] text-muted-foreground">
              <span>Low liquidity</span>
              <span>{period} · {market}/USD</span>
              <span>High liquidity</span>
            </div>
          </section>

          <div className="mt-2.5 grid gap-2.5 sm:grid-cols-3">
            {[["Liquidations 24h", "$96M"], ["Funding trend", "+0.0100%"], ["Open interest", "$1.8B"]].map(([label, value], i) => (
              <article key={label} className="rounded-2xl border p-2.5 bg-white">
                <div className="flex justify-between">
                  <p className="data-label">{label}</p>
                  <p className="tabular text-xs font-semibold">{value}</p>
                </div>
                <ChartCanvas kind="bars" height={70} values={revenueSeries.slice(i * 8, i * 8 + 24).map((v, j) => i === 0 && j % 3 === 0 ? -v : v)} />
              </article>
            ))}
          </div>
        </div>

        <aside className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Metric label="Funding" value="+0.0100%" />
            <Metric label="Open interest" value="$1.8B" />
          </div>

          <div className="rounded-2xl border p-2.5 bg-white">
            <p className="data-label">Long / short</p>
            <div className="mt-2 h-1.5 rounded-full bg-loss">
              <div className="h-1.5 w-[54%] rounded-full bg-gain" />
            </div>
            <p className="mt-1.5 flex justify-between tabular text-xs">
              <span className="text-gain font-semibold">54%</span>
              <span className="text-loss font-semibold">46%</span>
            </p>
          </div>

          <h2 className="pt-1 text-xs font-semibold text-muted-foreground uppercase font-mono">Key levels</h2>
          <div className="space-y-1.5">
            {[
              [1.012, "Short liquidation cluster", "$42M"],
              [1.009, "Ask wall", "$18.5M"],
              [0.993, "Bid wall", "$22.1M"],
              [0.989, "Long liquidation cluster", "$68M"],
            ].map(([factor, label, volume]) => (
              <article key={String(label)} className="rounded-xl border p-2 bg-white">
                <p className="tabular text-xs font-semibold flex items-center justify-between">
                  <span>${fmtUsd(price * Number(factor))}</span>
                  <span className={`rounded px-1 text-[9px] font-bold ${Number(factor) > 1 ? "bg-loss-soft text-loss" : "bg-gain-soft text-gain"}`}>
                    {volume}
                  </span>
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{label}</p>
              </article>
            ))}
          </div>

          <div className="reward-panel p-3">
            <p className="data-label">Trade this setup</p>
            <p className="mt-1 text-xs font-semibold">{market} · $50 margin</p>
            <Link to="/" className="pill pill-ink mt-2.5 h-8 w-full text-xs">
              Trade {market} →
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
