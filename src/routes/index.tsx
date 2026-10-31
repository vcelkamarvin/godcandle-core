import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dock } from "@/components/godcandle/Dock";
import { PriceChart } from "@/components/godcandle/PriceChart";
import { TradingViewWidget, type TVInterval } from "@/components/godcandle/TradingViewWidget";
import { TradePanel } from "@/components/godcandle/TradePanel";
import { MarketBar } from "@/components/godcandle/MarketBar";
import { ShareModal } from "@/components/godcandle/ShareModal";
import { useTrading } from "@/components/godcandle/TradingProvider";
import { getMarket, type MarketSymbol } from "@/config/markets";
import { fmtSigned, fmtUsd, pnlOf, type ClosedTrade } from "@/lib/engine";
import { Zap, BarChart2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "godcandle — 1000x Synthetic Perps" },
      {
        name: "description",
        content:
          "High-leverage synthetic derivative exchange and gamified trading arena on HyperEVM. Mark-clamped BBO execution, zero entry fee.",
      },
      { property: "og:title", content: "godcandle — 1000x Synthetic Perps" },
      {
        property: "og:description",
        content: "Zero entry fees, zero slippage, mark-clamped BBO on HyperEVM.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Terminal,
});

const TIMEFRAMES: Array<{ label: string; ms: number; tvInterval?: TVInterval }> = [
  { label: "Tick", ms: 30000, tvInterval: "1" },
  { label: "1m", ms: 60000, tvInterval: "1" },
  { label: "5m", ms: 30000, tvInterval: "5" },
  { label: "15m", ms: 900000, tvInterval: "15" },
  { label: "1h", ms: 3600000, tvInterval: "60" },
  { label: "4h", ms: 14400000, tvInterval: "240" },
  { label: "1D", ms: 86400000, tvInterval: "D" },
];

function Terminal() {
  const t = useTrading();
  const [market, setMarket] = useState<MarketSymbol>("BTC");
  const [stake, setStake] = useState(50);
  const [leverage, setLeverage] = useState(500);
  const [chartMode, setChartMode] = useState<"reactive" | "tradingview">("reactive");
  const [windowMs, setWindow] = useState(30000);
  const [tvInterval, setTvInterval] = useState<TVInterval>("15");
  const [share, setShare] = useState<ClosedTrade | null>(null);

  const select = (s: MarketSymbol) => {
    setMarket(s);
    setLeverage((l) => Math.min(l, getMarket(s).maxLeverage));
  };

  const m = getMarket(market);
  const feed = t.feeds[market];
  const pos = t.positions.find((p) => p.market === market) ?? null;
  const pnl = pos ? pnlOf(pos, feed.price) : 0;
  const change = (feed.price / feed.open24 - 1) * 100;

  const handleTimeframeChange = (tf: (typeof TIMEFRAMES)[number]) => {
    setWindow(tf.ms);
    if (tf.tvInterval) {
      setTvInterval(tf.tvInterval);
    }
  };

  return (
    <main className="font-sans">
      {/* Top Interactive Market Bar & Cmd+K Search */}
      <MarketBar market={market} onSelect={select} />

      <div className="grid min-w-0 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Left Section: Live Chart, 24h Stats, and Position Dock */}
        <div className="min-w-0 px-4 py-3 sm:px-5 lg:px-6">
          {/* Headline Price & Controls Header */}
          <section className="flex flex-wrap items-end justify-between gap-3 pb-2.5">
            <div>
              <p className="mb-1.5 flex items-center gap-2 text-xs font-semibold tracking-tight text-foreground">
                <span>{market}-USD</span>
                <span className="rounded bg-secondary border border-border px-2 py-0.5 text-[9px] font-normal text-muted-foreground">
                  Perp · {m.maxLeverage}x max
                </span>
                <span className="rounded bg-secondary border border-border px-2 py-0.5 text-[9px] font-mono text-muted-foreground">
                  BBO 1.5 bps Clamped
                </span>
              </p>

              <div className="flex flex-wrap items-baseline gap-2.5">
                <h1 className="tabular text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                  ${fmtUsd(feed.price, m.decimals)}
                </h1>
                <span
                  className={`tabular rounded-lg px-2 py-0.5 text-xs font-semibold ${
                    change >= 0 ? "bg-[#E3F8EC] text-[#06964A]" : "bg-[#FFECEA] text-[#FF3B30]"
                  }`}
                >
                  {change >= 0 ? "+" : ""}
                  {change.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Right Controls: Chart Mode Toggle & Timeframes */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Chart Mode Switcher */}
              <div className="flex items-center rounded-full bg-secondary p-1 border border-border/60">
                <Button
                  variant="terminal"
                  onClick={() => setChartMode("reactive")}
                  className={`pill h-7 px-3 text-[11px] font-medium gap-1.5 transition-all ${
                    chartMode === "reactive"
                      ? "pill-ink shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/50"
                  }`}
                >
                  <Zap className="size-3 text-[#FFD60A]" />
                  <span>1000x Tick</span>
                </Button>
                <Button
                  variant="terminal"
                  onClick={() => setChartMode("tradingview")}
                  className={`pill h-7 px-3 text-[11px] font-medium gap-1.5 transition-all ${
                    chartMode === "tradingview"
                      ? "pill-ink shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/50"
                  }`}
                >
                  <BarChart2 className="size-3 text-[#00D964]" />
                  <span>TradingView</span>
                </Button>
              </div>

              {/* Timeframe Interval Pills */}
              <div className="flex items-center rounded-full bg-secondary p-1 border border-border/60">
                {TIMEFRAMES.map((tf) => {
                  const isActive =
                    chartMode === "reactive" ? windowMs === tf.ms : tvInterval === tf.tvInterval;

                  return (
                    <Button
                      key={tf.label}
                      variant="terminal"
                      onClick={() => handleTimeframeChange(tf)}
                      className={`pill h-7 px-2.5 text-[10px] font-medium transition-all ${
                        isActive
                          ? "pill-ink shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/50"
                      }`}
                    >
                      {tf.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Main Chart Section */}
          <section className="relative overflow-hidden rounded-3xl border border-border bg-white shadow-xs">
            {/* Subtle Rainbow Top Accent */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#CDC3F0] via-[#FFDAC8] to-[#A0D4CA] opacity-80" />

            <div className="flex items-center justify-between border-b border-border/60 px-4 py-2 text-[10px]">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 font-semibold text-[#06964A]">
                  <span className="size-1.5 rounded-full bg-[#00D964] animate-pulse" />
                  {chartMode === "reactive" ? "HyperEVM L1Read Feed (0x0806)" : "TradingView Live Candles"}
                </span>
                <span className="hidden text-muted-foreground sm:inline font-mono">
                  Corridor ±1.5 bps · Zero Slippage
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-mono text-[9px] uppercase tracking-wider">
                  Settlement: FIFO Block
                </span>
              </div>
            </div>

            {/* Dynamic Chart Display */}
            <div className="h-[320px] sm:h-[370px] w-full">
              {chartMode === "reactive" ? (
                <PriceChart
                  market={market}
                  windowMs={windowMs}
                  position={pos}
                  pnlLabel={fmtSigned(pnl)}
                  pnlPositive={pnl >= 0}
                  onClose={() => t.close(market)}
                />
              ) : (
                <TradingViewWidget market={market} interval={tvInterval} height="100%" />
              )}
            </div>
          </section>

          {/* 24h Market Stats Grid */}
          <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2.5 rounded-2xl bg-secondary p-2.5 text-xs">
            <div>
              <p className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
                24h Open
              </p>
              <p className="tabular mt-0.5 font-semibold text-foreground">
                ${fmtUsd(feed.open24, m.decimals)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
                Max Leverage
              </p>
              <p className="tabular mt-0.5 font-semibold text-foreground">
                {m.maxLeverage}x Isolated
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
                Precompile Latency
              </p>
              <p className="tabular mt-0.5 font-semibold text-[#06964A]">48ms L1Read</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
                Settlement Pool
              </p>
              <p className="mt-0.5 font-semibold capitalize text-foreground">{feed.status}</p>
            </div>
          </div>

          {/* Trade Dock (Open Positions, History, Share PnL) */}
          <div className="mt-3.5 border-t border-border pt-3">
            <Dock
              feeds={t.feeds}
              open={t.positions}
              history={t.history}
              onSelect={select}
              onClose={t.close}
              onShare={setShare}
            />
          </div>
        </div>

        {/* Right Sidebar: Optimized Compact Trade Execution Terminal */}
        <aside className="border-t border-border lg:border-l lg:border-t-0 bg-white/70">
          <TradePanel
            key={market}
            market={market}
            status={feed.status}
            price={feed.price}
            stake={stake}
            setStake={setStake}
            leverage={leverage}
            setLeverage={setLeverage}
            position={pos}
            onOpen={(side) => t.open(market, side, stake, leverage)}
            onClose={() => t.close(market)}
            limitReached={t.positions.length >= 3}
            available={t.available}
          />
        </aside>
      </div>

      {/* Share PnL Modal */}
      <ShareModal
        trade={share}
        onOpenChange={(open) => {
          if (!open) setShare(null);
        }}
      />
    </main>
  );
}
