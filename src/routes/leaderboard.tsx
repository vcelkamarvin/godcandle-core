import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Metric, Segments } from "@/components/godcandle/Metric";
import { ChartCanvas } from "@/components/godcandle/ChartCanvas";
import { leaderboardRows, analysisSeries } from "@/lib/design-data";
import { fmtSigned } from "@/lib/engine";
import { useTrading } from "@/components/godcandle/TradingProvider";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "godcandle — Leaderboard" },
      { name: "description", content: "Trader rankings and weekly Candle Cup standings." },
      { property: "og:title", content: "godcandle — Leaderboard" },
      { property: "og:description", content: "Explore trader rankings and weekly standings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Leaderboard,
});

function Leaderboard() {
  const [mode, setMode] = useState("Traders");
  const [period, setPeriod] = useState("7d");
  const [selected, setSelected] = useState<(typeof leaderboardRows)[number] | null>(null);
  const t = useTrading();
  const realized = t.history.reduce((s, h) => s + h.pnl, 0);
  const multiplier = period === "24h" ? 0.4 : period === "30d" ? 2 : period === "All" ? 3 : 1;
  const rows = mode === "Trades" ? leaderboardRows.slice().reverse() : leaderboardRows;

  return (
    <main className="page-content grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5">
          <div>
            <h1 className="text-xl font-semibold">Leaderboard</h1>
            <p className="mt-0.5 text-xs font-mono text-muted-foreground">Weekly Season Rankings</p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Link
              to="/cup"
              className="pill h-8 px-3 text-xs font-semibold bg-white border border-border hover:border-foreground/30 hover:bg-secondary/40 inline-flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <span>The Candle Cup</span>
              <span className="rounded bg-[#E3F8EC] px-1.5 py-0.2 text-[9px] font-bold text-[#06964A]">
                $53.5k Live
              </span>
            </Link>
            <Segments items={["Trades", "Traders"]} value={mode} onChange={setMode} />
            <Segments items={["24h", "7d", "30d", "All"]} value={period} onChange={setPeriod} />
          </div>
        </div>

        {/* Podium */}
        <section className="grid items-end gap-2.5 sm:grid-cols-3">
          {[
            { rank: 2, address: "0x7c85…a08d", pnl: 31022 },
            { rank: 1, address: "0x9c97…4fa2", pnl: 32850 },
            { rank: 3, address: "0xa63e…e1f8", pnl: 30432 },
          ].map((p) => (
            <article
              key={p.rank}
              className={`rounded-2xl p-3.5 bg-white ${p.rank === 1 ? "reward-panel pt-5 border-0" : "border"}`}
            >
              <span className={`pill size-6 text-xs font-bold ${p.rank === 1 ? "pill-ink" : "bg-secondary"}`}>
                #{p.rank}
              </span>
              <p className="tabular mt-2 text-xs font-mono">{p.address}</p>
              <p className={`tabular mt-1 text-2xl font-bold ${p.rank === 1 ? "text-foreground" : "text-gain"}`}>
                ${fmtSigned(p.pnl * multiplier, 0)}
              </p>
              <span className="tabular mt-1.5 inline-block rounded bg-gain-soft px-1.5 py-0.5 text-[10px] font-bold text-gain">
                +{p.rank === 1 ? 482 : p.rank === 2 ? 380 : 212}% ROI
              </span>
            </article>
          ))}
        </section>

        {/* Table */}
        <section className="mt-2.5 overflow-x-auto rounded-2xl border bg-white">
          <table className="w-full min-w-[580px] text-left text-xs">
            <thead className="bg-secondary data-label">
              <tr>
                {["#", "Trader", "Last trade", "Notional", "PnL", "ROI", "Trades", ""].map((s) => (
                  <th key={s} className="p-2.5 font-normal">
                    {s}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rows.map((r) => (
                <tr key={r.rank} className="hover:bg-secondary/40 transition-colors">
                  <td className="p-2.5 tabular font-semibold">{r.rank}</td>
                  <td className="tabular p-2.5 font-mono">{r.address}</td>
                  <td className="tabular p-2.5 text-[9px] text-muted-foreground">
                    {r.market} ×{r.rank * 41} {r.rank % 2 ? "LONG" : "SHORT"}
                  </td>
                  <td className="tabular p-2.5">$1.2M</td>
                  <td className="tabular p-2.5 font-semibold text-gain">{fmtSigned(r.pnl * multiplier, 0)}</td>
                  <td className="tabular p-2.5 font-semibold text-gain">+{r.roi}%</td>
                  <td className="tabular p-2.5">{r.trades}</td>
                  <td className="p-2.5 text-right">
                    <Button
                      variant="terminal"
                      className="pill pill-ghost h-6 px-2.5 text-[10px]"
                      onClick={() => setSelected(r)}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
              <tr className="bg-foreground text-background">
                <td className="p-2.5 tabular">—</td>
                <td className="p-2.5 font-semibold">You</td>
                <td className="p-2.5 text-[10px]">{t.history[0]?.market ?? "—"}</td>
                <td className="p-2.5">—</td>
                <td className="tabular p-2.5 font-semibold text-gain">{fmtSigned(realized)}</td>
                <td className="p-2.5">—</td>
                <td className="p-2.5">{t.history.length}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </section>
      </div>

      <aside className="space-y-2.5">
        <section className="reward-panel p-3.5">
          <p className="data-label text-foreground font-mono">Weekly Competition</p>
          <h2 className="mt-1.5 text-lg font-bold">The Candle Cup</h2>
          <p className="mt-0.5 text-xs font-mono text-muted-foreground">$50,000 Pool · HyperEVM</p>
          <div className="mt-2 overflow-hidden rounded-xl bg-card">
            <ChartCanvas height={90} values={analysisSeries} />
          </div>
          <p className="mt-2 text-xs font-semibold">ROI vs top-10 cutoff</p>
          <div className="mt-1.5 h-1.5 rounded-full bg-card">
            <div className="h-full w-[35%] rounded-full bg-foreground" />
          </div>
          <div className="mt-3 flex flex-col gap-1.5">
            <Link to="/cup" className="pill pill-ink h-8 w-full text-xs flex items-center justify-center gap-1.5 shadow-xs font-semibold">
              View Cup Standings →
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border p-3 bg-white">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase font-mono">Weekly ranking</h2>
          <div className="space-y-1.5 mt-2">
            {leaderboardRows.slice(0, 5).map((r, i) => (
              <div key={r.rank} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`pill size-5 text-[10px] font-bold ${i === 0 ? "bg-[#FFD60A] text-foreground" : "bg-secondary"}`}>
                    {i + 1}
                  </span>
                  <span className="tabular font-mono text-xs">{r.address}</span>
                </div>
                <span className="tabular font-semibold text-gain text-xs">+{r.roi}%</span>
              </div>
            ))}
          </div>
        </section>
      </aside>

      <Dialog open={Boolean(selected)} onOpenChange={(o) => { if (!o) setSelected(null); }}>
        <DialogContent className="rounded-3xl p-5">
          <DialogTitle>Trader {selected?.address}</DialogTitle>
          <DialogDescription>Performance · {period}</DialogDescription>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Metric label="PnL" value={fmtSigned((selected?.pnl ?? 0) * multiplier)} tone="text-gain" />
            <Metric label="Trades" value={String(selected?.trades ?? 0)} />
          </div>
          <div className="mt-2">
            <ChartCanvas height={160} values={analysisSeries} />
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}