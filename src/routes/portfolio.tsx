import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Dock } from "@/components/godcandle/Dock";
import { ShareModal } from "@/components/godcandle/ShareModal";
import { useTrading } from "@/components/godcandle/TradingProvider";
import { fmtSigned, fmtUsd, pnlOf, positionFee, type ClosedTrade } from "@/lib/engine";
import { ChartCanvas } from "@/components/godcandle/ChartCanvas";
import { TransferDialog } from "@/components/godcandle/TransferDialog";
import { MarketLogo } from "@/components/godcandle/MarketLogo";
import { ALL_MARKETS, type MarketSymbol } from "@/config/markets";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Wallet,
  Activity,
  Award,
  Layers,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "godcandle — Profile & Portfolio" },
      { name: "description", content: "Account equity, asset balances, trading performance, and positions." },
      { property: "og:title", content: "godcandle — Profile & Portfolio" },
      { property: "og:description", content: "Your balance, asset allocation, and trading history in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Portfolio,
});

export function Portfolio() {
  const t = useTrading();
  const [share, setShare] = useState<ClosedTrade | null>(null);
  const [transfer, setTransfer] = useState<"Deposit" | "Withdraw" | null>(null);
  const [view, setView] = useState<"Equity" | "PnL" | "Volume">("Equity");
  const [period, setPeriod] = useState<"1D" | "1W" | "1M" | "3M" | "All">("1W");

  const unrealized = t.positions.reduce((s, p) => s + pnlOf(p, t.feeds[p.market]?.price ?? 0), 0);
  const realized = t.history.reduce((s, h) => s + h.pnl, 0);
  const totalPnL = realized + unrealized;
  const volume = t.history.reduce((s, h) => s + h.stake * h.leverage, 0);
  const wins = t.history.filter((h) => h.pnl > 0).length;
  const winRate = t.history.length > 0 ? Math.round((wins / t.history.length) * 100) : 0;
  const bestTrade = t.history.length > 0 ? Math.max(...t.history.map((h) => h.pnl)) : 0;
  const feesPaid = t.history.reduce((s, h) => s + positionFee(h), 0);
  const totalEquity = t.balance + unrealized;

  const curve = [
    Math.max(100, t.balance - realized),
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
    totalEquity,
  ];

  // Asset holdings simulation based on balance & active positions
  const inPositions = Math.max(0, t.balance - t.available);
  const assetAllocations = [
    { symbol: "USDC", name: "USD Coin", amount: t.available, valueUsd: t.available, pct: totalEquity > 0 ? (t.available / totalEquity) * 100 : 100 },
    { symbol: "BTC", name: "Bitcoin", amount: 0.045, valueUsd: inPositions * 0.45, pct: totalEquity > 0 ? ((inPositions * 0.45) / totalEquity) * 100 : 0 },
    { symbol: "ETH", name: "Ethereum", amount: 0.52, valueUsd: inPositions * 0.30, pct: totalEquity > 0 ? ((inPositions * 0.30) / totalEquity) * 100 : 0 },
    { symbol: "SOL", name: "Solana", amount: 4.8, valueUsd: inPositions * 0.25, pct: totalEquity > 0 ? ((inPositions * 0.25) / totalEquity) * 100 : 0 },
  ].filter((a) => a.valueUsd > 0 || a.symbol === "USDC");

  return (
    <main className="page-content space-y-4 max-w-6xl mx-auto pb-16 font-sans">
      {/* 1. Revolut Hero Balance Card */}
      <section className="rounded-3xl border border-black/[0.06] bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Balance & Daily PnL */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider font-mono">
                Total Net Worth
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#E6F9EE] px-2 py-0.5 text-[11px] font-mono font-bold text-[#00D964]">
                <span className="size-1.5 rounded-full bg-[#00D964] animate-pulse" />
                HyperEVM L1 Native
              </span>
            </div>

            <div className="flex items-baseline gap-3 flex-wrap">
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground font-mono">
                ${fmtUsd(totalEquity, 2)}
              </h1>
              <div
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-bold ${
                  totalPnL >= 0 ? "bg-[#E6F9EE] text-[#00D964]" : "bg-[#FEECEB] text-[#FF3B30]"
                }`}
              >
                {totalPnL >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                <span>
                  {fmtSigned(totalPnL)} ({totalEquity > 0 ? ((totalPnL / totalEquity) * 100).toFixed(2) : "0.00"}%) all-time
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground font-mono pt-0.5">
              Available Cash: <span className="font-bold text-foreground">${fmtUsd(t.available, 2)}</span> · In Active Margin:{" "}
              <span className="font-bold text-foreground">${fmtUsd(inPositions, 2)}</span>
            </p>
          </div>

          {/* Revolut Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setTransfer("Deposit")}
              className="h-11 px-5 rounded-2xl bg-[#0A0A0A] hover:bg-[#1A1A1A] text-white font-semibold text-sm flex items-center gap-2 active:scale-[0.98] transition-all cursor-pointer shadow-xs"
            >
              <Plus className="size-4" />
              <span>Add money</span>
            </button>
            <button
              type="button"
              onClick={() => setTransfer("Withdraw")}
              className="h-11 px-5 rounded-2xl bg-[#F0F2F5] hover:bg-[#E4E7EC] text-[#0A0A0A] font-semibold text-sm flex items-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
            >
              <ArrowUpRight className="size-4" />
              <span>Withdraw</span>
            </button>
          </div>
        </div>

        {/* Wealth Chart & Segment Controls */}
        <div className="mt-8 pt-6 border-t border-black/[0.04]">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center rounded-full bg-[#F0F2F5] p-0.5 border border-black/[0.04]">
              {(["Equity", "PnL", "Volume"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setView(mode)}
                  className={`h-7 px-3 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    view === mode ? "bg-white text-[#0A0A0A] shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <div className="flex items-center rounded-full bg-[#F0F2F5] p-0.5 border border-black/[0.04]">
              {(["1D", "1W", "1M", "3M", "All"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`h-7 px-2.5 rounded-full text-xs font-mono font-semibold transition-all cursor-pointer ${
                    period === p ? "bg-white text-[#0A0A0A] shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="h-44 w-full">
            <ChartCanvas
              height={176}
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
        </div>
      </section>

      {/* 2. Key Performance Indicators (Revolut 4-Card Grid) */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider font-mono">Win Rate</span>
            <Award className="size-4 text-[#00D964]" />
          </div>
          <p className="text-2xl font-bold font-mono text-foreground">{winRate}%</p>
          <span className="text-xs text-muted-foreground font-mono">
            {wins} wins / {t.history.length} trades
          </span>
        </div>

        <div className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider font-mono">Total Volume</span>
            <Activity className="size-4 text-[#2563EB]" />
          </div>
          <p className="text-2xl font-bold font-mono text-foreground">${fmtUsd(volume, 0)}</p>
          <span className="text-xs text-muted-foreground font-mono">Notional turnover</span>
        </div>

        <div className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider font-mono">Best Win</span>
            <Sparkles className="size-4 text-[#D97706]" />
          </div>
          <p className="text-2xl font-bold font-mono text-[#00D964]">
            {t.history.length > 0 ? fmtSigned(bestTrade) : "—"}
          </p>
          <span className="text-xs text-muted-foreground font-mono">Peak single trade</span>
        </div>

        <div className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider font-mono">Fees Paid</span>
            <ShieldCheck className="size-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold font-mono text-foreground">${fmtUsd(feesPaid, 2)}</p>
          <span className="text-xs text-muted-foreground font-mono">Zero gas L1 execution</span>
        </div>
      </section>

      {/* 3. Asset Breakdown & Allocation Bar */}
      <section className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground">Asset Allocation</h2>
            <p className="text-xs text-muted-foreground">Portfolio composition across cash and open positions</p>
          </div>
          <span className="rounded-full bg-[#F0F2F5] px-3 py-1 text-xs font-mono font-semibold text-[#0A0A0A]">
            {assetAllocations.length} Active Assets
          </span>
        </div>

        {/* Multi-segment Allocation Bar */}
        <div className="h-3 w-full rounded-full bg-[#F0F2F5] overflow-hidden flex">
          <div className="bg-[#2563EB] h-full" style={{ width: `${assetAllocations[0]?.pct || 100}%` }} title="USDC" />
          <div className="bg-[#F7931A] h-full" style={{ width: `${assetAllocations[1]?.pct || 0}%` }} title="BTC" />
          <div className="bg-[#627EEA] h-full" style={{ width: `${assetAllocations[2]?.pct || 0}%` }} title="ETH" />
          <div className="bg-[#00D964] h-full" style={{ width: `${assetAllocations[3]?.pct || 0}%` }} title="SOL" />
        </div>

        {/* Asset Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {assetAllocations.map((asset) => (
            <div
              key={asset.symbol}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAFAFC] border border-black/[0.04] hover:border-black/[0.1] transition-all"
            >
              <div className="flex items-center gap-2.5">
                {asset.symbol === "USDC" ? (
                  <div className="size-8 rounded-full bg-[#2775CA] text-white flex items-center justify-center font-bold text-xs">
                    $
                  </div>
                ) : (
                  <MarketLogo symbol={asset.symbol as MarketSymbol} size={32} />
                )}
                <div>
                  <p className="text-xs font-bold text-foreground">{asset.symbol}</p>
                  <p className="text-[11px] text-muted-foreground">{asset.name}</p>
                </div>
              </div>

              <div className="text-right font-mono">
                <p className="text-xs font-bold text-foreground">${fmtUsd(asset.valueUsd, 2)}</p>
                <p className="text-[11px] text-muted-foreground">{asset.pct.toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Positions & Trade History Dock */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-bold text-foreground">Positions &amp; Orders</h2>
          <span className="text-xs font-mono text-muted-foreground">
            {t.positions.length} Open · {t.history.length} Closed
          </span>
        </div>
        <Dock
          feeds={t.feeds}
          open={t.positions}
          history={t.history}
          onSelect={() => {}}
          onClose={t.close}
          onShare={setShare}
        />
      </section>

      <ShareModal trade={share} onOpenChange={(o) => { if (!o) setShare(null); }} />
      {transfer && <TransferDialog mode={transfer} onClose={() => setTransfer(null)} />}
    </main>
  );
}
