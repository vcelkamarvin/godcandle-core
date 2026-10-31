import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Dock } from "@/components/godcandle/Dock";
import { ShareModal } from "@/components/godcandle/ShareModal";
import { useTrading } from "@/components/godcandle/TradingProvider";
import { fmtSigned, fmtUsd, pnlOf, positionFee, type ClosedTrade } from "@/lib/engine";
import { ChartCanvas } from "@/components/godcandle/ChartCanvas";
import { Metric, Segments } from "@/components/godcandle/Metric";
import { TransferDialog } from "@/components/godcandle/TransferDialog";
import { Button } from "@/components/ui/button";
import { MARKETS } from "@/config/markets";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "godcandle — Portfolio" },
      { name: "description", content: "Account equity, positions, trading performance and wallet." },
      { property: "og:title", content: "godcandle — Portfolio" },
      { property: "og:description", content: "Your equity and trading history in one portfolio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Portfolio,
});

function Portfolio() {
  const t = useTrading();
  const [share, setShare] = useState<ClosedTrade | null>(null);
  const [transfer, setTransfer] = useState<"Deposit" | "Withdraw" | null>(null);
  const [view, setView] = useState("Equity");
  const [period, setPeriod] = useState("1W");

  const unrealized = t.positions.reduce((s, p) => s + pnlOf(p, t.feeds[p.market].price), 0);
  const realized = t.history.reduce((s, h) => s + h.pnl, 0);
  const volume = t.history.reduce((s, h) => s + h.stake * h.leverage, 0);
  const wins = t.history.filter((h) => h.pnl > 0).length;
  const curve = [
    t.balance - realized,
    ...t.history
      .slice()
      .reverse()
      .map(
        (_, i) =>
          t.balance -
          realized +
          t.history
            .slice()
            .reverse()
            .slice(0, i + 1)
            .reduce((s, h) => s + h.pnl, 0)
      ),
    t.balance + unrealized,
  ];

  return (
    <main className="page-content">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0 rounded-2xl border p-3.5 bg-white">
          <div className="flex flex-wrap items-start justify-between gap-2.5">
            <div>
              <h1 className="data-label">Total equity</h1>
              <p className="tabular mt-1 text-3xl font-semibold">${fmtUsd(t.balance + unrealized)}</p>
              <p className={`tabular mt-1 text-xs ${realized + unrealized >= 0 ? "text-gain font-semibold" : "text-loss font-semibold"}`}>
                {fmtSigned(realized + unrealized)} <span className="font-sans text-muted-foreground font-normal">this session</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Segments items={["Equity", "PnL", "Volume"]} value={view} onChange={setView} />
              <Segments items={["1D", "1W", "1M", "3M", "All"]} value={period} onChange={setPeriod} />
            </div>
          </div>
          <div className="mt-2">
            <ChartCanvas
              height={180}
              values={
                view === "Equity"
                  ? curve
                  : view === "PnL"
                  ? [0, ...t.history.map((h) => h.pnl), unrealized]
                  : [0, ...t.history.map((h) => h.stake * h.leverage), volume]
              }
              kind={view === "Volume" ? "bars" : "line"}
            />
          </div>
        </section>

        <aside className="reward-panel p-3.5">
          <h2 className="data-label text-foreground">Wallet</h2>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-card p-2.5">
              <p className="text-[10px] text-muted-foreground font-mono">Available</p>
              <p className="tabular mt-0.5 text-sm font-semibold">${fmtUsd(t.available)}</p>
            </div>
            <div className="rounded-xl bg-card p-2.5">
              <p className="text-[10px] text-muted-foreground font-mono">In positions</p>
              <p className="tabular mt-0.5 text-sm font-semibold">${fmtUsd(t.balance - t.available)}</p>
            </div>
          </div>
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <Button variant="terminal" className="pill pill-ink h-9 text-xs" onClick={() => setTransfer("Deposit")}>
              Deposit
            </Button>
            <Button variant="terminal" className="pill h-9 bg-card text-xs" onClick={() => setTransfer("Withdraw")}>
              Withdraw
            </Button>
          </div>
          <p className="tabular mt-2 text-[9px] text-muted-foreground text-center">USDC · HyperEVM · Arbitrum · Base</p>
        </aside>
      </div>

      <section className="my-3 grid grid-cols-2 gap-2 lg:grid-cols-6">
        <Metric label="Total PnL" value={fmtSigned(realized)} tone={realized >= 0 ? "text-gain" : "text-loss"} />
        <Metric label="Win rate" value={t.history.length ? `${Math.round((wins / t.history.length) * 100)}%` : "—"} note={`${wins} of ${t.history.length} trades`} />
        <Metric label="Volume" value={`$${fmtUsd(volume, 0)}`} />
        <Metric label="Best trade" value={t.history.length ? fmtSigned(Math.max(...t.history.map((h) => h.pnl))) : "—"} />
        <Metric label="Avg leverage" value={t.history.length ? `×${Math.round(t.history.reduce((s, h) => s + h.leverage, 0) / t.history.length)}` : "—"} />
        <Metric label="Fees paid" value={`$${fmtUsd(t.history.reduce((s, h) => s + positionFee(h), 0))}`} />
      </section>

      <div className="grid gap-2.5 md:grid-cols-[1fr_1fr_220px]">
        <section className="rounded-2xl border p-2.5 bg-white">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase font-mono">Daily PnL</h2>
          <div className="mt-2 grid grid-cols-14 gap-1">
            {Array.from({ length: 84 }, (_, i) => {
              const result = t.history[i]?.pnl;
              return (
                <div
                  key={i}
                  title={result === undefined ? "No trades" : fmtSigned(result)}
                  className={`aspect-square rounded-xs ${result === undefined ? "bg-secondary" : result >= 0 ? "bg-gain-soft" : "bg-loss-soft"}`}
                />
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border p-2.5 bg-white">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase font-mono">Last 30 trades</h2>
          <div className="mt-1">
            <ChartCanvas kind="bars" height={80} values={t.history.length ? t.history.slice(0, 30).reverse().map((h) => h.pnl) : Array(30).fill(0)} />
          </div>
        </section>

        <section className="rounded-2xl border p-2.5 bg-white">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase font-mono">Volume by asset</h2>
          <div className="space-y-1.5 mt-1.5">
            {MARKETS.map((m) => {
              const v = t.history.filter((h) => h.market === m.symbol).reduce((s, h) => s + h.stake * h.leverage, 0);
              return (
                <div key={m.symbol} className="flex justify-between text-xs">
                  <span className="font-semibold">{m.symbol}</span>
                  <span className="tabular text-muted-foreground">{volume ? Math.round((v / volume) * 100) : 0}%</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="mt-3">
        <Dock feeds={t.feeds} open={t.positions} history={t.history} onSelect={() => {}} onClose={t.close} onShare={setShare} />
      </div>

      <ShareModal trade={share} onOpenChange={(o) => { if (!o) setShare(null); }} />
      {transfer && <TransferDialog mode={transfer} onClose={() => setTransfer(null)} />}
    </main>
  );
}
