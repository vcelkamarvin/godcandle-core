import { Plus, TrendingDown, TrendingUp, ShieldAlert, Zap } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getMarket, type MarketSymbol, type MarketStatus } from "@/config/markets";
import {
  LEVERAGES,
  feeUsd,
  liqPrice,
  liqDistancePct,
  fmtSigned,
  fmtUsd,
  pnlOf,
  liquidation,
  positionFee,
  type Position,
  type Side,
} from "@/lib/engine";
import { MarginDialog } from "./MarginDialog";
import { MarketLogo } from "./MarketLogo";

interface Props {
  market: MarketSymbol;
  status: MarketStatus;
  price: number;
  stake: number;
  setStake: (n: number) => void;
  leverage: number;
  setLeverage: (n: number) => void;
  position: Position | null;
  onOpen: (s: Side) => void;
  onClose: () => void;
  limitReached: boolean;
  available: number;
}

export function TradePanel(p: Props) {
  const [marginOpen, setMarginOpen] = useState(false);
  const m = getMarket(p.market);
  const pnl = p.position ? pnlOf(p.position, p.price) : 0;
  const blocked = p.status !== "open" || p.limitReached;
  const stakes = [10, 25, 50, 100, 250, 500];
  const maxAllowedLev = m.maxLeverage;
  const availableLevs = LEVERAGES.filter((l) => l <= maxAllowedLev);

  const longLiq = liqPrice(p.price, p.leverage, "long", m.feeRate);
  const shortLiq = liqPrice(p.price, p.leverage, "short", m.feeRate);
  const liqDist = liqDistancePct(p.leverage, m.feeRate);
  const estFee = feeUsd(p.stake, p.leverage, m.feeRate);

  return (
    <div className="p-3.5 sm:p-4 space-y-3 font-sans text-xs">
      {/* Top Header: Mode & Live Status */}
      <div className="flex items-center justify-between pb-1 border-b border-hairline">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            {p.position ? "Active Position" : "1000x Perp"}
          </h2>
          <span className="rounded-full bg-secondary border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {p.market}-USD · {maxAllowedLev}x
          </span>
        </div>
        <span className="pill pill-ink h-6 px-2.5 text-[10px] font-medium">
          Market
        </span>
      </div>

      {p.position ? (
        /* --- Active Position View (Compact) --- */
        <div className="space-y-3">
          <div
            className={`rounded-2xl border p-3.5 transition-all ${
              pnl >= 0
                ? "border-[#00D964]/40 bg-[#E3F8EC]/60"
                : "border-[#FF3B30]/40 bg-[#FFECEA]/60"
            }`}
          >
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="flex items-center gap-1.5 text-foreground">
                <MarketLogo symbol={p.market} />
                <span className="font-bold">{p.market}-USD</span>
                <span
                  className={`rounded px-1.5 py-0.2 text-[10px] uppercase font-bold ${
                    p.position.side === "long"
                      ? "bg-[#06964A] text-white"
                      : "bg-[#FF3B30] text-white"
                  }`}
                >
                  {p.position.side} {p.position.leverage}x
                </span>
              </span>
              <span className="tabular text-[11px] text-muted-foreground">
                Margin: ${fmtUsd(p.position.stake)}
              </span>
            </div>

            <div className="mt-2.5 flex items-baseline justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Unrealized PnL
                </p>
                <p
                  className={`tabular text-2xl sm:text-3xl font-bold tracking-tight ${
                    pnl >= 0 ? "text-[#06964A]" : "text-[#FF3B30]"
                  }`}
                >
                  {fmtSigned(pnl)}
                </p>
              </div>
              <div
                className={`tabular text-right text-xs font-semibold ${
                  pnl >= 0 ? "text-[#06964A]" : "text-[#FF3B30]"
                }`}
              >
                {( (pnl / p.position.stake) * 100 ).toFixed(2)}% ROI
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-secondary/70 p-2.5 text-[11px]">
            <div>
              <span className="text-muted-foreground block text-[10px]">Liquidation Price</span>
              <span className="tabular font-semibold text-[#FF3B30]">
                ${fmtUsd(liquidation(p.position), m.decimals)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-muted-foreground block text-[10px]">Position Fee</span>
              <span className="tabular font-semibold text-foreground">
                ${fmtUsd(positionFee(p.position))}
              </span>
            </div>
          </div>

          <Button
            variant="terminal"
            className="pill pill-ink h-10 w-full text-xs font-semibold shadow-sm hover:opacity-90"
            onClick={p.onClose}
          >
            Close Position (FIFO Payout)
          </Button>
        </div>
      ) : (
        /* --- Order Configuration & Execution (Compact & No-Scroll) --- */
        <div className="space-y-3">
          {/* Section 1: Margin Selector (Compact Row) */}
          <section className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-muted-foreground">Margin (USDC)</span>
              <span className="tabular text-muted-foreground">
                Avail: <strong className="text-foreground">${fmtUsd(p.available, 0)}</strong>
              </span>
            </div>

            <div className="grid grid-cols-6 gap-1">
              {stakes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => p.setStake(s)}
                  className={`tabular h-8 rounded-lg text-xs font-medium transition-all ${
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
              className="flex w-full items-center justify-between rounded-lg border border-hairline bg-card px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
            >
              <span>
                Selected: <strong className="tabular text-foreground">${fmtUsd(p.stake)}</strong>
              </span>
              <span className="flex items-center gap-1 text-[10px] font-medium text-foreground">
                Custom <Plus className="size-3" />
              </span>
            </button>
          </section>

          {/* Section 2: Leverage Control (Compact Slider + Badges) */}
          <section className="rounded-2xl border border-hairline bg-secondary/50 p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground">Leverage</span>
              <span className="inline-flex items-center gap-1 rounded-md bg-foreground px-2 py-0.5 text-xs font-bold text-background tabular">
                <Zap className="size-3 text-[#FFD60A]" />
                {p.leverage}×
              </span>
            </div>

            {/* Range Slider */}
            <div className="px-1">
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
                className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-foreground"
              />
            </div>

            {/* Quick Leverage Pill Buttons */}
            <div className="flex gap-1">
              {availableLevs.map((lev) => (
                <button
                  key={lev}
                  type="button"
                  onClick={() => p.setLeverage(lev)}
                  className={`tabular h-6 flex-1 rounded-md text-[10px] font-medium transition-all ${
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

          {/* Section 3: Summary Risk Metrics (High Density) */}
          <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-hairline bg-card p-2 text-center text-[10px]">
            <div className="border-r border-hairline pr-1">
              <span className="text-muted-foreground block text-[9px] uppercase">Liq Distance</span>
              <span className="tabular font-semibold text-[#FF3B30]">
                -{liqDist.toFixed(2)}%
              </span>
            </div>
            <div className="border-r border-hairline px-1">
              <span className="text-muted-foreground block text-[9px] uppercase">Est. Fee</span>
              <span className="tabular font-semibold text-foreground">
                ${fmtUsd(estFee)}
              </span>
            </div>
            <div className="pl-1">
              <span className="text-muted-foreground block text-[9px] uppercase">Max Loss</span>
              <span className="tabular font-semibold text-foreground">
                ${fmtUsd(p.stake)}
              </span>
            </div>
          </div>

          {/* Section 4: Dual Order Execution Buttons (Compact & High Contrast) */}
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            {/* Long Trigger */}
            <Button
              disabled={blocked}
              variant="terminal"
              onClick={() => p.onOpen("long")}
              className="h-12 rounded-xl bg-[#06964A] hover:bg-[#058240] text-white font-sans flex flex-col justify-center items-center gap-0.5 shadow-sm active:scale-[0.99] transition-all disabled:opacity-50"
            >
              <span className="flex items-center gap-1.5 text-xs font-bold tracking-wide">
                <TrendingUp className="size-3.5 stroke-[2.5]" />
                LONG {p.leverage}×
              </span>
              <span className="tabular text-[10px] font-mono opacity-90">
                Liq ${fmtUsd(longLiq, m.decimals)}
              </span>
            </Button>

            {/* Short Trigger */}
            <Button
              disabled={blocked}
              variant="terminal"
              onClick={() => p.onOpen("short")}
              className="h-12 rounded-xl bg-[#FF3B30] hover:bg-[#E0342A] text-white font-sans flex flex-col justify-center items-center gap-0.5 shadow-sm active:scale-[0.99] transition-all disabled:opacity-50"
            >
              <span className="flex items-center gap-1.5 text-xs font-bold tracking-wide">
                <TrendingDown className="size-3.5 stroke-[2.5]" />
                SHORT {p.leverage}×
              </span>
              <span className="tabular text-[10px] font-mono opacity-90">
                Liq ${fmtUsd(shortLiq, m.decimals)}
              </span>
            </Button>
          </div>

          {/* Status Alert if blocked */}
          {blocked && (
            <div className="flex items-center justify-center gap-1.5 rounded-lg bg-[#FFECEA] py-1.5 text-[11px] font-medium text-[#FF3B30]">
              <ShieldAlert className="size-3.5" />
              <span>{p.limitReached ? "Max 3 open positions reached" : `Market status: ${p.status}`}</span>
            </div>
          )}
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
    </div>
  );
}
