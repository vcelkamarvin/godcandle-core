import { Download } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { fmtDuration, fmtSigned, fmtUsd, type ClosedTrade } from "@/lib/trade";
import { Wordmark } from "./bits";

export function ShareModal({ trade, onOpenChange }: { trade: ClosedTrade | null; onOpenChange: (o: boolean) => void }) {
  const [hide, setHide] = useState(false);
  if (!trade) return null;
  const pct = (trade.pnl / trade.stake) * 100;
  const up = trade.pnl >= 0;
  const pctStr = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;

  const download = () => {
    const css = getComputedStyle(document.documentElement);
    const v = (n: string) => css.getPropertyValue(n).trim();
    const S = 1080;
    const c = document.createElement("canvas");
    c.width = S;
    c.height = S;
    const x = c.getContext("2d")!;
    const F = '"Helvetica Neue", Helvetica, Arial, sans-serif';
    x.fillStyle = v("--background");
    x.fillRect(0, 0, S, S);
    x.strokeStyle = v("--foreground");
    x.lineWidth = 2;
    x.beginPath();
    x.roundRect(40, 40, S - 80, S - 80, 48);
    x.stroke();
    x.fillStyle = v("--foreground");
    x.fillRect(117, 110, 4, 52);
    x.beginPath();
    x.roundRect(107, 122, 24, 28, 5);
    x.fill();
    x.font = `500 52px ${F}`;
    x.textBaseline = "middle";
    x.fillText("godcandle", 150, 138);
    x.font = `400 32px ${F}`;
    x.fillStyle = v("--muted-foreground");
    x.fillText("BTC/USD", 100, 300);
    x.fillStyle = v(trade.side === "long" ? "--gain" : "--loss");
    x.font = `500 44px ${F}`;
    x.fillText(`${trade.side.toUpperCase()} ${trade.leverage}x`, 100, 360);
    x.fillStyle = v(up ? "--gain" : "--loss");
    x.font = `500 220px ${F}`;
    x.fillText(pctStr, 92, 540);
    if (!hide) {
      x.font = `500 56px ${F}`;
      x.fillText(fmtSigned(trade.pnl), 100, 680);
    }
    x.fillStyle = v("--muted-foreground");
    x.font = `400 30px ${F}`;
    const rows = [
      ["Entry", `$${fmtUsd(trade.entry)}`],
      ["Exit", `$${fmtUsd(trade.exit)}`],
      ["Duration", fmtDuration(trade.durationMs)],
    ];
    rows.forEach(([k, val], i) => {
      const cx = 100 + i * 300;
      x.fillStyle = v("--muted-foreground");
      x.fillText(k, cx, 850);
      x.fillStyle = v("--foreground");
      x.font = `500 38px ${F}`;
      x.fillText(val, cx, 900);
      x.font = `400 30px ${F}`;
    });
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = `godcandle-${trade.id}.png`;
    a.click();
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl border-foreground p-6 shadow-none">
        <DialogTitle className="sr-only">Share trade</DialogTitle>
        <div className="rounded-3xl border border-foreground p-6">
          <Wordmark />
          <p className="mt-8 text-sm text-muted-foreground">BTC/USD</p>
          <p className={`text-sm font-medium ${trade.side === "long" ? "text-gain" : "text-loss"}`}>
            {trade.side.toUpperCase()} {trade.leverage}x
          </p>
          <p className={`tabular tight mt-2 text-7xl font-medium ${up ? "text-gain" : "text-loss"}`}>{pctStr}</p>
          {!hide && (
            <p className={`tabular mt-1 text-lg font-medium ${up ? "text-gain" : "text-loss"}`}>{fmtSigned(trade.pnl)}</p>
          )}
          <div className="tabular mt-8 grid grid-cols-3 gap-2 text-xs">
            {[
              ["Entry", `$${fmtUsd(trade.entry)}`],
              ["Exit", `$${fmtUsd(trade.exit)}`],
              ["Duration", fmtDuration(trade.durationMs)],
            ].map(([k, val]) => (
              <div key={k}>
                <p className="text-muted-foreground">{k}</p>
                <p className="mt-1 text-sm font-medium">{val}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-3 text-sm">
            <Switch checked={hide} onCheckedChange={setHide} /> Hide amounts
          </label>
          <button onClick={download} className="pill pill-ink h-10 px-5 text-sm">
            <Download className="h-4 w-4" /> Download PNG
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
