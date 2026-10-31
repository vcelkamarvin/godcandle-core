import { Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  fmtDuration,
  fmtSigned,
  fmtUsd,
  liqHealth,
  liquidation,
  pnlOf,
  type ClosedTrade,
  type Position,
} from "@/lib/trade";
import { Button } from "@/components/ui/button";
import { getMarket, type MarketSymbol } from "@/config/markets";
import type { FeedSnap } from "@/lib/price-feed";
import { MarketLogo } from "./MarketLogo";
import { LiqBar } from "./bits";

interface Props {
  feeds: Record<MarketSymbol, FeedSnap>;
  onSelect: (m: MarketSymbol) => void;
  open: Position[];
  history: ClosedTrade[];
  onClose: (m: MarketSymbol) => void;
  onShare: (t: ClosedTrade) => void;
}

const SideBadge = ({ side }: { side: string }) => (
  <span
    className={`pill h-6 border px-2.5 text-[11px] ${side === "long" ? "border-gain text-gain" : "border-loss text-loss"}`}
  >
    {side.toUpperCase()}
  </span>
);

export function Dock({ feeds, onSelect, open, history, onClose, onShare }: Props) {
  const [tab, setTab] = useState<"open" | "history" | "stats">("open");
  useEffect(() => { const change = (e: Event) => setTab((e as CustomEvent).detail); window.addEventListener("dock-tab", change); return () => window.removeEventListener("dock-tab", change); }, []);
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
    <div className="py-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex h-10 items-center rounded-full border border-hairline p-1">
          {tabs.map(([id, label]) => (
            <Button variant="terminal"
              key={id}
              onClick={() => setTab(id)}
              className={`pill tabular h-8 px-4 text-sm ${tab === id ? "pill-ink" : "text-muted-foreground hover:text-foreground"}`}
            >
              {label}
            </Button>
          ))}
        </div>
        <p className="tabular text-sm text-muted-foreground">
          Realized PnL{" "}
          <span className={`font-medium ${total >= 0 ? "text-gain" : "text-loss"}`}>{fmtSigned(total)}</span>
        </p>
      </div>

      <div className="mt-6">
        {tab === "open" &&
          (open.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No open positions</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {open.map((pos) => {
                const price = feeds[pos.market].price;
                const market = getMarket(pos.market);
                const pnl = pnlOf(pos, price);
                return (
                  <div key={pos.id} className="rounded-3xl border border-hairline p-5">
                    <Button variant="terminal" onClick={() => onSelect(pos.market)} className="flex h-auto w-full flex-wrap justify-start gap-2 border-b border-hairline px-0 pb-3">
                      <MarketLogo symbol={pos.market}/>
                      <span className="font-medium">{pos.market}</span>
                      <SideBadge side={pos.side} />
                      <span className="pill tabular h-6 border border-foreground px-2.5 text-[11px]">{pos.leverage}x</span>
                    </Button>
                    <p className="mt-5 text-xs text-muted-foreground">Unrealized PnL</p>
                    <p className={`tabular mt-2 text-4xl font-semibold ${pnl >= 0 ? "text-gain" : "text-loss"}`}>{fmtSigned(pnl)}</p>
                    <p className={`tabular mt-1 text-sm ${pnl >= 0 ? "text-gain" : "text-loss"}`}>{(pnl / pos.stake * 100).toFixed(2)}% <span className="text-muted-foreground">· ${fmtUsd(pos.stake)} margin</span></p>
                    <div className="tabular mt-4 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Entry</p>
                        <p className="mt-1 font-medium">${fmtUsd(pos.entry, market.decimals)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Mark</p>
                        <p className="mt-1 font-medium">${fmtUsd(price, market.decimals)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Liq.</p>
                        <p className="mt-1 font-medium text-loss">${fmtUsd(liquidation(pos), market.decimals)}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <LiqBar health={liqHealth(pos, price)} />
                    </div>
                    <Button variant="terminal" onClick={() => onClose(pos.market)} className="pill pill-outline mt-4 h-9 w-full text-sm">
                      Close
                    </Button>
                  </div>
                );
              })}
            </div>
          ))}

        {tab === "history" &&
          (history.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No trades yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="tabular w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-hairline text-left text-xs text-muted-foreground">
                    {["Market", "Side", "Leverage", "Entry", "Exit", "Result", "Duration", ""].map((h) => (
                      <th key={h} className="pb-3 font-normal">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {history.map((h) => (
                    <tr key={h.id}>
                      <td className="py-3"><span className="flex items-center gap-2"><MarketLogo symbol={h.market}/>{h.market}</span></td>
                      <td className="py-3">
                        <SideBadge side={h.side} />
                      </td>
                      <td>{h.leverage}x</td>
                      <td>${fmtUsd(h.entry, getMarket(h.market).decimals)}</td>
                      <td>${fmtUsd(h.exit, getMarket(h.market).decimals)}</td>
                      <td className={`font-medium ${h.pnl >= 0 ? "text-gain" : "text-loss"}`}>
                        {fmtSigned(h.pnl)}
                        {h.liquidated && <span className="ml-2 text-xs font-normal">liquidated</span>}
                      </td>
                      <td className="text-muted-foreground">{fmtDuration(h.durationMs)}</td>
                      <td className="text-right">
                        <Button variant="terminal" aria-label="Share trade" onClick={() => onShare(h)} className="pill pill-ghost h-8 w-8">
                          <Share2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

        {tab === "stats" && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              ["Win rate", history.length ? `${Math.round((wins / history.length) * 100)}%` : "—", ""],
              ["Best trade", fmtSigned(best), best >= 0 ? "text-gain" : "text-loss"],
              ["Worst trade", fmtSigned(worst), worst >= 0 ? "text-gain" : "text-loss"],
              ["Realized P&L", fmtSigned(total), total >= 0 ? "text-gain" : "text-loss"],
            ].map(([k, v, tone]) => (
              <div key={k} className="rounded-3xl border border-hairline p-5">
                <p className="text-xs text-muted-foreground">{k}</p>
                <p className={`tabular tight mt-2 text-3xl font-medium ${tone}`}>{v}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
