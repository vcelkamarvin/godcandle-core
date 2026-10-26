import { Share2 } from "lucide-react";
import { useState } from "react";
import {
  fmtDuration,
  fmtSigned,
  fmtUsd,
  liqHealth,
  liqPrice,
  pnlOf,
  type ClosedTrade,
  type Position,
} from "@/lib/trade";
import { LiqBar } from "./bits";

interface Props {
  price: number;
  open: Position[];
  history: ClosedTrade[];
  onClose: () => void;
  onShare: (t: ClosedTrade) => void;
}

const SideBadge = ({ side }: { side: string }) => (
  <span
    className={`pill h-6 border px-2.5 text-[11px] ${side === "long" ? "border-gain text-gain" : "border-loss text-loss"}`}
  >
    {side.toUpperCase()}
  </span>
);

export function Dock({ price, open, history, onClose, onShare }: Props) {
  const [tab, setTab] = useState<"open" | "history" | "stats">("open");
  const wins = history.filter((h) => h.pnl > 0).length;
  const total = history.reduce((s, h) => s + h.pnl, 0);
  const best = history.length ? Math.max(...history.map((h) => h.pnl)) : 0;
  const worst = history.length ? Math.min(...history.map((h) => h.pnl)) : 0;

  const tabs = [
    ["open", `Open (${open.length})`],
    ["history", `History (${history.length})`],
    ["stats", "Stats"],
  ] as const;

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex h-10 items-center rounded-full border border-hairline p-1">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`pill tabular h-8 px-4 text-sm ${tab === id ? "pill-ink" : "text-muted-foreground hover:text-foreground"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="tabular text-sm text-muted-foreground">
          Realized P&L{" "}
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
                const pnl = pnlOf(pos, price);
                return (
                  <div key={pos.id} className="rounded-3xl border border-hairline p-5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">BTC/USD</span>
                      <SideBadge side={pos.side} />
                      <span className="pill tabular h-6 border border-foreground px-2.5 text-[11px]">{pos.leverage}x</span>
                      <span className={`tabular ml-auto font-medium ${pnl >= 0 ? "text-gain" : "text-loss"}`}>
                        {fmtSigned(pnl)}
                      </span>
                    </div>
                    <div className="tabular mt-4 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Entry</p>
                        <p className="mt-1 font-medium">${fmtUsd(pos.entry)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Mark</p>
                        <p className="mt-1 font-medium">${fmtUsd(price)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Liq.</p>
                        <p className="mt-1 font-medium text-loss">${fmtUsd(liqPrice(pos.entry, pos.leverage, pos.side))}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <LiqBar health={liqHealth(pos, price)} />
                    </div>
                    <button onClick={onClose} className="pill pill-outline mt-4 h-9 w-full text-sm">
                      Close
                    </button>
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
                    {["Side", "Leverage", "Entry", "Exit", "Result", "Duration", ""].map((h) => (
                      <th key={h} className="pb-3 font-normal">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {history.map((h) => (
                    <tr key={h.id}>
                      <td className="py-3">
                        <SideBadge side={h.side} />
                      </td>
                      <td>{h.leverage}x</td>
                      <td>${fmtUsd(h.entry)}</td>
                      <td>${fmtUsd(h.exit)}</td>
                      <td className={`font-medium ${h.pnl >= 0 ? "text-gain" : "text-loss"}`}>
                        {fmtSigned(h.pnl)}
                        {h.liquidated && <span className="ml-2 text-xs font-normal">liquidated</span>}
                      </td>
                      <td className="text-muted-foreground">{fmtDuration(h.durationMs)}</td>
                      <td className="text-right">
                        <button aria-label="Share trade" onClick={() => onShare(h)} className="pill pill-ghost h-8 w-8">
                          <Share2 className="h-3.5 w-3.5" />
                        </button>
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
