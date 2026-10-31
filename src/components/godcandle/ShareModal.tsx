import { Download, Copy, Check } from "lucide-react";
import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { fmtDuration, fmtSigned, fmtUsd, type ClosedTrade } from "@/lib/trade";
import { getMarket } from "@/config/markets";
import { Button } from "@/components/ui/button";
import { MarketLogo } from "./MarketLogo";
import { toast } from "sonner";

export function ShareModal({
  trade,
  onOpenChange,
}: {
  trade: ClosedTrade | null;
  onOpenChange: (o: boolean) => void;
}) {
  const [hide, setHide] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!trade) return null;
  const market = getMarket(trade.market);
  const pct = (trade.pnl / trade.stake) * 100;
  const up = trade.pnl >= 0;
  const pctStr = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;

  const shareToX = () => {
    const text = `Just hit ${pctStr} ROI trading ${trade.market}-USD ${trade.leverage}x on @godcandle_trade!\n\nZero entry fees, mark-clamped BBO on HyperEVM.\nhttps://godcandle.trade`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const copyText = async () => {
    const text = `godcandle.trade | ${trade.market}-USD ${trade.side.toUpperCase()} ${trade.leverage}x: ${pctStr} ROI (${fmtSigned(trade.pnl)})`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Trade summary copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const drawCardCanvas = async (): Promise<HTMLCanvasElement | null> => {
    const S = 1080;
    const c = document.createElement("canvas");
    c.width = S;
    c.height = S;
    const ctx = c.getContext("2d");
    if (!ctx) return null;

    const FONT_MONO = "Menlo, Monaco, Consolas, monospace";

    // 1. Draw Monet "The Cliffs at Etretat" Background with robust loading
    const img = new Image();
    await new Promise<void>((resolve) => {
      let settled = false;
      const finish = (loaded: boolean) => {
        if (settled) return;
        settled = true;
        if (loaded) {
          try {
            ctx.drawImage(img, 0, 0, S, S);
          } catch {
            ctx.fillStyle = "#0c1015";
            ctx.fillRect(0, 0, S, S);
          }
        } else {
          ctx.fillStyle = "#0c1015";
          ctx.fillRect(0, 0, S, S);
        }
        resolve();
      };

      const timer = setTimeout(() => finish(false), 2500);
      img.onload = () => {
        clearTimeout(timer);
        finish(true);
      };
      img.onerror = () => {
        clearTimeout(timer);
        finish(false);
      };
      img.crossOrigin = "anonymous";
      img.src = "/images/monet-etretat.jpg";
      if (img.complete && img.naturalWidth > 0) {
        clearTimeout(timer);
        finish(true);
      }
    });

    // 2. Dark Gradient Overlay for sharp contrast and readability
    const grad = ctx.createLinearGradient(0, 0, 0, S);
    grad.addColorStop(0, "rgba(5, 7, 10, 0.82)");
    grad.addColorStop(0.45, "rgba(8, 11, 16, 0.72)");
    grad.addColorStop(1, "rgba(4, 5, 8, 0.95)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, S, S);

    // Card Inner Border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (typeof ctx.roundRect === "function") {
      ctx.roundRect(40, 40, S - 80, S - 80, 24);
    } else {
      ctx.rect(40, 40, S - 80, S - 80);
    }
    ctx.stroke();

    // 3. Header: Brand & Protocol
    ctx.fillStyle = "#00D964";
    ctx.fillRect(90, 95, 12, 34);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `bold 38px ${FONT_MONO}`;
    ctx.textBaseline = "middle";
    ctx.fillText("godcandle", 115, 112);

    ctx.font = `bold 22px ${FONT_MONO}`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
    ctx.fillText("PRECOMPILE v1 · HyperEVM", 310, 112);

    // Side & Leverage Pill (Top Right)
    const sideText = `${trade.side.toUpperCase()} ${trade.leverage}×`;
    ctx.font = `bold 26px ${FONT_MONO}`;
    const sideWidth = ctx.measureText(sideText).width;
    ctx.fillStyle = trade.side === "long" ? "#00D964" : "#FF3B30";
    ctx.beginPath();
    if (typeof ctx.roundRect === "function") {
      ctx.roundRect(S - 100 - sideWidth - 28, 92, sideWidth + 28, 44, 8);
    } else {
      ctx.rect(S - 100 - sideWidth - 28, 92, sideWidth + 28, 44);
    }
    ctx.fill();
    ctx.fillStyle = trade.side === "long" ? "#000000" : "#FFFFFF";
    ctx.fillText(sideText, S - 100 - sideWidth - 14, 114);

    // 4. Center: Asset & Market Details
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = `bold 36px ${FONT_MONO}`;
    ctx.fillText(`${trade.market}-USD ${trade.leverage}x Isolated`, 90, 280);

    // 5. Giant Bold ROI % Typography in High-Contrast Green
    ctx.fillStyle = up ? "#00D964" : "#FF3B30";
    ctx.font = `900 130px ${FONT_MONO}`;
    ctx.fillText(pctStr, 85, 430);

    // Optional PnL Amount
    if (!hide) {
      ctx.fillStyle = up ? "rgba(0, 217, 100, 0.9)" : "rgba(255, 59, 48, 0.9)";
      ctx.font = `bold 44px ${FONT_MONO}`;
      ctx.fillText(`${fmtSigned(trade.pnl)} USDC`, 90, 520);
    }

    // 6. Metrics Grid: Entry, Exit, Duration
    const metricsY = 690;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(90, metricsY - 40);
    ctx.lineTo(S - 90, metricsY - 40);
    ctx.stroke();

    const stats: [string, string][] = [
      ["ENTRY PRICE", `$${fmtUsd(trade.entry, market.decimals)}`],
      ["EXIT PRICE", `$${fmtUsd(trade.exit, market.decimals)}`],
      ["DURATION", fmtDuration(trade.durationMs)],
    ];

    stats.forEach(([label, val], idx) => {
      const xPos = 90 + idx * 310;
      ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
      ctx.font = `bold 20px ${FONT_MONO}`;
      ctx.fillText(label, xPos, metricsY);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = `bold 34px ${FONT_MONO}`;
      ctx.fillText(val, xPos, metricsY + 45);
    });

    // 7. Footer Branding & Domain
    const footerY = 930;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(90, footerY - 40);
    ctx.lineTo(S - 90, footerY - 40);
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    ctx.font = `bold 22px ${FONT_MONO}`;
    ctx.fillText("1000x SYNTHETIC PERPS · ZERO ENTRY FEES", 90, footerY);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = `bold 28px ${FONT_MONO}`;
    ctx.textAlign = "right";
    ctx.fillText("godcandle.trade", S - 90, footerY);
    ctx.textAlign = "left";

    return c;
  };

  const download = async () => {
    try {
      const c = await drawCardCanvas();
      if (!c) return;

      const a = document.createElement("a");
      a.href = c.toDataURL("image/png");
      a.download = `godcandle-${trade.market}-${Date.now()}.png`;
      a.click();
      toast.success("PnL Card downloaded successfully!");
    } catch {
      toast.error("Failed to generate PnL image");
    }
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border-hairline bg-[#0E1116] p-5 text-white shadow-2xl sm:p-6">
        <DialogTitle className="sr-only">Share PnL Card</DialogTitle>

        {/* The "Cliffs" PnL Share Card Preview */}
        <div
          ref={cardRef}
          className="relative aspect-square w-full overflow-hidden rounded-xl border border-white/15 shadow-xl select-none flex flex-col justify-between p-5 sm:p-6"
          style={{
            backgroundImage: `url('/images/monet-etretat.jpg')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Dark gradient overlay for high contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/65 to-black/92 pointer-events-none" />

          {/* Content Layer */}
          <div className="relative z-10 flex flex-col justify-between h-full">
            {/* Header: Logo and Side/Lev badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 font-bold tracking-tight text-white font-mono text-sm">
                  <span className="inline-block w-1.5 h-3.5 bg-[#00D964] rounded-xs" />
                  godcandle
                </div>
                <span className="text-[10px] font-mono text-white/50 tracking-wider">
                  PRECOMPILE v1
                </span>
              </div>
              <span
                className={`rounded-sm px-2 py-0.5 text-xs font-mono font-bold uppercase tracking-wider ${
                  trade.side === "long" ? "bg-[#00D964] text-black" : "bg-[#FF3B30] text-white"
                }`}
              >
                {trade.side.toUpperCase()} {trade.leverage}×
              </span>
            </div>

            {/* Centerpiece: Asset & Huge ROI Typography */}
            <div className="my-auto py-3">
              <div className="flex items-center gap-2 text-white/80 font-mono text-xs mb-1">
                <MarketLogo symbol={trade.market} />
                <span className="font-bold text-sm tracking-wide text-white">
                  {trade.market}-USD
                </span>
                <span className="text-white/40">·</span>
                <span className="text-white/80 font-semibold">{trade.leverage}x Isolated</span>
              </div>

              {/* Large, Bold, High-Contrast Typography in Bright Green */}
              <div
                className={`font-mono text-5xl sm:text-6xl font-extrabold tracking-tight leading-none drop-shadow-md ${
                  up ? "text-[#00D964]" : "text-[#FF3B30]"
                }`}
              >
                {pctStr}
              </div>

              {!hide && (
                <div className="mt-2 text-sm sm:text-base font-mono font-bold text-white/90">
                  {fmtSigned(trade.pnl)} USDC
                </div>
              )}
            </div>

            {/* Bottom Stats & Domain */}
            <div className="space-y-2.5 pt-2.5 border-t border-white/15 font-mono">
              <div className="grid grid-cols-3 gap-2 text-[10px] sm:text-[11px] text-white/80">
                <div>
                  <span className="text-white/40 block text-[9px] uppercase tracking-wider">
                    ENTRY
                  </span>
                  <span className="font-semibold text-white">
                    ${fmtUsd(trade.entry, market.decimals)}
                  </span>
                </div>
                <div>
                  <span className="text-white/40 block text-[9px] uppercase tracking-wider">
                    EXIT
                  </span>
                  <span className="font-semibold text-white">
                    ${fmtUsd(trade.exit, market.decimals)}
                  </span>
                </div>
                <div>
                  <span className="text-white/40 block text-[9px] uppercase tracking-wider">
                    DURATION
                  </span>
                  <span className="font-semibold text-white">
                    {fmtDuration(trade.durationMs)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-white/60 pt-1">
                <span className="tracking-wider font-mono uppercase text-white/45 text-[9px]">
                  HyperEVM · 1000x Perp
                </span>
                <span className="font-mono font-bold text-white/90 text-[11px]">
                  godcandle.trade
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 font-mono">
          <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer">
            <Switch checked={hide} onCheckedChange={setHide} />
            <span>Hide amounts</span>
          </label>

          <div className="flex items-center gap-2">
            {/* Copy Button */}
            <Button
              variant="terminal"
              onClick={copyText}
              title="Copy Summary"
              className="rounded-md border border-white/20 bg-white/10 hover:bg-white/20 text-white h-9 px-3 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-[#00D964]" /> : <Copy className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">Copy</span>
            </Button>

            {/* Share to X Button */}
            <Button
              variant="terminal"
              onClick={shareToX}
              className="rounded-md bg-white text-black hover:bg-white/90 h-9 px-3.5 text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 24.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>Share to X</span>
            </Button>

            {/* Download PNG Button */}
            <Button
              variant="terminal"
              onClick={download}
              className="rounded-md bg-[#00D964] hover:bg-[#06964A] text-black hover:text-white h-9 px-3.5 text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Download className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Download</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
