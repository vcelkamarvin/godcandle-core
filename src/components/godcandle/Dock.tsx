import { Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  fmtDuration,
  fmtSigned,
  fmtUsd,
  liquidation,
  pnlOf,
  type ClosedTrade,
  type Position,
} from "@/lib/trade";
import { Button } from "@/components/ui/button";
import { getMarket, type MarketSymbol } from "@/config/markets";
import type { FeedSnap } from "@/lib/price-feed";
import { MarketLogo } from "./MarketLogo";

interface Props {
  feeds: Record<MarketSymbol, FeedSnap>;
  onSelect: (m: MarketSymbol) => void;
  open: Position[];
  history: ClosedTrade[];
  onClose: (idOrMarket: string) => void;
  onShare: (t: ClosedTrade) => void;
}

const SideBadge = ({ side }: { side: string }) => (
  <span
    className={`rounded-sm px-1.5 py-0.2 text-[10px] font-bold uppercase font-mono ${
      side === "long" ? "bg-[#06964A] text-white" : "bg-[#FF3B30] text-white"
    }`}
  >
    {side.toUpperCase()}
  </span>
);

export function Dock({ feeds, onSelect, open, history, onClose, onShare }: Props) {
  const [tab, setTab] = useState<"open" | "history" | "stats">("open");
  useEffect(() => {
    const change = (e: Event) => setTab((e as CustomEvent).detail);
    window.addEventListener("dock-tab", change);
    return () => window.removeEventListener("dock-tab", change);
  }, []);

  const wins = history.filter((h) => h.pnl > 0).length;
  const total = history.reduce((s, h) => s + h.pnl, 0);
  const best = history.length ? Math.max(...history.map((h) => h.pnl)) : 0;
  const worst = history.length ? Math.min(...history.map((h) => h.pnl)) : 0;

  const tabs = [
    ["open", `Positions (${open.length})`],
    ["history", `History (${history.length})`],
    ["stats", "Stats"],
  ] as const;

  return (
    <div className="py-4 font-mono">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex h-8 items-center rounded-md border border-hairline bg-secondary/40 p-0.5">
          {tabs.map(([id, label]) => (
            <Button
              variant="terminal"
              key={id}
              onClick={() => setTab(id)}
              className={`tabular h-7 px-3 text-xs font-mono font-medium rounded-sm transition-all ${
                tab === id
                  ? "bg-foreground text-background font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </Button>
          ))}
        </div>
        <p className="tabular text-xs font-mono text-muted-foreground">
          Realized PnL:{" "}
          <span className={`font-bold ${total >= 0 ? "text-[#06964A]" : "text-[#FF3B30]"}`}>
            {fmtSigned(total)}
          </span>
        </p>
      </div>

      <div className="mt-4">
        {tab === "open" &&
          (open.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-muted-foreground border border-dashed border-border rounded-md">
              No open positions. Use the Order Form to open 1000x isolated positions.
            </div>
          ) : (
            <div className="space-y-2">
              {open.map((pos) => {
                const price = feeds[pos.market].price;
                const market = getMarket(pos.market);
                const pnl = pnlOf(pos, price);
                const roi = (pnl / pos.stake) * 100;
                const isUp = pnl >= 0;
                const liqP = liquidation(pos);

                return (
                  <div
                    key={pos.id}
                    className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-md border border-hairline bg-card p-3 font-mono text-xs transition-all hover:border-foreground/30 shadow-xs"
                  >
                    {/* Left Column: Asset, Side, Leverage, ID slug */}
                    <div className="flex items-center gap-3 min-w-[210px]">
                      <button
                        type="button"
                        onClick={() => onSelect(pos.market)}
                        className="flex items-center gap-2.5 text-left hover:opacity-85 transition-opacity"
                      >
                        <MarketLogo symbol={pos.market} />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-foreground text-sm">
                              {pos.market}-USD
                            </span>
                            <SideBadge side={pos.side} />
                            <span className="rounded-sm bg-secondary border border-border px-1.5 py-0.2 text-[10px] font-bold text-foreground">
                              {pos.leverage}x
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                            <span className="font-mono">#{pos.id.slice(0, 10)}</span>
                            <span>·</span>
                            <span>Isolated</span>
                            {pos.tp && (
                              <span className="text-[#00D964]">
                                TP ${fmtUsd(pos.tp, market.decimals)}
                              </span>
                            )}
                            {pos.sl && (
                              <span className="text-[#FF3B30]">
                                SL ${fmtUsd(pos.sl, market.decimals)}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    </div>

                    {/* Middle Column: Margin, Entry Price, Mark Price, Liquidation Price */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs tabular flex-1 px-1">
                      <div>
                        <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">
                          MARGIN
                        </span>
                        <span className="font-semibold text-foreground">
                          ${fmtUsd(pos.stake, 0)} USDC
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">
                          ENTRY PRICE
                        </span>
                        <span className="font-semibold text-foreground">
                          ${fmtUsd(pos.entry, market.decimals)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">
                          MARK PRICE
                        </span>
                        <span className="font-semibold text-foreground">
                          ${fmtUsd(price, market.decimals)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">
                          LIQ PRICE
                        </span>
                        <span className="font-semibold text-[#FF3B30]">
                          ${fmtUsd(liqP, market.decimals)}
                        </span>
                      </div>
                    </div>

                    {/* Right Column: Live PnL, ROI %, Share & Independent Close button */}
                    <div className="flex items-center justify-between lg:justify-end gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-hairline min-w-[210px]">
                      <div className="text-right tabular">
                        <p
                          className={`text-sm font-bold tracking-tight ${
                            isUp ? "text-[#06964A]" : "text-[#FF3B30]"
                          }`}
                        >
                          {fmtSigned(pnl)}
                        </p>
                        <p
                          className={`text-[10px] font-semibold ${
                            isUp ? "text-[#06964A]" : "text-[#FF3B30]"
                          }`}
                        >
                          {roi >= 0 ? "+" : ""}
                          {roi.toFixed(2)}% ROI
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Share PnL Card */}
                        <Button
                          variant="terminal"
                          aria-label="Share PnL card"
                          title="Share PnL to X"
                          onClick={() => {
                            onShare({
                              ...pos,
                              exit: price,
                              pnl,
                              liquidated: false,
                              closedAt: Date.now(),
                              durationMs: Date.now() - pos.openedAt,
                            });
                          }}
                          className="rounded-sm border border-border bg-secondary hover:bg-secondary/80 h-7 w-7 p-0 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                        </Button>

                        {/* Independent Close Button */}
                        <Button
                          variant="terminal"
                          onClick={() => onClose(pos.id)}
                          className="rounded-sm bg-foreground text-background hover:opacity-90 h-7 px-2.5 text-xs font-mono font-medium shadow-xs transition-opacity"
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

        {tab === "history" &&
          (history.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-muted-foreground border border-dashed border-border rounded-md">
              No trades yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border border-hairline">
              <table className="tabular w-full min-w-[640px] text-xs font-mono">
                <thead>
                  <tr className="border-b border-hairline bg-secondary/30 text-left text-[10px] text-muted-foreground">
                    {["Order ID", "Market", "Side", "Leverage", "Entry", "Exit", "Result", "Duration", "Share"].map((h) => (
                      <th key={h} className="py-2 px-3 font-semibold uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {history.map((h) => (
                    <tr key={h.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-2.5 px-3 text-[10px] text-muted-foreground">
                        #{h.id.slice(0, 8)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="flex items-center gap-1.5 font-bold">
                          <MarketLogo symbol={h.market} />
                          {h.market}-USD
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <SideBadge side={h.side} />
                      </td>
                      <td className="py-2.5 px-3">{h.leverage}x</td>
                      <td className="py-2.5 px-3">${fmtUsd(h.entry, getMarket(h.market).decimals)}</td>
                      <td className="py-2.5 px-3">${fmtUsd(h.exit, getMarket(h.market).decimals)}</td>
                      <td className={`py-2.5 px-3 font-bold ${h.pnl >= 0 ? "text-[#06964A]" : "text-[#FF3B30]"}`}>
                        {fmtSigned(h.pnl)}
                        {h.liquidated && (
                          <span className="ml-1.5 text-[9px] font-normal text-muted-foreground">
                            (liq)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">
                        {fmtDuration(h.durationMs)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Button
                          variant="terminal"
                          aria-label="Share trade"
                          title="Share to X"
                          onClick={() => onShare(h)}
                          className="rounded-sm border border-border bg-secondary hover:bg-secondary/80 h-6 px-2 text-[10px] font-mono flex items-center gap-1 text-muted-foreground hover:text-foreground"
                        >
                          <Share2 className="h-3 w-3" />
                          <span>Share</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

        {tab === "stats" && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 font-mono">
            {[
              ["Win rate", history.length ? `${Math.round((wins / history.length) * 100)}%` : "—", ""],
              ["Best trade", fmtSigned(best), best >= 0 ? "text-[#06964A]" : "text-[#FF3B30]"],
              ["Worst trade", fmtSigned(worst), worst >= 0 ? "text-[#06964A]" : "text-[#FF3B30]"],
              ["Realized P&L", fmtSigned(total), total >= 0 ? "text-[#06964A]" : "text-[#FF3B30]"],
            ].map(([k, v, tone]) => (
              <div key={k} className="rounded-md border border-hairline bg-card p-3 shadow-xs">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</p>
                <p className={`tabular tight mt-1 text-2xl font-bold ${tone}`}>{v}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
