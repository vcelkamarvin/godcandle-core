import { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Layers,
  Sparkles,
  Share2,
  Percent,
  DollarSign,
  AlertTriangle,
  MinusCircle,
  XCircle,
  Crosshair,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  type MarketSymbol,
  type PositionRecord,
  type TradeHistoryRecord,
  MARKETS,
  formatPnl,
  formatPct,
  formatUsd,
  calculatePnl,
  calculateLiqDistancePct,
} from "@/lib/five-hundred";
import { MeshGradient } from "./MeshGradient";

interface PositionDockProps {
  openPositions: PositionRecord[];
  history: TradeHistoryRecord[];
  livePriceMap: Record<string, number>;
  onClosePosition: (id: string) => void;
  onReduce50Position: (id: string) => void;
  onSetTargetPrice: (id: string, target: number) => void;
  onShareTrade: (trade: TradeHistoryRecord) => void;
  liquidatingId?: string | null;
  className?: string;
}

export function PositionDock({
  openPositions,
  history,
  livePriceMap,
  onClosePosition,
  onReduce50Position,
  onSetTargetPrice,
  onShareTrade,
  liquidatingId,
  className,
}: PositionDockProps) {
  const [activeTab, setActiveTab] = useState<"open" | "history" | "stats">("open");
  const [editingTargetId, setEditingTargetId] = useState<string | null>(null);
  const [tempTargetInput, setTempTargetInput] = useState<string>("");

  const formatAssetPrice = (symbol: MarketSymbol, price: number): string => {
    const m = MARKETS[symbol];
    if (m) return m.formatPrice(price);
    return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Live timer tick for "Time Open" display
  const [, setTimerTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTimerTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute Stats
  const stats = useMemo(() => {
    if (history.length === 0) {
      return {
        winRate: 0,
        avgHoldSeconds: 0,
        bestTrade: 0,
        worstTrade: 0,
        totalPnl: 0,
        pnlPoints: [] as number[],
      };
    }

    const wins = history.filter((h) => h.pnl > 0).length;
    const winRate = Math.round((wins / history.length) * 100);
    const avgHoldSeconds = Math.round(
      history.reduce((acc, h) => acc + h.durationSeconds, 0) / history.length,
    );
    const bestTrade = Math.max(...history.map((h) => h.pnl));
    const worstTrade = Math.min(...history.map((h) => h.pnl));

    // Cumulative P&L curve for sparkline
    let cum = 0;
    const pnlPoints = [0];
    for (const h of history) {
      cum += h.pnl;
      pnlPoints.push(cum);
    }

    return {
      winRate,
      avgHoldSeconds,
      bestTrade,
      worstTrade,
      totalPnl: cum,
      pnlPoints,
    };
  }, [history]);

  return (
    <div
      className={cn(
        "w-full bg-white border border-border rounded-[24px] p-4 sm:p-5 select-none mt-2 shadow-xs text-foreground",
        className,
      )}
    >
      {/* Dock Tabs Header */}
      <div className="flex flex-wrap items-center justify-between pb-2.5 border-b border-border gap-2">
        <div className="flex items-center gap-1 sm:gap-1.5 bg-secondary/80 p-0.5 rounded-full border border-border/60">
          <button
            type="button"
            onClick={() => setActiveTab("open")}
            className={cn(
              "rounded-full px-3 py-1 text-[12px] font-medium transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === "open"
                ? "bg-white text-foreground shadow-xs font-bold"
                : "bg-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <span>Open</span>
            <span
              className={cn(
                "px-1.5 py-0.2 rounded-full text-xs font-mono",
                openPositions.length > 0 ? "bg-[#3A63E6] text-white" : "bg-black/5 text-muted-foreground",
              )}
            >
              {openPositions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={cn(
              "rounded-full px-3 py-1 text-[12px] font-medium transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === "history"
                ? "bg-white text-foreground shadow-xs font-bold"
                : "bg-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <span>History</span>
            <span className="px-1.5 py-0.2 rounded-full text-xs font-mono bg-black/5 text-muted-foreground">
              {history.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("stats")}
            className={cn(
              "rounded-full px-3 py-1 text-[12px] font-medium transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === "stats"
                ? "bg-white text-foreground shadow-xs font-bold"
                : "bg-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <span>Stats</span>
          </button>
        </div>

        {/* Live Summary Headline */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground hidden md:inline">
            Cumulative Realized P&amp;L:
          </span>
          <span
            className={cn(
              "text-[14px] font-mono font-bold tabular-nums",
              stats.totalPnl >= 0 ? "text-[#00E599]" : "text-[#FF4343]",
            )}
          >
            {formatPnl(stats.totalPnl)}
          </span>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: OPEN POSITIONS (Cards)
          ========================================================================= */}
      {activeTab === "open" && (
        <div className="pt-2">
          {openPositions.length === 0 ? (
            /* Empty State with Signature Mesh Gradient */
            <div className="relative rounded-[16px] overflow-hidden border border-border bg-secondary/40 p-3 text-center select-none min-h-[90px] flex items-center justify-center">
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <MeshGradient animated={true} grainOpacity={0.05} />
              </div>
              <div className="relative z-10 max-w-sm flex items-center justify-center gap-3">
                <div className="size-8 rounded-full bg-white border border-border flex items-center justify-center shrink-0 text-[#2563EB] shadow-xs">
                  <Layers className="size-4" />
                </div>
                <div className="text-left">
                  <h3 className="text-[13px] font-semibold text-foreground">No Open Positions</h3>
                  <p className="text-xs text-muted-foreground leading-snug">
                    Model an ultra-high leverage scalp above. Use the 1000x chip or 1-tap quick
                    trade to test instantaneous liquidation distance.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Cards Grid / Mobile Swipeable Carousel */
            <div className="flex md:grid md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 snap-x snap-mandatory scrollbar-none">
              {openPositions.map((pos) => {
                const mark = livePriceMap[pos.symbol] || pos.entryPrice;
                const notional = pos.stake * pos.leverage;

                // Move pct relative to entry
                const movePct = ((mark - pos.entryPrice) / pos.entryPrice) * 100;
                const currentPnl = calculatePnl(pos.stake, pos.leverage, pos.side, movePct);
                const pnlPct = (currentPnl / pos.stake) * 100;

                // Liquidation distance remaining
                const maxLiqDistPct = calculateLiqDistancePct(pos.leverage);
                const currentDistPct =
                  pos.side === "long"
                    ? ((mark - pos.liqPrice) / pos.entryPrice) * 100
                    : ((pos.liqPrice - mark) / pos.entryPrice) * 100;

                const remainingPct = Math.max(
                  0,
                  Math.min(100, (currentDistPct / maxLiqDistPct) * 100),
                );
                const isDanger = remainingPct < 25;
                const isLiquidating = liquidatingId === pos.id;

                // Duration
                const nowSec = Math.floor(Date.now() / 1000);
                const openSec = Math.floor(pos.openTime / 1000);
                const elapsedSec = Math.max(0, nowSec - openSec);
                const mins = Math.floor(elapsedSec / 60);
                const secs = elapsedSec % 60;
                const durationStr = `${mins}m ${secs.toString().padStart(2, "0")}s`;

                const isProfit = currentPnl >= 0;

                return (
                  <div
                    key={pos.id}
                    className={cn(
                      "min-w-[85vw] sm:min-w-[320px] md:min-w-0 snap-center rounded-[20px] bg-white border border-black/[0.06] overflow-hidden flex flex-col justify-between shadow-xs transition-all duration-300",
                      isLiquidating && "animate-shatter-out border-[#FF3B30]",
                    )}
                  >
                    {/* 1. Header Strip */}
                    <div className="relative h-8 px-3 flex items-center justify-between overflow-hidden select-none bg-[#FAFAFC] border-b border-black/[0.06]">
                      <div className="relative z-10 flex items-center gap-1.5">
                        <span className="font-bold text-[13px] text-foreground tracking-wide">
                          {pos.symbol}/USD
                        </span>
                        <span
                          className={cn(
                            "px-1.5 py-0.2 rounded-full text-xs font-mono font-bold uppercase",
                            pos.side === "long"
                              ? "bg-[#00D964]/10 text-[#00D964] border border-[#00D964]/20"
                              : "bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20",
                          )}
                        >
                          {pos.side}
                        </span>
                      </div>

                      <div className="relative z-10 flex items-center gap-1.5">
                        <span className="px-1.5 py-0.2 rounded-full text-xs font-mono font-bold bg-white text-foreground border border-black/[0.06]">
                          {pos.leverage}x
                        </span>
                        <span className="size-1.5 rounded-full bg-[#00D964]" />
                      </div>
                    </div>

                    {/* 2. Main Card Body */}
                    <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between space-y-2">
                      {/* Live Rolling P&L */}
                      <div className="flex items-baseline justify-between">
                        <div>
                          <div
                            className={cn(
                              "text-[22px] sm:text-[24px] font-bold font-mono tracking-tight leading-none",
                              isProfit ? "text-[#00D964]" : "text-[#FF3B30]",
                            )}
                          >
                            {formatPnl(currentPnl)}
                          </div>
                          <span
                            className={cn(
                              "text-xs font-mono font-semibold",
                              isProfit ? "text-[#00D964]" : "text-[#FF3B30]",
                            )}
                          >
                            {formatPct(pnlPct)} of stake
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">TIME OPEN</span>
                          <span className="text-xs font-mono text-foreground flex items-center justify-end gap-1">
                            <Clock className="size-2.5 text-muted-foreground" />
                            {durationStr}
                          </span>
                        </div>
                      </div>

                      {/* Liquidation Distance Bar */}
                      <div>
                        <div className="flex items-center justify-between text-xs font-mono mb-1">
                          <span className="text-muted-foreground flex items-center gap-1 text-[11px] font-medium">
                            Distance to Liq
                            {isDanger && (
                              <AlertTriangle className="size-3 text-[#FF3B30] animate-pulse" />
                            )}
                          </span>
                          <span
                            className={cn(
                              "font-bold tabular-nums text-xs",
                              isDanger ? "text-[#FF3B30]" : "text-foreground",
                            )}
                          >
                            {Math.max(0, currentDistPct).toFixed(2)}% remaining
                          </span>
                        </div>

                        <div className="w-full h-1.5 rounded-full bg-[#F0F2F5] overflow-hidden p-0.5 border border-black/[0.04]">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-300",
                              isDanger
                                ? "bg-[#FF3B30] animate-soft-pulse"
                                : remainingPct > 50
                                  ? "bg-[#00D964]"
                                  : "bg-[#2563EB]",
                            )}
                            style={{ width: `${Math.round(remainingPct)}%` }}
                          />
                        </div>
                      </div>

                      {/* 6-Metric Details Grid */}
                      <div className="grid grid-cols-3 gap-1.5 p-2 rounded-[14px] bg-[#FAFAFC] border border-black/[0.06] text-xs font-mono">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground block">ENTRY</span>
                          <span className="text-foreground font-semibold text-[12px] sm:text-[13px]">
                            {formatAssetPrice(pos.symbol, pos.entryPrice)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground block">MARK</span>
                          <span className="text-foreground font-semibold text-[12px] sm:text-[13px]">
                            {formatAssetPrice(pos.symbol, mark)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground block">LIQ PRICE</span>
                          <span className="text-[#FF3B30] font-bold text-[12px] sm:text-[13px]">
                            {formatAssetPrice(pos.symbol, pos.liqPrice)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground block">TARGET</span>
                          <span className="text-[#00D964] font-semibold text-[12px] sm:text-[13px]">
                            {pos.targetPrice ? formatAssetPrice(pos.symbol, pos.targetPrice) : "None"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground block">NOTIONAL</span>
                          <span className="text-foreground font-semibold text-[12px] sm:text-[13px]">{formatUsd(notional)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground block">STAKE</span>
                          <span className="text-foreground font-semibold text-[12px] sm:text-[13px]">${pos.stake}</span>
                        </div>
                      </div>

                      {/* Inline Target Price Form if editing */}
                      {editingTargetId === pos.id && (
                        <div className="flex items-center gap-1.5 p-1.5 rounded-[12px] bg-secondary border border-border animate-in fade-in duration-150">
                          <input
                            type="number"
                            value={tempTargetInput}
                            onChange={(e) => setTempTargetInput(e.target.value)}
                            placeholder="Target price..."
                            className="flex-1 bg-transparent text-xs font-mono text-foreground outline-none px-1.5"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const num = parseFloat(tempTargetInput);
                              if (!Number.isNaN(num) && num > 0) {
                                onSetTargetPrice(pos.id, num);
                                toast.success(`Target updated to $${num}`);
                              }
                              setEditingTargetId(null);
                            }}
                            className="px-2.5 py-0.5 rounded-full bg-[#0A0A0A] text-white text-xs font-semibold cursor-pointer active:scale-[0.98]"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTargetId(null)}
                            className="px-1.5 py-0.5 rounded-full text-muted-foreground text-xs cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                      {/* Actions Strip */}
                      <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={() => onClosePosition(pos.id)}
                          className="h-7 rounded-full bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 border border-[#FF3B30]/20 text-[#FF3B30] font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-[0.98]"
                          title="Close position at current mark price"
                        >
                          <XCircle className="size-3" />
                          <span>Close</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onReduce50Position(pos.id)}
                          className="h-7 rounded-full bg-[#F0F2F5] hover:bg-[#E4E7EC] border border-black/[0.04] text-foreground font-semibold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-[0.98]"
                          title="Reduce position stake and notional by 50%"
                        >
                          <MinusCircle className="size-3" />
                          <span>Reduce 50%</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingTargetId(pos.id);
                            setTempTargetInput(pos.targetPrice ? pos.targetPrice.toString() : "");
                            toast.info("Drag the target line on the chart to set take-profit");
                          }}
                          className="h-7 rounded-full bg-[#F0F2F5] hover:bg-[#E4E7EC] border border-black/[0.04] text-foreground font-semibold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-[0.98]"
                          title="Add take-profit: drag a line on the chart to set it"
                        >
                          <Crosshair className="size-3 text-[#00D964]" />
                          <span>{pos.targetPrice ? "Take Profit" : "Add take-profit"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: ORDER HISTORY
          ========================================================================= */}
      {activeTab === "history" && (
        <div className="pt-2 overflow-x-auto">
          {history.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground text-[12px]">
              No trade history yet. Close a simulated trade to see verified payoff results here.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground font-mono font-semibold">
                  <th className="pb-2 font-semibold">Asset</th>
                  <th className="pb-2 font-semibold">Side</th>
                  <th className="pb-2 font-semibold">Leverage</th>
                  <th className="pb-2 font-semibold">Entry / Exit</th>
                  <th className="pb-2 font-semibold">P&amp;L</th>
                  <th className="pb-2 font-semibold">Duration</th>
                  <th className="pb-2 font-semibold text-right">Card</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-[12px] font-mono">
                {history.map((row) => {
                  const isProfit = row.pnl >= 0;
                  return (
                    <tr key={row.id} className="h-10 hover:bg-secondary/40 transition-colors">
                      <td className="font-bold text-foreground">{row.symbol}</td>
                      <td>
                        <span
                          className={cn(
                            "px-1.5 py-0.2 rounded-full text-xs font-bold uppercase",
                            row.side === "long"
                              ? "bg-[#087F4D]/10 text-[#087F4D]"
                              : "bg-[#D92D45]/10 text-[#D92D45]",
                          )}
                        >
                          {row.side}
                        </span>
                      </td>
                      <td className="text-foreground">{row.leverage}x</td>
                      <td className="text-muted-foreground">
                        {formatAssetPrice(row.symbol, row.entryPrice)} →{" "}
                        {formatAssetPrice(row.symbol, row.exitPrice)}
                      </td>
                      <td
                        className={cn("font-bold", isProfit ? "text-[#087F4D]" : "text-[#D92D45]")}
                      >
                        {formatPnl(row.pnl)} ({formatPct(row.pnlPct)})
                      </td>
                      <td className="text-muted-foreground">{row.durationSeconds}s</td>
                      <td className="text-right">
                        <button
                          type="button"
                          onClick={() => onShareTrade(row)}
                          className="h-6 px-2.5 rounded-full bg-secondary hover:bg-[#2563EB] hover:text-white border border-border text-muted-foreground text-xs font-medium transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <Share2 className="size-2.5" />
                          <span>Share</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: STATS & P&L CURVE SPARKLINE
          ========================================================================= */}
      {activeTab === "stats" && (
        <div className="pt-2 space-y-3">
          {/* 4 Inset Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="p-2.5 rounded-[16px] bg-secondary/50 border border-border/60">
              <span className="text-xs font-mono text-muted-foreground block mb-0.5">WIN RATE</span>
              <span className="text-[20px] font-bold font-mono text-foreground tracking-tight">
                {stats.winRate}%
              </span>
            </div>

            <div className="p-2.5 rounded-[16px] bg-secondary/50 border border-border/60">
              <span className="text-xs font-mono text-muted-foreground block mb-0.5">
                AVG HOLD TIME
              </span>
              <span className="text-[20px] font-bold font-mono text-foreground tracking-tight">
                {stats.avgHoldSeconds}s
              </span>
            </div>

            <div className="p-2.5 rounded-[16px] bg-secondary/50 border border-border/60">
              <span className="text-xs font-mono text-muted-foreground block mb-0.5">BEST TRADE</span>
              <span className="text-[20px] font-bold font-mono text-[#087F4D] tracking-tight">
                {formatPnl(stats.bestTrade)}
              </span>
            </div>

            <div className="p-2.5 rounded-[16px] bg-secondary/50 border border-border/60">
              <span className="text-xs font-mono text-muted-foreground block mb-0.5">WORST TRADE</span>
              <span className="text-[20px] font-bold font-mono text-[#D92D45] tracking-tight">
                {formatPnl(stats.worstTrade)}
              </span>
            </div>
          </div>

          {/* Cumulative P&L Curve Sparkline */}
          <div className="p-5 rounded-[20px] bg-secondary/40 border border-border/60">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-mono font-medium text-foreground">
                Cumulative P&amp;L Curve
              </span>
              <span
                className={cn(
                  "text-[13px] font-mono font-bold",
                  stats.totalPnl >= 0 ? "text-[#087F4D]" : "text-[#D92D45]",
                )}
              >
                Net: {formatPnl(stats.totalPnl)}
              </span>
            </div>

            {/* SVG Sparkline */}
            <div className="h-32 w-full relative">
              {stats.pnlPoints.length < 2 ? (
                <div className="h-full flex items-center justify-center text-[12px] text-muted-foreground font-mono">
                  Closed trades will generate live equity sparkline here.
                </div>
              ) : (
                (() => {
                  const pts = stats.pnlPoints;
                  const min = Math.min(...pts);
                  const max = Math.max(...pts);
                  const range = Math.max(1, max - min);
                  const width = 800;
                  const height = 120;

                  const coords = pts.map((val, idx) => {
                    const x = (idx / (pts.length - 1)) * width;
                    const y = height - 10 - ((val - min) / range) * (height - 20);
                    return { x, y };
                  });

                  const pathD = coords.reduce(
                    (acc, c, idx) => `${acc} ${idx === 0 ? "M" : "L"} ${c.x} ${c.y}`,
                    "",
                  );

                  const isNetProfit = stats.totalPnl >= 0;

                  return (
                    <svg
                      viewBox={`0 0 ${width} ${height}`}
                      className="w-full h-full overflow-visible"
                    >
                      {/* Zero baseline */}
                      {min <= 0 && max >= 0 && (
                        <line
                          x1="0"
                          y1={height - 10 - ((0 - min) / range) * (height - 20)}
                          x2={width}
                          y2={height - 10 - ((0 - min) / range) * (height - 20)}
                          stroke="rgba(0, 0, 0, 0.12)"
                          strokeDasharray="4 4"
                        />
                      )}

                      <path
                        d={pathD}
                        fill="none"
                        stroke={isNetProfit ? "#087F4D" : "#D92D45"}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {coords.map((c, i) => (
                        <circle
                          key={i}
                          cx={c.x}
                          cy={c.y}
                          r="3"
                          fill={isNetProfit ? "#087F4D" : "#D92D45"}
                        />
                      ))}
                    </svg>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
