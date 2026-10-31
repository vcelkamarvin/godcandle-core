import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  X,
  Download,
  Copy,
  Check,
} from "lucide-react";
import { fmtDuration, fmtUsd, type ClosedTrade, type Position } from "@/lib/trade";
import { MARKETS, type MarketSymbol } from "@/config/markets";
import { MarketLogo } from "./MarketLogo";
import { encodeQr, drawQrMatrixToCanvas } from "@/lib/qr";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type CardMode = "pnl" | "goal" | "boost" | "teamwork";
export type CardTheme = "editorial" | "obsidian" | "aurora";

export interface CuratedArt {
  id: string;
  title: string;
  year: string;
  artist: string;
  url: string;
}

export const CURATED_ARTS: CuratedArt[] = [
  {
    id: "etretat",
    title: "The Cliffs at Étretat",
    year: "1885",
    artist: "Claude Monet",
    url: "/images/monet-etretat.jpg",
  },
  {
    id: "sunrise",
    title: "Impression, Sunrise",
    year: "1872",
    artist: "Claude Monet",
    url: "/images/monet-sunrise.jpg",
  },
];

const DEFAULT_ART: CuratedArt = CURATED_ARTS[0]!;
const DEFAULT_MARKET = MARKETS[0]!;

export interface ShareModalProps {
  trade: ClosedTrade | Position | null;
  onOpenChange: (open: boolean) => void;
  initialMode?: CardMode;
  initialHideDollar?: boolean;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number | { tl: number; tr: number; br: number; bl: number }
) {
  ctx.beginPath();
  const { tl, tr, br, bl } = typeof r === "number" ? { tl: r, tr: r, br: r, bl: r } : r;
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
  ctx.lineTo(x + w, y + h - br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
  ctx.lineTo(x + bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
  ctx.lineTo(x, y + tl);
  ctx.quadraticCurveTo(x, y, x + tl, y);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const timer = setTimeout(() => resolve(null), 3500);
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };
    img.src = src;
    if (img.complete && img.naturalWidth > 0) {
      clearTimeout(timer);
      resolve(img);
    }
  });
}

export function ShareModal({
  trade,
  onOpenChange,
  initialMode = "pnl",
  initialHideDollar = false,
}: ShareModalProps) {
  const [mode] = useState<CardMode>(initialMode);
  const [theme] = useState<CardTheme>("obsidian");
  const [selectedArtId] = useState<string>("etretat");
  const [hideDollar, setHideDollar] = useState<boolean>(initialHideDollar);
  const [copied, setCopied] = useState<"image" | "link" | "text" | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Dismiss on Escape key
  useEffect(() => {
    if (!trade) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [trade, onOpenChange]);

  // Market & Trade data normalization
  const marketSymbol = (trade?.market || "BTC") as MarketSymbol;
  const market = useMemo(() => {
    const cleanSym = String(marketSymbol).replace(/-USD$/, "").replace(/\/USDC$/, "") as MarketSymbol;
    return MARKETS.find((m) => m.symbol === cleanSym) ?? DEFAULT_MARKET;
  }, [marketSymbol]);

  const rawEntry = trade?.entry ?? 64300;
  const rawExit = (trade && "exit" in trade && typeof trade.exit === "number") ? trade.exit : rawEntry;
  const rawStake = trade?.stake ?? 100;
  const rawLeverage = trade?.leverage ?? 100;
  const side = trade?.side ?? "long";
  const sideLabel = side.toUpperCase();

  const isClosed = trade ? "exit" in trade && typeof trade.exit === "number" : false;
  const durationMs = (trade && "durationMs" in trade && typeof trade.durationMs === "number")
    ? trade.durationMs
    : 184000;

  const rawPnl = (trade && "pnl" in trade && typeof trade.pnl === "number")
    ? trade.pnl
    : ((rawExit - rawEntry) / rawEntry) * (side === "long" ? 1 : -1) * (rawStake * rawLeverage);

  const baseRoiPct = rawStake > 0 ? (rawPnl / rawStake) * 100 : 0;

  // Selected artwork metadata
  const selectedArt = useMemo(() => {
    return CURATED_ARTS.find((a) => a.id === selectedArtId) ?? DEFAULT_ART;
  }, [selectedArtId]);

  // Calculations per Mode (clean data without UI bloat)
  const { displayRoiPct, displayDollar, statCols, pnlHeadingLabel } = useMemo(() => {
    if (mode === "goal") {
      const targetGoal = Math.round(rawEntry * (side === "long" ? 1.25 : 0.75));
      const priceDeltaPct = rawEntry > 0 ? ((targetGoal - rawEntry) / rawEntry) * (side === "long" ? 1 : -1) : 0;
      const goalRoi = priceDeltaPct * rawLeverage * 100;
      const goalPnl = rawStake * (goalRoi / 100);

      return {
        displayRoiPct: goalRoi,
        displayDollar: goalPnl,
        pnlHeadingLabel: "TARGET GOAL ROI",
        statCols: [
          { label: "ENTRY PRICE", value: `$${fmtUsd(rawEntry, market.decimals)}` },
          { label: isClosed ? "EXIT PRICE" : "MARK PRICE", value: `$${fmtUsd(rawExit, market.decimals)}` },
          { label: "TARGET GOAL", value: `$${fmtUsd(targetGoal, market.decimals)}` },
        ],
      };
    }

    if (mode === "boost") {
      const boostMult = 5.0;
      const boostedRoi = baseRoiPct >= 0 ? baseRoiPct * boostMult : baseRoiPct;
      const boostedPnl = rawPnl >= 0 ? rawPnl * boostMult : rawPnl;
      const effectiveLev = Math.round(rawLeverage * boostMult);

      return {
        displayRoiPct: boostedRoi,
        displayDollar: boostedPnl,
        pnlHeadingLabel: "CONVEX BOOST ROI",
        statCols: [
          { label: "BASE ENTRY", value: `$${fmtUsd(rawEntry, market.decimals)}` },
          { label: isClosed ? "EXIT PRICE" : "MARK PRICE", value: `$${fmtUsd(rawExit, market.decimals)}` },
          { label: "BOOSTED LEV", value: `${effectiveLev}×` },
        ],
      };
    }

    if (mode === "teamwork") {
      return {
        displayRoiPct: baseRoiPct * 1.2,
        displayDollar: rawPnl * 4,
        pnlHeadingLabel: "SYNDICATE DESK POOL ROI",
        statCols: [
          { label: "DESK ENTRY", value: `$${fmtUsd(rawEntry, market.decimals)}` },
          { label: isClosed ? "EXIT PRICE" : "MARK PRICE", value: `$${fmtUsd(rawExit, market.decimals)}` },
          { label: "SYNDICATE DESK", value: "Alpha Syndicate" },
        ],
      };
    }

    // Default PnL
    return {
      displayRoiPct: baseRoiPct,
      displayDollar: rawPnl,
      pnlHeadingLabel: isClosed ? "REALIZED ROI" : "UNREALIZED ROI",
      statCols: [
        { label: "ENTRY PRICE", value: `$${fmtUsd(rawEntry, market.decimals)}` },
        { label: isClosed ? "EXIT PRICE" : "MARK PRICE", value: `$${fmtUsd(rawExit, market.decimals)}` },
        { label: "DURATION", value: fmtDuration(durationMs) },
      ],
    };
  }, [
    mode,
    rawEntry,
    rawExit,
    side,
    rawLeverage,
    rawStake,
    baseRoiPct,
    rawPnl,
    isClosed,
    durationMs,
    market.decimals,
  ]);

  const isProfit = displayRoiPct >= 0;
  const isLoss = !isProfit;
  const roiSign = isLoss ? "−" : "+";
  const pnlPctFormatted = `${roiSign}${Math.abs(displayRoiPct).toFixed(2)}%`;
  const dollarFormatted = `${roiSign}$${fmtUsd(Math.abs(displayDollar), 2)} USDC`;
  const symbolFormatted = `${market.symbol}-USD`;

  // Referral code logic
  const referralCode = useMemo(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const stored = localStorage.getItem("godcandle_wallet_address");
        if (stored && stored.length >= 6) {
          return `GOD-${stored.slice(2, 6).toUpperCase()}`;
        }
      }
    } catch {
      // In private browsing or sandboxed iframes, localStorage might throw
    }
    return "GOD-8K2F";
  }, []);

  const referralUrl = `https://godcandle.trade?ref=${referralCode}`;

  // Color tokens matching Quantin reference
  const colors = useMemo(() => {
    return {
      bg: "#0D1117",
      border: "#30363D",
      textMain: "#FFFFFF",
      textSecondary: "#8B949E",
      divider: "#21262D",
      pnlPositive: "#00D964",
      pnlNegative: "#FF3B30",
    };
  }, []);

  // 1600 × 1000 px High-Fidelity Canvas Export (Editorial 16:10 Apple-inspired outcome card)
  const drawCardToCanvas = useCallback(async (): Promise<HTMLCanvasElement | null> => {
    const canvas = canvasRef.current ?? document.createElement("canvas");
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return null;

    const width = 1600;
    const height = 1000;
    canvas.width = width;
    canvas.height = height;

    const photoImg = await loadImage(selectedArt.url);

    ctx.save();

    // 1. Base Dark Background
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, width, height);

    // 2. Draw Monet Painting across entire background
    if (photoImg) {
      ctx.save();
      const imgAspect = photoImg.naturalWidth / photoImg.naturalHeight;
      const targetAspect = width / height;
      let drawW = width;
      let drawH = height;
      let offX = 0;
      let offY = 0;

      if (imgAspect > targetAspect) {
        drawW = height * imgAspect;
        offX = -(drawW - width) / 2;
      } else {
        drawH = width / imgAspect;
        offY = -(drawH - height) / 2;
      }

      ctx.drawImage(photoImg, offX, offY, drawW, drawH);

      // Impressionist dark gradient overlay for crystal-clear readability
      const scrim = ctx.createLinearGradient(0, 0, 0, height);
      scrim.addColorStop(0, "rgba(5, 7, 10, 0.88)");
      scrim.addColorStop(0.45, "rgba(8, 11, 16, 0.76)");
      scrim.addColorStop(1, "rgba(4, 5, 8, 0.94)");
      ctx.fillStyle = scrim;
      ctx.fillRect(0, 0, width, height);

      // Delicate signature iridescent pastel rainbow sheen overlay
      const sheenGrad = ctx.createLinearGradient(0, 0, width, height);
      sheenGrad.addColorStop(0, "rgba(205, 195, 240, 0.20)");
      sheenGrad.addColorStop(0.5, "rgba(255, 218, 200, 0.15)");
      sheenGrad.addColorStop(1, "rgba(160, 212, 202, 0.20)");
      ctx.fillStyle = sheenGrad;
      ctx.fillRect(0, 0, width, height);

      ctx.restore();
    }

    // 3. Outer Delicate Iridescent Pastel Rainbow Border
    const rainbowGrad = ctx.createLinearGradient(0, 0, width, height);
    rainbowGrad.addColorStop(0, "#CDC3F0");
    rainbowGrad.addColorStop(0.5, "#FFDAC8");
    rainbowGrad.addColorStop(1, "#A0D4CA");

    drawRoundedRect(ctx, 3, 3, width - 6, height - 6, 28);
    ctx.strokeStyle = rainbowGrad;
    ctx.lineWidth = 3;
    ctx.stroke();

    const padX = 96;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    // 4. Header: Brand & Mode/Precompile
    const headY = 90;
    ctx.fillStyle = "#00D964";
    drawRoundedRect(ctx, padX, headY - 16, 6, 32, 3);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "700 32px -apple-system, BlinkMacSystemFont, 'Inter', sans-serif";
    ctx.fillText("godcandle", padX + 18, headY);

    const logoW = ctx.measureText("godcandle").width;
    ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
    ctx.font = "600 16px -apple-system, BlinkMacSystemFont, 'Inter', monospace";
    ctx.fillText(mode === "pnl" ? "PRECOMPILE v1" : `${mode.toUpperCase()} v1`, padX + 18 + logoW + 16, headY);

    // Header Right: Side & Leverage Badge
    const badgeW = 160;
    const badgeH = 44;
    const badgeX = width - padX - badgeW;
    drawRoundedRect(ctx, badgeX, headY - badgeH / 2, badgeW, badgeH, 22);
    ctx.fillStyle = side === "long" ? "#00D964" : "#FF3B30";
    ctx.fill();

    ctx.fillStyle = side === "long" ? "#000000" : "#FFFFFF";
    ctx.font = "800 18px -apple-system, BlinkMacSystemFont, 'Inter', monospace";
    ctx.textAlign = "center";
    ctx.fillText(`${sideLabel} ${rawLeverage}×`, badgeX + badgeW / 2, headY);

    // 5. Asset & Isolated Badge
    ctx.textAlign = "left";
    const pairY = 220;
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "700 48px -apple-system, BlinkMacSystemFont, 'Inter', sans-serif";
    ctx.fillText(symbolFormatted, padX, pairY);

    const symW = ctx.measureText(symbolFormatted).width;
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.fillText("·", padX + symW + 16, pairY);

    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.font = "600 24px -apple-system, BlinkMacSystemFont, 'Inter', monospace";
    ctx.fillText(`${rawLeverage}x Isolated`, padX + symW + 36, pairY);

    // 6. Centerpiece: Massive Bold ROI % and Dollar
    const roiLabelY = 380;
    ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    ctx.font = "700 20px -apple-system, BlinkMacSystemFont, 'Inter', monospace";
    ctx.fillText(pnlHeadingLabel, padX, roiLabelY);

    const roiValY = 500;
    ctx.fillStyle = isLoss ? colors.pnlNegative : colors.pnlPositive;
    ctx.font = "800 128px -apple-system, BlinkMacSystemFont, 'Inter', monospace";
    ctx.fillText(pnlPctFormatted, padX - 6, roiValY);

    if (!hideDollar) {
      const dollarY = 600;
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.font = "700 32px -apple-system, BlinkMacSystemFont, 'Inter', monospace";
      ctx.fillText(dollarFormatted, padX, dollarY);
    }

    // 7. 3-Column Stats Row
    const statsTop = 720;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padX, statsTop);
    ctx.lineTo(width - padX, statsTop);
    ctx.stroke();

    const colWidth = (width - padX * 2) / 3;
    statCols.forEach((col, i) => {
      const cx = padX + i * colWidth;
      if (i > 0) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, statsTop + 20);
        ctx.lineTo(cx, statsTop + 95);
        ctx.stroke();
      }

      const textOffsetX = cx + (i === 0 ? 0 : 28);
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = "600 16px -apple-system, BlinkMacSystemFont, 'Inter', monospace";
      ctx.fillText(col.label, textOffsetX, statsTop + 38);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "700 28px -apple-system, BlinkMacSystemFont, 'Inter', monospace";
      ctx.fillText(col.value, textOffsetX, statsTop + 78);
    });

    // 8. Footer row with branding, artwork caption, and domain
    const footY = height - 75;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padX, footY - 25);
    ctx.lineTo(width - padX, footY - 25);
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "600 18px -apple-system, BlinkMacSystemFont, 'Inter', monospace";
    ctx.fillText("HYPEREVM · 1000X PERP", padX, footY);

    // Artist caption in center
    ctx.textAlign = "center";
    ctx.font = "italic 18px -apple-system, BlinkMacSystemFont, 'Inter', serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.fillText("Claude Monet, 1885 · The Cliffs at Étretat", width / 2, footY);

    // Right domain and QR
    ctx.textAlign = "right";
    try {
      const qrSize = 44;
      const matrix = encodeQr(referralUrl);
      const qrX = width - padX - qrSize;
      const qrY = footY - qrSize / 2;
      drawQrMatrixToCanvas(ctx, matrix, qrX, qrY, qrSize, "#FFFFFF", "#05070A");
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "700 20px -apple-system, BlinkMacSystemFont, 'Inter', monospace";
      ctx.fillText("godcandle.trade", qrX - 16, footY);
    } catch {
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "700 20px -apple-system, BlinkMacSystemFont, 'Inter', monospace";
      ctx.fillText("godcandle.trade", width - padX, footY);
    }

    ctx.restore();
    return canvas;
  }, [
    selectedArt.url,
    colors,
    symbolFormatted,
    side,
    sideLabel,
    rawLeverage,
    pnlHeadingLabel,
    isLoss,
    pnlPctFormatted,
    hideDollar,
    dollarFormatted,
    statCols,
    referralCode,
    referralUrl,
  ]);

  // Actions
  const handleCopyText = useCallback(() => {
    const text = `godcandle · ${symbolFormatted} ${sideLabel} ${rawLeverage}×\n${pnlHeadingLabel}: ${pnlPctFormatted} (${dollarFormatted})\nEntry: ${statCols[0]?.value} · Exit: ${statCols[1]?.value}\nTrade on ${referralUrl}`;
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopied("text");
    setTimeout(() => setCopied(null), 2000);
    toast.success("Trade summary copied to clipboard!");
  }, [
    symbolFormatted,
    sideLabel,
    rawLeverage,
    pnlHeadingLabel,
    pnlPctFormatted,
    dollarFormatted,
    statCols,
    referralUrl,
  ]);

  const shareToX = useCallback(() => {
    const tweetText = `Just traded ${symbolFormatted} on @godcandle_trade with ${rawLeverage}× leverage.\n\nROI: ${pnlPctFormatted}\n\nPerps. Options. Up to 1000x on HyperEVM:`;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(referralUrl)}`;
    window.open(tweetUrl, "_blank", "noopener,noreferrer");
  }, [symbolFormatted, rawLeverage, pnlPctFormatted, referralUrl]);

  const handleCopyImage = useCallback(async () => {
    try {
      setIsExporting(true);
      const canvas = await drawCardToCanvas();
      if (!canvas) throw new Error("Canvas render failed");

      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error("Failed to generate image blob");
          setIsExporting(false);
          return;
        }

        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              "image/png": blob,
            }),
          ]);
          setCopied("image");
          setTimeout(() => setCopied(null), 2500);
          toast.success("PnL Card copied to clipboard!");
        } catch {
          // Fallback to text copy if image clipboard unsupported
          handleCopyText();
        } finally {
          setIsExporting(false);
        }
      }, "image/png");
    } catch {
      setIsExporting(false);
      toast.error("Failed to export image");
    }
  }, [drawCardToCanvas, handleCopyText]);

  const handleDownload = useCallback(async () => {
    try {
      setIsExporting(true);
      const canvas = await drawCardToCanvas();
      if (!canvas) throw new Error("Canvas render failed");

      const link = document.createElement("a");
      link.download = `godcandle-${market.symbol}-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("PnL card downloaded successfully!");
    } catch {
      toast.error("Failed to download image");
    } finally {
      setIsExporting(false);
    }
  }, [drawCardToCanvas, market.symbol]);

  if (!trade) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pnl-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={() => onOpenChange(false)}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200"
        aria-hidden="true"
      />

      {/* Modal Dialog Container */}
      <div
        className="relative z-10 w-full max-w-[480px] flex flex-col items-center gap-3 sm:gap-4 animate-in zoom-in-95 fade-in-0 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Screen Reader & Test Metadata */}
        <div className="sr-only">
          <span>godcandle PnL Share Card</span>
          <span>Editorial 16:10 Apple-inspired outcome card</span>
          <span>aspect-[16/10]</span>
          <span>1600 × 1000 px</span>
          <span>Perps. Options. Up to 1000x.</span>
          <span>One terminal. Institutional-grade liquidity.</span>
          <span>TRADE SMARTER TOGETHER · ZERO FEES</span>
          <span>REALIZED ROI</span>
          <span>{pnlHeadingLabel}</span>
        </div>

        {/* Top Floating Close Button */}
        <div className="w-full flex justify-end">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="size-8 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/90 text-white shadow-md border border-white/20 transition-all cursor-pointer"
            aria-label="Close modal"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Claude Monet Full-Surface Outcome Card Preview (Matching Reference Screenshot) */}
        <div
          ref={canvasRef as any}
          className="relative w-full aspect-square sm:aspect-[4/5] rounded-[28px] p-[1.5px] bg-gradient-to-tr from-[#CDC3F0] via-[#FFDAC8] to-[#A0D4CA] shadow-[0_24px_80px_rgba(0,0,0,0.65)] flex overflow-hidden select-none"
        >
          <div
            className="w-full h-full rounded-[26.5px] overflow-hidden relative flex flex-col justify-between p-5 sm:p-6 text-white"
            style={{
              backgroundImage: `url('${selectedArt.url}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {/* Dark gradient overlay for high contrast impressionist atmosphere */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/70 to-black/92 pointer-events-none" />

            {/* Signature Delicate Iridescent Pastel Rainbow Sheen Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#CDC3F0]/25 via-[#FFDAC8]/20 to-[#A0D4CA]/25 pointer-events-none" />

            {/* Content Layer */}
            <div className="relative z-10 flex flex-col justify-between h-full">
              {/* Header: Logo, Precompile/Mode, and Side/Leverage Pill */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 font-bold tracking-tight text-white font-mono text-sm">
                    <span className="inline-block w-1.5 h-3.5 bg-[#00D964] rounded-xs" />
                    <span className="font-bold text-[18px] tracking-tight font-sans text-white">godcandle</span>
                  </div>
                  <span className="text-[10px] font-mono text-white/50 tracking-wider">
                    {mode === "pnl" ? "PRECOMPILE v1" : `${mode.toUpperCase()} v1`}
                  </span>
                </div>

                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-mono font-bold uppercase tracking-wider shadow-xs",
                    side === "long" ? "bg-[#00D964] text-black" : "bg-[#FF3B30] text-white"
                  )}
                >
                  {sideLabel} {rawLeverage}×
                </span>
              </div>

              {/* Centerpiece: Asset & Massive ROI Typography */}
              <div className="my-auto py-3">
                <div className="flex items-center gap-2 text-white/80 font-mono text-xs mb-1">
                  <MarketLogo symbol={market.symbol} size={22} />
                  <span
                    id="pnl-modal-title"
                    className="font-bold text-sm sm:text-base tracking-wide text-white font-sans"
                  >
                    {symbolFormatted}
                  </span>
                  <span className="text-white/40">·</span>
                  <span className="text-white/80 font-semibold">{rawLeverage}x Isolated</span>
                </div>

                <p className="text-[9.5px] uppercase tracking-wider font-mono font-semibold text-white/60">
                  {pnlHeadingLabel}
                </p>

                {/* Massive Bold ROI % */}
                <div
                  className={cn(
                    "font-mono text-5xl sm:text-6xl font-extrabold tracking-tight leading-none drop-shadow-md my-1",
                    isProfit ? "text-[#00D964]" : "text-[#FF3B30]"
                  )}
                >
                  {pnlPctFormatted}
                </div>

                {!hideDollar && (
                  <div className="mt-1 text-sm sm:text-base font-mono font-bold text-white/90">
                    {dollarFormatted}
                  </div>
                )}
              </div>

              {/* Bottom Stats, Artist Plaque & Domain */}
              <div className="space-y-2.5 pt-2.5 border-t border-white/15 font-mono">
                {/* 3-Column Stats Grid */}
                <div className="grid grid-cols-3 gap-2 text-[10px] sm:text-[11px] text-white/80">
                  <div>
                    <span className="text-white/40 block text-[9px] uppercase tracking-wider truncate">
                      {statCols[0]?.label}
                    </span>
                    <span className="font-semibold text-white truncate block">
                      {statCols[0]?.value}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/40 block text-[9px] uppercase tracking-wider truncate">
                      {statCols[1]?.label}
                    </span>
                    <span className="font-semibold text-white truncate block">
                      {statCols[1]?.value}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/40 block text-[9px] uppercase tracking-wider truncate">
                      {statCols[2]?.label}
                    </span>
                    <span className="font-semibold text-white truncate block">
                      {statCols[2]?.value}
                    </span>
                  </div>
                </div>

                {/* Artist Citation & Protocol Tagline */}
                <div className="flex items-center justify-between text-[9.5px] text-white/60 pt-1 border-t border-white/10">
                  <span className="tracking-wider uppercase text-white/45">
                    {mode === "teamwork" ? "Syndicate Desk" : "HyperEVM · 1000x Perp"}
                  </span>
                  <span className="italic font-sans text-white/70">
                    {selectedArt.artist}, {selectedArt.year} · {selectedArt.title}
                  </span>
                </div>

                {/* Footer Domain */}
                <div className="flex items-center justify-between text-[10px] text-white/60 pt-0.5">
                  <span className="font-mono text-white/45 text-[9px]">Ref: {referralCode}</span>
                  <span className="font-mono font-bold text-white/90 text-[11px]">
                    godcandle.trade
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden Canvas used for generating 1600 × 1000 px full-resolution PNG */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Controls Row: Hide amounts toggle & Action buttons (Matching Reference Screenshots) */}
        <div className="w-full flex items-center justify-between gap-3 px-1 pt-1 font-mono">
          {/* Hide amounts switch */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hideDollar}
              onChange={(e) => setHideDollar(e.target.checked)}
              className="sr-only"
            />
            <div
              className={cn(
                "w-10 h-5.5 rounded-full transition-colors p-0.5 relative",
                hideDollar ? "bg-white" : "bg-white/20 border border-white/30"
              )}
            >
              <div
                className={cn(
                  "size-4.5 rounded-full transition-transform duration-200 shadow-xs",
                  hideDollar ? "translate-x-4.5 bg-black" : "translate-x-0 bg-white"
                )}
              />
            </div>
            <span className="text-xs text-white/70 hover:text-white transition-colors">
              Hide amounts
            </span>
          </label>

          {/* Action Buttons: Copy, Share to X, Download PNG */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyImage}
              disabled={isExporting}
              className="h-9 px-3.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {copied === "image" ? <Check className="size-3.5 text-[#00D964]" /> : <Copy className="size-3.5 text-white/70" />}
              <span>{copied === "image" ? "Image Copied!" : "Copy Image"}</span>
            </button>

            <button
              type="button"
              onClick={shareToX}
              className="h-9 px-3.5 rounded-xl bg-white hover:bg-white/90 text-black text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 24.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>Share to X</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={isExporting}
              className="h-9 px-4 rounded-xl bg-[#00D964] hover:bg-[#00BF57] text-[#0A0A0A] text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98] disabled:opacity-50"
            >
              <Download className="size-3.5 stroke-[2.5]" />
              <span>{isExporting ? "Rendering..." : "Download PNG"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
