import React from "react";
import { getMarket, type MarketSymbol, type MarketStatus } from "@/config/markets";
import {
  fmtSigned,
  fmtUsd,
  pnlOf,
  type Position,
  type Side,
} from "@/lib/engine";
import { useTrading } from "./TradingProvider";
import { OrderForm } from "@/components/trade/OrderForm";

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
  const t = useTrading();
  const m = getMarket(p.market);
  const activePositions = p.positions ?? (p.position ? [p.position] : []);
  const maxLev = t.engine.getMaxLeverage(p.market);

  return (
    <div className="space-y-3 font-sans">
      {/* Discrete Isolated Position Slugs for this market if any exist */}
      {activePositions.length > 0 && (
        <div className="space-y-1.5 font-mono">
          {activePositions.map((pos) => {
            const pnl = pnlOf(pos, p.price);
            const roi = (pnl / pos.stake) * 100;
            const isUp = pnl >= 0;
            return (
              <div
                key={pos.id}
                className={`rounded-xl border p-2 text-xs font-mono transition-all ${
                  isUp ? "border-[#00D964]/40 bg-[#E3F8EC]/60" : "border-[#FF3B30]/40 bg-[#FFECEA]/60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] uppercase font-bold text-white ${
                        pos.side === "long" ? "bg-[#06964A]" : "bg-[#FF3B30]"
                      }`}
                    >
                      {pos.side} {pos.leverage}×
                    </span>
                    <span className="text-muted-foreground">
                      ${fmtUsd(pos.stake, 0)}
                    </span>
                    <span
                      className={`tabular font-bold ${
                        isUp ? "text-[#06964A]" : "text-[#FF3B30]"
                      }`}
                    >
                      {fmtSigned(pnl)} ({roi >= 0 ? "+" : ""}{roi.toFixed(1)}%)
                    </span>
                    {pos.tp && (
                      <span className="text-[#00D964] text-[10px]">
                        TP ${fmtUsd(pos.tp, m.decimals)}
                      </span>
                    )}
                    {pos.sl && (
                      <span className="text-[#FF3B30] text-[10px]">
                        SL ${fmtUsd(pos.sl, m.decimals)}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => p.onClose(pos.id)}
                    className="rounded-lg bg-foreground/10 hover:bg-foreground/20 text-foreground px-2 py-0.5 text-[10px] font-mono font-bold transition-colors ml-1"
                  >
                    Close
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Redesigned Order Form matching exact reference styling */}
      <OrderForm
        currentPrice={p.price}
        leverage={p.leverage}
        onLeverageChange={p.setLeverage}
        maxLeverage={maxLev}
        asset={p.market}
        availableBalance={p.available}
        mode={t.mode}
        onTrade={(side, margin, lev, tp, sl) => {
          p.setStake(margin);
          p.setLeverage(lev);
          p.onOpen(side.toLowerCase() as Side, tp, sl);
        }}
      />
    </div>
  );
}
