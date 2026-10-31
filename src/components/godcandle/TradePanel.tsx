import { Plus, TrendingDown, TrendingUp, ShieldAlert, Zap, X, AlertTriangle, Key } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getMarket, type MarketSymbol, type MarketStatus } from "@/config/markets";
import {
  LEVERAGES,
  fmtSigned,
  fmtUsd,
  pnlOf,
  type Position,
  type Side,
} from "@/lib/engine";
import { MarginDialog } from "./MarginDialog";
import { toast } from "sonner";
import { useTrading } from "./TradingProvider";
import { hyperliquidEngineInstance } from "@/lib/engine/hyperliquid";

interface Props {
  market: MarketSymbol;
  status: MarketStatus;
  price: number;
  stake: number;
  setStake: (n: number) => void;
  leverage: number;
  setLeverage: (n: number) => void;
  position: Position | null;
  positions?: Position[];
  onOpen: (s: Side, tp?: number | null, sl?: number | null) => void;
  onClose: (idOrMarket?: string) => void;
  limitReached: boolean;
  available: number;
}

export function TradePanel(p: Props) {
  const [marginOpen, setMarginOpen] = useState(false);
  const [tpMode, setTpMode] = useState<"price" | "roi">("roi");
  const [tpValue, setTpValue] = useState("");
  const [slMode, setSlMode] = useState<"price" | "roi">("roi");
  const [slValue, setSlValue] = useState("");
  const [pendingConfirmSide, setPendingConfirmSide] = useState<Side | null>(null);

  const t = useTrading();
  const m = getMarket(p.market);
  const activePositions = p.positions ?? (p.position ? [p.position] : []);
  const stakes = [10, 25, 50, 100, 250, 500];

  const maxAllowedLev = t.engine.getMaxLeverage(p.market);
  const isPerps = t.mode === "perps";

  // Compute dynamic leverage choices
  const availableLevs = isPerps
    ? [1, Math.round(maxAllowedLev * 0.1), Math.round(maxAllowedLev * 0.25), Math.round(maxAllowedLev * 0.5), maxAllowedLev]
        .filter((l, idx, arr) => l >= 1 && l <= maxAllowedLev && arr.indexOf(l) === idx)
    : [50, 100, 250, 500, 1000].filter((l) => l <= maxAllowedLev);

  // Compute order summary panel authoritative numbers directly from active TradingEngine
  const quote = t.engine.quote(
    {
      asset: p.market,
      side: "long",
      margin: p.stake,
      leverage: p.leverage,
    },
    p.price
  );

  const blocked = p.status !== "open" || p.limitReached || Boolean(quote.error);

  const computeTargetPrice = (side: Side, type: "tp" | "sl"): number | null => {
    const rawVal = type === "tp" ? parseFloat(tpValue) : parseFloat(slValue);
    if (isNaN(rawVal) || rawVal === 0) return null;

    const mode = type === "tp" ? tpMode : slMode;
    if (mode === "price") return rawVal;

    const val = Math.abs(rawVal);
    const roiFraction = val / 100;
    if (side === "long") {
      return type === "tp"
        ? p.price * (1 + roiFraction / p.leverage)
        : p.price * (1 - roiFraction / p.leverage);
    } else {
      return type === "tp"
        ? p.price * (1 - roiFraction / p.leverage)
        : p.price * (1 + roiFraction / p.leverage);
    }
  };

  const executeOrder = (side: Side) => {
    const tpPrice = computeTargetPrice(side, "tp");
    const slPrice = computeTargetPrice(side, "sl");
    p.onOpen(side, tpPrice, slPrice);
    setTpValue("");
    setSlValue("");
    setPendingConfirmSide(null);
  };

  const handleOpen = (side: Side) => {
    if (quote.error) {
      toast.error(quote.error);
      return;
    }

    if (isPerps && !t.isAgentApproved) {
      toast.error("Please approve 1-Click Agent Key first");
      return;
    }

    const tpPrice = computeTargetPrice(side, "tp");
    const slPrice = computeTargetPrice(side, "sl");

    if (side === "long") {
      if (tpPrice != null && tpMode === "price" && tpPrice <= p.price) {
        toast.error("Take Profit must be higher than current price for Long");
        return;
      }
      if (slPrice != null && slMode === "price" && slPrice >= p.price) {
        toast.error("Stop Loss must be lower than current price for Long");
        return;
      }
    } else {
      if (tpPrice != null && tpMode === "price" && tpPrice >= p.price) {
        toast.error("Take Profit must be lower than current price for Short");
        return;
      }
      if (slPrice != null && slMode === "price" && slPrice <= p.price) {
        toast.error("Stop Loss must be higher than current price for Short");
        return;
      }
    }

    // First live order of session confirmation requirement in Perps mode
    if (isPerps && !hyperliquidEngineInstance.hasConfirmedFirstOrder()) {
      setPendingConfirmSide(side);
      return;
    }

    executeOrder(side);
  };

  return (
    <div className="p-3 space-y-2 font-mono text-xs">
      {/* Top Header: Mode & Live Status */}
      <div className="flex items-center justify-between pb-1 border-b border-hairline">
        <div className="flex items-center gap-1.5">
          <h2 className="text-xs font-bold tracking-tight text-foreground font-mono">
            ORDER FORM
          </h2>
          {isPerps ? (
            <span className="flex items-center gap-1 rounded bg-[#E3F8EC] border border-[#06964A]/30 px-1.5 py-0.5 text-[9px] font-bold text-[#06964A]">
              <span className="size-1.5 rounded-full bg-[#06964A] animate-pulse" />
              LIVE · REAL FUNDS
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded bg-[#FFF4E5] border border-[#D97706]/30 px-1.5 py-0.5 text-[9px] font-bold text-[#D97706]">
              TEST · PAPER
            </span>
          )}
          <span className="rounded-sm bg-secondary border border-border px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            {p.market}-USD · {maxAllowedLev}x max
          </span>
        </div>
        <span className="rounded-sm bg-foreground text-background px-2 py-0.5 text-[10px] font-mono font-semibold">
          MARKET
        </span>
      </div>

      {/* Discrete Isolated Position Slugs for this market */}
      {activePositions.length > 0 && (
        <div className="space-y-1.5">
          {activePositions.map((pos) => {
            const pnl = pnlOf(pos, p.price);
            const roi = (pnl / pos.stake) * 100;
            const isUp = pnl >= 0;
            return (
              <div
                key={pos.id}
                className={`rounded-md border p-1.5 text-[10px] font-mono transition-all ${
                  isUp ? "border-[#00D964]/40 bg-[#E3F8EC]/60" : "border-[#FF3B30]/40 bg-[#FFECEA]/60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`rounded-sm px-1.5 py-0.2 text-[9px] uppercase font-bold text-white ${
                        pos.side === "long" ? "bg-[#06964A]" : "bg-[#FF3B30]"
                      }`}
                    >
                      {pos.side} {pos.leverage}x
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      ${fmtUsd(pos.stake, 0)}
                    </span>
                    <span
                      className={`tabular font-bold text-[10px] ${
                        isUp ? "text-[#06964A]" : "text-[#FF3B30]"
                      }`}
                    >
                      {fmtSigned(pnl)} ({roi >= 0 ? "+" : ""}{roi.toFixed(1)}%)
                    </span>
                    {pos.tp && (
                      <span className="text-[#00D964] text-[9px]">
                        TP ${fmtUsd(pos.tp, m.decimals)}
                      </span>
                    )}
                    {pos.sl && (
                      <span className="text-[#FF3B30] text-[9px]">
                        SL ${fmtUsd(pos.sl, m.decimals)}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => p.onClose(pos.id)}
                    className="rounded-sm bg-foreground/10 hover:bg-foreground/20 text-foreground px-1.5 py-0.5 text-[9px] font-mono font-bold transition-colors ml-1"
                  >
                    Close
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Section 1: Margin Selector (Compact Row) */}
      <section className="space-y-1">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="font-semibold uppercase tracking-wider">MARGIN (USDC)</span>
          <span className="tabular">
            AVAIL: <strong className="text-foreground">${fmtUsd(p.available, 0)}</strong>
          </span>
        </div>

        <div className="grid grid-cols-6 gap-1">
          {stakes.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => p.setStake(s)}
              className={`tabular h-7 rounded-sm text-xs font-mono font-medium transition-all ${
                s === p.stake
                  ? "bg-foreground text-background font-bold shadow-xs"
                  : "bg-secondary hover:bg-secondary/80 text-foreground border border-border/50"
              }`}
            >
              ${s}
            </button>
          ))}
        </div>

        {/* Inline Custom Margin Trigger */}
        <button
          type="button"
          onClick={() => setMarginOpen(true)}
          className="flex w-full items-center justify-between rounded-md border border-hairline bg-card px-2 py-1 text-[10px] font-mono text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
        >
          <span>
            SELECTED: <strong className="tabular text-foreground">${fmtUsd(p.stake)}</strong>
          </span>
          <span className="flex items-center gap-1 text-[9px] font-bold text-foreground">
            CUSTOM <Plus className="size-2.5" />
          </span>
        </button>
      </section>

      {/* Section 2: Leverage Control (Compact Slider + Badges) */}
      <section className="rounded-md border border-hairline bg-secondary/50 p-2 space-y-1.5 font-mono">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            LEVERAGE
          </span>
          <span className="inline-flex items-center gap-1 rounded-sm bg-foreground px-1.5 py-0.5 text-[11px] font-bold text-background tabular">
            <Zap className="size-2.5 text-[#FFD60A]" />
            {p.leverage}×
          </span>
        </div>

        {/* Range Slider */}
        <div className="px-0.5">
          <input
            aria-label="Leverage slider"
            type="range"
            min="0"
            max={availableLevs.length - 1}
            step="1"
            value={Math.max(0, availableLevs.indexOf(p.leverage))}
            onChange={(e) => {
              const idx = Number(e.target.value);
              const lev = availableLevs[idx];
              if (lev) p.setLeverage(lev);
            }}
            className="w-full h-1 bg-border rounded-xs appearance-none cursor-pointer accent-foreground"
          />
        </div>

        {/* Quick Leverage Pill Buttons */}
        <div className="flex gap-1">
          {availableLevs.map((lev) => (
            <button
              key={lev}
              type="button"
              onClick={() => p.setLeverage(lev)}
              className={`tabular h-5 flex-1 rounded-sm text-[10px] font-mono font-medium transition-all ${
                p.leverage === lev
                  ? "bg-foreground text-background font-bold shadow-xs"
                  : "bg-white/80 hover:bg-white text-muted-foreground hover:text-foreground border border-border/40"
              }`}
            >
              {lev}x
            </button>
          ))}
        </div>
      </section>

      {/* Section 3: Summary Technical Risk & Execution Box (Computed by Active Engine) */}
      <div className="rounded-md border border-hairline bg-[#F8F8F7] p-2 space-y-1 font-mono text-[10px]">
        <div className="flex justify-between items-center text-muted-foreground">
          <span>POSITION NOTIONAL</span>
          <span className="text-foreground font-bold tabular">${fmtUsd(quote.notional, 0)} USDC</span>
        </div>
        <div className="flex justify-between items-center text-muted-foreground">
          <span>EXECUTION PRICE</span>
          <span className="font-bold text-foreground tabular">
            ${fmtUsd(quote.execPrice, m.decimals)}
          </span>
        </div>
        <div className="flex justify-between items-center text-muted-foreground">
          <span>EST. BUST DISTANCE</span>
          <span className="text-[#FF3B30] font-semibold tabular">
            -{quote.estBustDistanceBps.toFixed(1)} bps (-{quote.estBustDistancePct.toFixed(2)}%)
          </span>
        </div>
        <div className="flex justify-between items-center text-muted-foreground">
          <span>LIQUIDATION (L / S)</span>
          <span className="tabular text-foreground">
            ${fmtUsd(quote.longBustPrice, m.decimals)} / ${fmtUsd(quote.shortBustPrice, m.decimals)}
          </span>
        </div>
        {/* Fees */}
        <div className="border-t border-border/50 pt-1 flex justify-between items-center text-muted-foreground text-[9px]">
          <span>FEES</span>
          <div className="flex items-center gap-1.5 font-semibold">
            {isPerps ? (
              <>
                <span className="text-foreground">0.035% Taker</span>
                {quote.builderFeeUsd > 0 && (
                  <span className="text-[#5E5CE6]">
                    +Builder (${fmtUsd(quote.builderFeeUsd, 2)})
                  </span>
                )}
              </>
            ) : (
              <span className="text-[#06964A]">0% Entry</span>
            )}
          </div>
        </div>
      </div>

      {/* Validation Error Display */}
      {quote.error && (
        <div className="p-2 rounded bg-[#FFECEA] border border-[#FF3B30]/30 text-[#FF3B30] text-[10px] font-mono flex items-center gap-1.5">
          <AlertTriangle className="size-3.5 shrink-0" />
          <span>{quote.error}</span>
        </div>
      )}

      {/* 1-Click Agent Approval Notice if not approved in Perps mode */}
      {isPerps && !t.isAgentApproved && (
        <div className="p-2 rounded bg-[#EFEFFC] border border-[#5E5CE6]/30 text-[10px] font-mono flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-foreground">
            <Key className="size-3 text-[#5E5CE6] shrink-0" />
            <span>Agent Key Required</span>
          </div>
          <button
            type="button"
            onClick={() => t.approveAgent()}
            className="px-2 py-0.5 rounded bg-foreground text-background font-bold hover:opacity-90 transition-opacity"
          >
            Approve Key
          </button>
        </div>
      )}

      {/* Section 4: Compact TP & SL Inputs Row */}
      <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
        {/* Take Profit */}
        <div className="flex items-center gap-1 rounded-md border border-border/60 bg-secondary/50 px-2 py-1">
          <span className="text-[10px] font-bold text-[#00D964]">TP</span>
          <input
            type="number"
            step="any"
            placeholder={tpMode === "roi" ? "+% ROI" : "Price"}
            value={tpValue}
            onChange={(e) => setTpValue(e.target.value)}
            className="w-full bg-transparent font-mono text-[11px] text-foreground focus:outline-none placeholder:text-muted-foreground/60"
          />
          <button
            type="button"
            onClick={() => setTpMode((prev) => (prev === "roi" ? "price" : "roi"))}
            title={tpMode === "roi" ? "Switch to target Price" : "Switch to target ROI %"}
            className="rounded-sm bg-background px-1 py-0.5 text-[9px] font-bold text-muted-foreground hover:text-foreground border border-border/40"
          >
            {tpMode === "roi" ? "%" : "$"}
          </button>
        </div>

        {/* Stop Loss */}
        <div className="flex items-center gap-1 rounded-md border border-border/60 bg-secondary/50 px-2 py-1">
          <span className="text-[10px] font-bold text-[#FF3B30]">SL</span>
          <input
            type="number"
            step="any"
            placeholder={slMode === "roi" ? "-% ROI" : "Price"}
            value={slValue}
            onChange={(e) => setSlValue(e.target.value)}
            className="w-full bg-transparent font-mono text-[11px] text-foreground focus:outline-none placeholder:text-muted-foreground/60"
          />
          <button
            type="button"
            onClick={() => setSlMode((prev) => (prev === "roi" ? "price" : "roi"))}
            title={slMode === "roi" ? "Switch to target Price" : "Switch to target ROI %"}
            className="rounded-sm bg-background px-1 py-0.5 text-[9px] font-bold text-muted-foreground hover:text-foreground border border-border/40"
          >
            {slMode === "roi" ? "%" : "$"}
          </button>
        </div>
      </div>

      {/* Section 5: Dual Order Execution Buttons (Compact & High Contrast) */}
      <div className="grid grid-cols-2 gap-1.5 pt-0.5">
        {/* Long Trigger */}
        <Button
          disabled={blocked}
          variant="terminal"
          onClick={() => handleOpen("long")}
          className="h-10 rounded-md bg-[#06964A] hover:bg-[#058240] text-white font-mono flex flex-col justify-center items-center gap-0 shadow-xs active:scale-[0.99] transition-all disabled:opacity-50"
        >
          <span className="flex items-center gap-1 text-xs font-bold tracking-wide">
            <TrendingUp className="size-3 stroke-[2.5]" />
            LONG {p.leverage}×
          </span>
          <span className="tabular text-[9px] font-mono opacity-90">
            Liq ${fmtUsd(quote.longBustPrice, m.decimals)}
          </span>
        </Button>

        {/* Short Trigger */}
        <Button
          disabled={blocked}
          variant="terminal"
          onClick={() => handleOpen("short")}
          className="h-10 rounded-md bg-[#FF3B30] hover:bg-[#E0342A] text-white font-mono flex flex-col justify-center items-center gap-0 shadow-xs active:scale-[0.99] transition-all disabled:opacity-50"
        >
          <span className="flex items-center gap-1 text-xs font-bold tracking-wide">
            <TrendingDown className="size-3 stroke-[2.5]" />
            SHORT {p.leverage}×
          </span>
          <span className="tabular text-[9px] font-mono opacity-90">
            Liq ${fmtUsd(quote.shortBustPrice, m.decimals)}
          </span>
        </Button>
      </div>

      {/* Status Alert if blocked */}
      {blocked && !quote.error && (
        <div className="flex items-center justify-center gap-1.5 rounded-md bg-[#FFECEA] py-1 text-[10px] font-mono font-medium text-[#FF3B30]">
          <ShieldAlert className="size-3" />
          <span>{p.limitReached ? "Max 3 open positions reached" : `Market status: ${p.status}`}</span>
        </div>
      )}

      {/* Custom Margin Dialog */}
      {marginOpen && (
        <MarginDialog
          open={marginOpen}
          onOpenChange={setMarginOpen}
          stake={p.stake}
          available={p.available}
          min={m.minStake}
          max={m.maxStake}
          onApply={p.setStake}
        />
      )}

      {/* First Live Order Confirmation Modal */}
      {pendingConfirmSide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-xl border border-border bg-white p-5 shadow-xl space-y-4 font-mono text-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <span className="flex items-center gap-1 rounded bg-[#E3F8EC] border border-[#06964A]/30 px-2 py-0.5 text-[10px] font-bold text-[#06964A]">
                <span className="size-1.5 rounded-full bg-[#06964A]" />
                LIVE · REAL FUNDS
              </span>
              <span className="font-bold text-foreground">Confirm Live Order</span>
            </div>

            <p className="text-muted-foreground text-[11px] leading-relaxed">
              You are about to place a <strong className="text-foreground">{pendingConfirmSide.toUpperCase()}</strong> order on{" "}
              <strong className="text-foreground">{p.market}</strong> using real funds on Hyperliquid.
            </p>

            <div className="space-y-1.5 bg-[#F6F6F4] p-3 rounded-lg border border-border text-[11px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Side</span>
                <span className={pendingConfirmSide === "long" ? "text-[#06964A] font-bold" : "text-[#FF3B30] font-bold"}>
                  {pendingConfirmSide.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Isolated Margin</span>
                <span className="font-bold">${p.stake} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Leverage</span>
                <span className="font-bold">{p.leverage}×</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Notional</span>
                <span className="font-bold">${quote.notional.toLocaleString()} USDC</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPendingConfirmSide(null)}
                className="h-8 rounded-md border border-border bg-white text-muted-foreground hover:bg-[#F6F6F4] font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executeOrder(pendingConfirmSide)}
                className="h-8 rounded-md bg-foreground text-background hover:opacity-90 font-bold text-xs shadow-xs"
              >
                Confirm & Place
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
