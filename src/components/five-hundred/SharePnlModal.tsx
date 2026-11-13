import { useRef, useCallback, useState, useMemo } from "react";
import { Download, X, Share2, Copy, Check, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { MeshGradient } from "./MeshGradient";
import { formatPnl, formatPct, type TradeHistoryRecord } from "@/lib/five-hundred";
import { cn } from "@/lib/utils";

export interface SharePnlData {
  id?: string;
  symbol?: string;
  market?: string;
  side?: "long" | "short";
  bias?: "long" | "short";
  leverage: number;
  entryPrice: number | string;
  exitPrice?: number | string;
  markPrice?: number | string;
  stake?: number | string;
  pnl?: number | string;
  pnlUsd?: number | string;
  pnlPct: number | string;
  durationSeconds?: number | string;
  duration?: string;
  closedAt?: number | string;
  date?: string;
  status?: string;
}

export interface SharePnlModalProps {
  trade: TradeHistoryRecord | SharePnlData | null;
  onClose: () => void;
}

export function SharePnlModal({ trade, onClose }: SharePnlModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copyingImage, setCopyingImage] = useState(false);
  const [imageCopied, setImageCopied] = useState(false);
  const [hideAmounts, setHideAmounts] = useState(true);

  // Normalizing trade properties
  const normalized = useMemo(() => {
    if (!trade) return null;
    const raw = trade as any;
    const parseNum = (v: unknown): number => {
      if (typeof v === "number") return v;
      if (!v) return 0;
      const cleaned = String(v).replace(/[^0-9.-]/g, "");
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    const symbol =
      (raw.symbol as string | undefined) || (raw.market as string | undefined) || "BTC";
    const side = String(raw.side || raw.bias || "long").toLowerCase() as "long" | "short";
    const leverage = Number(raw.leverage) || 10;
    const entryPrice = parseNum(raw.entryPrice);
    const exitVal = parseNum(raw.exitPrice ?? raw.markPrice ?? raw.entryPrice);
    const pnl = parseNum(raw.pnl ?? raw.pnlUsd);
    const pnlPct = parseNum(raw.pnlPct);
    const stake = parseNum(raw.stake);

    const dur =
      raw.duration ||
      (typeof raw.durationSeconds === "number"
        ? `${raw.durationSeconds}s`
        : raw.durationSeconds || "45s");

    const dateStr =
      raw.date ||
      (raw.closedAt
        ? typeof raw.closedAt === "number"
          ? new Date(raw.closedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : String(raw.closedAt)
        : new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }));

    return {
      symbol,
      side,
      leverage,
      entryPrice,
      exitPrice: exitVal,
      pnl,
      pnlPct,
      stake,
      duration: dur,
      date: dateStr,
      isProfit: pnl >= 0,
    };
  }, [trade]);

  const generateCanvas = useCallback((): HTMLCanvasElement | null => {
    if (!normalized) return null;
    const canvas = document.createElement("canvas");
    const w = 800;
    const h = 1040;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // 1. Mesh Background with sampled dark blue colors
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, "#091124");
    bgGrad.addColorStop(0.5, "#0D1E45");
    bgGrad.addColorStop(1, "#070E20");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Glowing Blobs
    const blob1 = ctx.createRadialGradient(200, 200, 20, 200, 200, 420);
    blob1.addColorStop(0, "rgba(111, 178, 247, 0.75)");
    blob1.addColorStop(1, "rgba(111, 178, 247, 0)");
    ctx.fillStyle = blob1;
    ctx.fillRect(0, 0, w, h);

    const blob2 = ctx.createRadialGradient(650, 750, 40, 650, 750, 460);
    blob2.addColorStop(0, "rgba(43, 79, 160, 0.85)");
    blob2.addColorStop(1, "rgba(43, 79, 160, 0)");
    ctx.fillStyle = blob2;
    ctx.fillRect(0, 0, w, h);

    const blob3 = ctx.createRadialGradient(600, 250, 30, 600, 250, 380);
    blob3.addColorStop(0, "rgba(169, 196, 230, 0.65)");
    blob3.addColorStop(1, "rgba(169, 196, 230, 0)");
    ctx.fillStyle = blob3;
    ctx.fillRect(0, 0, w, h);

    // 2. Film Grain texture overlay
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 16;
      const d0 = data[i] ?? 0;
      const d1 = data[i + 1] ?? 0;
      const d2 = data[i + 2] ?? 0;
      data[i] = Math.min(255, Math.max(0, d0 + noise));
      data[i + 1] = Math.min(255, Math.max(0, d1 + noise));
      data[i + 2] = Math.min(255, Math.max(0, d2 + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    // 3. Card Inner Border with rounded appearance
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, w - 80, h - 80);

    // 4. Header: Brand Wordmark + Dot + Desk Subtitle
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 32px 'Inter', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("GODCANDLE", 80, 110);

    // Glowing dot
    ctx.fillStyle = "#3A63E6";
    ctx.beginPath();
    ctx.arc(260, 100, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "20px 'Inter', monospace";
    ctx.textAlign = "right";
    ctx.fillText(normalized.date, w - 80, 110);

    // 5. Asset & Badges
    ctx.textAlign = "left";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 44px 'Inter', sans-serif";
    ctx.fillText(normalized.symbol, 80, 230);

    const sideColor = normalized.side === "long" ? "#00D964" : "#FF3B30";
    ctx.fillStyle = sideColor;
    ctx.font = "bold 26px 'Inter', monospace";
    ctx.fillText(`${normalized.side.toUpperCase()} ${normalized.leverage}X LEVERAGE`, 80, 280);

    // 6. Huge P&L % with optional $ Amount
    const pnlColor = normalized.isProfit ? "#00D964" : "#FF3B30";
    ctx.fillStyle = pnlColor;
    ctx.font = "bold 96px 'Inter', monospace";
    ctx.fillText(formatPct(normalized.pnlPct), 80, 420);

    if (!hideAmounts) {
      ctx.font = "bold 42px 'Inter', monospace";
      ctx.fillText(formatPnl(normalized.pnl), 80, 480);
    }

    // 7. Divider Line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, 540);
    ctx.lineTo(w - 80, 540);
    ctx.stroke();

    // 8. Stats Grid
    const drawStat = (label: string, val: string, x: number, y: number) => {
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.font = "20px 'Inter', sans-serif";
      ctx.fillText(label, x, y);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 28px 'Inter', monospace";
      ctx.fillText(val, x, y + 40);
    };

    drawStat("ENTRY PRICE", `$${normalized.entryPrice.toLocaleString("en-US")}`, 80, 610);
    drawStat("EXIT / MARK", `$${normalized.exitPrice.toLocaleString("en-US")}`, 440, 610);

    if (!hideAmounts && normalized.stake > 0) {
      drawStat("STAKE / MARGIN", `$${normalized.stake.toLocaleString("en-US")}`, 80, 720);
      drawStat("HOLD DURATION", normalized.duration, 440, 720);
    } else {
      drawStat("HOLD DURATION", normalized.duration, 80, 720);
      drawStat("SETTLEMENT DATE", normalized.date, 440, 720);
    }

    // 9. Footer Watermark
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "18px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Simulated outcome model · godcandle.io", w / 2, 940);

    return canvas;
  }, [normalized, hideAmounts]);

  const handleDownloadPng = useCallback(async () => {
    if (!normalized) return;
    setDownloading(true);
    try {
      const canvas = generateCanvas();
      if (!canvas) throw new Error("Canvas generation failed");

      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `godcandle-pnl-${normalized.symbol.toLowerCase()}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast.success("Trade card downloaded as PNG!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate trade card");
    } finally {
      setDownloading(false);
    }
  }, [normalized, generateCanvas]);

  const handleCopyImage = useCallback(async () => {
    if (!normalized) return;
    setCopyingImage(true);
    try {
      const canvas = generateCanvas();
      if (!canvas) throw new Error("Canvas generation failed");

      if (navigator.clipboard && "write" in navigator.clipboard && window.ClipboardItem) {
        canvas.toBlob(async (blob) => {
          if (!blob) {
            toast.error("Could not create image blob");
            setCopyingImage(false);
            return;
          }
          try {
            await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
            setImageCopied(true);
            toast.success("P&L card copied to clipboard as image!");
            setTimeout(() => setImageCopied(false), 2200);
          } catch (e) {
            console.error(e);
            navigator.clipboard.writeText(
              `Godcandle Trade: ${normalized.symbol} ${normalized.side.toUpperCase()} ${normalized.leverage}x | P&L: ${formatPct(normalized.pnlPct)}`,
            );
            toast.success("Trade summary copied to clipboard!");
          } finally {
            setCopyingImage(false);
          }
        }, "image/png");
      } else {
        await navigator.clipboard.writeText(
          `Godcandle Trade: ${normalized.symbol} ${normalized.side.toUpperCase()} ${normalized.leverage}x | P&L: ${formatPct(normalized.pnlPct)}`,
        );
        setImageCopied(true);
        toast.success("Trade summary copied to clipboard!");
        setTimeout(() => setImageCopied(false), 2200);
        setCopyingImage(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not copy card image");
      setCopyingImage(false);
    }
  }, [normalized, generateCanvas]);

  const handleShare = useCallback(async () => {
    if (!normalized) return;
    const shareText = `Godcandle P&L: ${normalized.symbol} ${normalized.side.toUpperCase()} ${normalized.leverage}x (${formatPct(normalized.pnlPct)})`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Godcandle Trade P&L",
          text: shareText,
          url: window.location.href,
        });
        toast.success("Shared successfully!");
      } catch (err: unknown) {
        if ((err as Error)?.name !== "AbortError") {
          navigator.clipboard?.writeText(window.location.href);
          toast.success("Link copied to clipboard");
        }
      }
    } else {
      navigator.clipboard?.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  }, [normalized]);

  if (!normalized) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-[14px] animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative z-10 w-full sm:max-w-[880px] lg:max-w-[920px] flex flex-col items-center gap-3 sm:gap-4 animate-in zoom-in-95 fade-in-0 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Split Card with delicate rainbow gradient border */}
        <div className="relative w-full min-h-[460px] sm:min-h-0 aspect-[16/10] sm:aspect-auto sm:h-[480px] md:h-[500px] rounded-[28px] p-[1.5px] bg-gradient-to-tr from-[#CDC3F0] via-[#FFDAC8] to-[#A0D4CA] shadow-[0_24px_80px_rgba(0,0,0,0.55)] flex overflow-hidden">
          <div className="w-full h-full bg-[#0D1117] rounded-[26.5px] flex flex-col sm:flex-row overflow-hidden relative">
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-30 size-8 flex items-center justify-center rounded-full bg-[#161B22]/90 hover:bg-[#21262D] text-[#E6EDF3] shadow-md border border-[#30363D] hover:border-[#58A6FF] transition-all cursor-pointer"
              aria-label="Close modal"
            >
              <X className="size-4" />
            </button>

            {/* LEFT HALF (50%): Deep Solid Dark Surface (#0D1117 / #161B22) */}
            <div className="relative flex-1 sm:w-1/2 h-full bg-[#0D1117] p-5 sm:p-7 flex flex-col justify-between overflow-y-auto no-scrollbar z-10 text-[#E6EDF3]">
              {/* Top Row: Wordmark + Live badge */}
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-black text-[18px] tracking-wider text-white">
                      GODCANDLE
                    </span>
                    <span className="size-2 rounded-full bg-[#00D964] shadow-[0_0_10px_#00D964]" />
                    <span className="rounded-full border border-white/10 bg-gradient-to-r from-[#CDC3F0]/20 via-[#FFDAC8]/20 to-[#A0D4CA]/20 px-2.5 py-0.5 text-[10px] font-mono text-white/90">
                      EVM Live
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[#8B949E]">
                    {normalized.date}
                  </span>
                </div>

                {/* Pair Name + Side Badge + Leverage */}
                <div className="flex items-center gap-2.5 mt-3 sm:mt-4">
                  <span className="font-bold text-2xl sm:text-[28px] tracking-tight text-white font-sans">
                    {normalized.symbol}
                  </span>
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider font-mono",
                      normalized.side === "long" ? "bg-[#00D964] text-black" : "bg-[#FF3B30] text-white"
                    )}
                  >
                    {normalized.side} {normalized.leverage}×
                  </span>
                </div>
              </div>

              {/* Middle Section: Massive Bold ROI % and Dollar Amount */}
              <div className="my-auto py-2 sm:py-3">
                <p className="text-[10px] sm:text-[11px] uppercase tracking-wider font-mono font-semibold text-[#8B949E]">
                  REALIZED P&L
                </p>
                <div
                  className={cn(
                    "font-sans text-[48px] sm:text-[62px] md:text-[68px] font-extrabold tracking-[-2px] leading-none my-1",
                    normalized.isProfit ? "text-[#00D964]" : "text-[#FF3B30]"
                  )}
                >
                  {formatPct(normalized.pnlPct)}
                </div>
                {!hideAmounts && (
                  <p className="text-sm sm:text-base font-semibold font-mono text-[#8B949E] mt-1">
                    {formatPnl(normalized.pnl)}
                  </p>
                )}
              </div>

              {/* Bottom Section: Clean 3-Column Stats Row & Domain */}
              <div className="space-y-3 pt-3 border-t border-[#21262D]">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-[9px] sm:text-[10px] font-mono uppercase text-[#8B949E] tracking-wider truncate">
                      ENTRY
                    </p>
                    <p className="text-xs sm:text-sm font-bold font-mono text-white mt-0.5 truncate">
                      ${normalized.entryPrice.toLocaleString("en-US")}
                    </p>
                  </div>
                  <div className="border-l border-[#21262D] pl-2.5">
                    <p className="text-[9px] sm:text-[10px] font-mono uppercase text-[#8B949E] tracking-wider truncate">
                      EXIT / MARK
                    </p>
                    <p className="text-xs sm:text-sm font-bold font-mono text-white mt-0.5 truncate">
                      ${normalized.exitPrice.toLocaleString("en-US")}
                    </p>
                  </div>
                  <div className="border-l border-[#21262D] pl-2.5">
                    <p className="text-[9px] sm:text-[10px] font-mono uppercase text-[#8B949E] tracking-wider truncate">
                      DURATION
                    </p>
                    <p className="text-xs sm:text-sm font-bold font-mono text-white mt-0.5 truncate">
                      {normalized.duration}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#21262D]/60 text-[10px] text-[#8B949E] font-mono">
                  <span>godcandle.io</span>
                  <span>EVM 1000X PERP</span>
                </div>
              </div>
            </div>

            {/* RIGHT HALF (50%): CLAUDE MONET'S "THE CLIFFS AT ÉTRETAT" (1885) ART PANEL */}
            <div
              className="relative hidden sm:block sm:w-1/2 h-full overflow-hidden select-none bg-[#0D1117]"
              aria-label="Claude Monet, 1885 · The Cliffs at Étretat"
              title="Claude Monet, 1885 · The Cliffs at Étretat"
            >
              <img
                src="/images/monet-etretat.jpg"
                alt="Claude Monet, 1885 · The Cliffs at Étretat"
                className="absolute inset-0 w-full h-full object-cover object-center filter saturate-[1.08] contrast-[1.02]"
                loading="eager"
              />

              {/* Iridescent Pastel Rainbow Sheen Overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-[#CDC3F0]/25 via-[#FFDAC8]/20 to-[#A0D4CA]/25 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/20 pointer-events-none" />

              {/* Content Overlay */}
              <div className="relative z-10 h-full w-full p-6 sm:p-7 flex flex-col justify-between">
                <div className="flex justify-start items-center gap-2 pr-12">
                  <div className="rounded-full bg-[#0D1117]/80 backdrop-blur-md border border-white/20 px-2.5 py-1 flex items-center gap-1.5 text-[10px] font-mono text-white shadow-xs">
                    <span className="size-1.5 rounded-full bg-[#00D964] animate-pulse" />
                    <span>Mainnet Live</span>
                  </div>
                </div>

                {/* Bottom Floating Plaque (Godcandle dark glass aesthetic) */}
                <div
                  className="rounded-2xl bg-[#0D1117]/85 backdrop-blur-md p-4 border border-white/20 shadow-lg text-white"
                  aria-label="Claude Monet, 1885 · The Cliffs at Étretat"
                >
                  <p className="font-sans text-lg sm:text-xl font-bold leading-tight text-white">
                    Perps. Options. Up to 1000x.
                  </p>
                  <p className="text-xs font-medium text-white/80 mt-0.5">
                    One terminal. Institutional-grade liquidity.
                  </p>
                  <div className="mt-2.5 flex items-center justify-between text-[10px] text-white/70 font-mono">
                    <span className="rounded-full bg-gradient-to-r from-[#CDC3F0]/30 via-[#FFDAC8]/30 to-[#A0D4CA]/30 px-2 py-0.5 font-semibold text-white border border-white/20">
                      Claude Monet, 1885
                    </span>
                    <span className="italic font-sans text-white/90">The Cliffs at Étretat</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls Row: Hide amounts toggle & Action buttons (Matching Reference Screenshots) */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 px-2 pt-1">
          {/* Hide amounts switch */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hideAmounts}
              onChange={(e) => setHideAmounts(e.target.checked)}
              className="sr-only"
            />
            <div
              className={cn(
                "w-11 h-6 rounded-full transition-colors p-0.5 relative",
                hideAmounts ? "bg-[#30363D]" : "bg-white/20 hover:bg-white/30"
              )}
            >
              <div
                className={cn(
                  "size-5 rounded-full bg-white transition-transform duration-200 shadow-sm",
                  hideAmounts ? "translate-x-5" : "translate-x-0"
                )}
              />
            </div>
            <span className="text-xs font-mono text-[#8B949E] hover:text-white transition-colors">
              Hide amounts
            </span>
          </label>

          {/* Action Buttons: Copy, Share, Download */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleCopyImage}
              disabled={copyingImage}
              className="h-10 px-4 rounded-xl border border-[#30363D] bg-[#161B22] hover:bg-[#21262D] text-white text-xs font-mono font-medium transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              {imageCopied ? (
                <Check className="size-4 text-[#00D964]" />
              ) : (
                <Copy className="size-4 text-[#8B949E]" />
              )}
              <span>{imageCopied ? "Copied" : "Copy"}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="h-10 px-4 rounded-xl border border-white/20 bg-white hover:bg-white/90 text-black text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Share2 className="size-3.5" />
              <span>Share</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={downloading}
              className="h-10 px-4 rounded-xl bg-[#00D964] hover:bg-[#00BF57] text-[#080B0F] text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(0,217,100,0.25)] disabled:opacity-50"
            >
              <Download className="size-4 stroke-[2.5]" />
              <span>Download as PNG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
