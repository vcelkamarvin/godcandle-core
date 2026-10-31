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
  const [hideDollar] = useState<boolean>(initialHideDollar);
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

    // 2. Outer Delicate Iridescent Pastel Rainbow Border
    const rainbowGrad = ctx.createLinearGradient(0, 0, width, height);
    rainbowGrad.addColorStop(0, "#CDC3F0");
    rainbowGrad.addColorStop(0.5, "#FFDAC8");
    rainbowGrad.addColorStop(1, "#A0D4CA");

    drawRoundedRect(ctx, 2, 2, width - 4, height - 4, 28);
    ctx.strokeStyle = rainbowGrad;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Clip card inner
    drawRoundedRect(ctx, 3.5, 3.5, width - 7, height - 7, 26.5);
    ctx.clip();

    // Fill Inner Surface
    ctx.fillStyle = "#0D1117";
    ctx.fillRect(0, 0, width, height);

    // ==========================================
    // RIGHT HALF (50%): CLAUDE MONET ART PANEL
    // ==========================================
    const splitX = width / 2; // 800
    if (photoImg) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(splitX, 0, splitX, height);
      ctx.clip();

      // Cover Fit
      const imgAspect = photoImg.naturalWidth / photoImg.naturalHeight;
      const targetAspect = splitX / height;
      let drawW = splitX;
      let drawH = height;
      let offX = splitX;
      let offY = 0;

      if (imgAspect > targetAspect) {
        drawW = height * imgAspect;
        offX = splitX - (drawW - splitX) / 2;
      } else {
        drawH = splitX / imgAspect;
        offY = -(drawH - height) / 2;
      }

      ctx.drawImage(photoImg, offX, offY, drawW, drawH);

      // Delicate iridescent pastel rainbow sheen overlay
      const sheenGrad = ctx.createLinearGradient(splitX, 0, width, height);
      sheenGrad.addColorStop(0, "rgba(205, 195, 240, 0.25)");
      sheenGrad.addColorStop(0.5, "rgba(255, 218, 200, 0.20)");
      sheenGrad.addColorStop(1, "rgba(160, 212, 202, 0.25)");
      ctx.fillStyle = sheenGrad;
      ctx.fillRect(splitX, 0, splitX, height);

      // Subtle edge vignette
      const vignetteGrad = ctx.createLinearGradient(splitX, height, splitX, 0);
      vignetteGrad.addColorStop(0, "rgba(0, 0, 0, 0.55)");
      vignetteGrad.addColorStop(0.4, "transparent");
      vignetteGrad.addColorStop(1, "rgba(0, 0, 0, 0.20)");
      ctx.fillStyle = vignetteGrad;
      ctx.fillRect(splitX, 0, splitX, height);

      // Top Network Badge on Art Panel
      const badgeX = splitX + 50;
      const badgeY = 60;
      drawRoundedRect(ctx, badgeX, badgeY, 150, 36, 18);
      ctx.fillStyle = "rgba(13, 17, 23, 0.85)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.20)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Green Pulse Dot
      ctx.beginPath();
      ctx.arc(badgeX + 22, badgeY + 18, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#00D964";
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "600 13px -apple-system, BlinkMacSystemFont, 'Inter', sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("Mainnet Live", badgeX + 36, badgeY + 18);

      // Bottom Floating Plaque (Quantin Dark Glass Aesthetic)
      const plaqueX = splitX + 50;
      const plaqueW = splitX - 100;
      const plaqueH = 190;
      const plaqueY = height - plaqueH - 60;

      drawRoundedRect(ctx, plaqueX, plaqueY, plaqueW, plaqueH, 24);
      ctx.fillStyle = "rgba(13, 17, 23, 0.88)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.20)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Plaque Typography
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "700 28px -apple-system, BlinkMacSystemFont, 'Inter', sans-serif";
      ctx.fillText("Perps. Options. Up to 1000x.", plaqueX + 28, plaqueY + 44);

      ctx.fillStyle = "rgba(255, 255, 255, 0.80)";
      ctx.font = "500 16px -apple-system, BlinkMacSystemFont, 'Inter', sans-serif";
      ctx.fillText("One terminal. Institutional-grade liquidity.", plaqueX + 28, plaqueY + 84);

      // Artist pill
      const pillW = 160;
      const pillH = 32;
      const pillY = plaqueY + 124;
      drawRoundedRect(ctx, plaqueX + 28, pillY, pillW, pillH, 16);
      const pillGrad = ctx.createLinearGradient(plaqueX + 28, pillY, plaqueX + 28 + pillW, pillY + pillH);
      pillGrad.addColorStop(0, "rgba(205, 195, 240, 0.35)");
      pillGrad.addColorStop(0.5, "rgba(255, 218, 200, 0.35)");
      pillGrad.addColorStop(1, "rgba(160, 212, 202, 0.35)");
      ctx.fillStyle = pillGrad;
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "600 13px -apple-system, BlinkMacSystemFont, 'Inter', monospace";
      ctx.textAlign = "center";
      ctx.fillText("Claude Monet, 1885", plaqueX + 28 + pillW / 2, pillY + pillH / 2);

      // Painting title
      ctx.textAlign = "right";
      ctx.font = "italic 16px -apple-system, BlinkMacSystemFont, 'Inter', serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.90)";
      ctx.fillText("The Cliffs at Étretat", plaqueX + plaqueW - 28, pillY + pillH / 2);

      ctx.restore();
    }

    // ==========================================
    // LEFT HALF (50%): DEEP SOLID DARK SURFACE
    // ==========================================
    const padX = 64;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    // 1. Header: godcandle logo + HyperEVM Live
    const headY = 80;
    ctx.fillStyle = "#00D964";
    drawRoundedRect(ctx, padX, headY - 14, 6, 28, 3);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "700 26px -apple-system, BlinkMacSystemFont, 'Inter', sans-serif";
    ctx.fillText("godcandle", padX + 16, headY);

    const logoW = ctx.measureText("godcandle").width;
    const tagX = padX + 16 + logoW + 16;
    drawRoundedRect(ctx, tagX, headY - 14, 130, 28, 14);
    const liveGrad = ctx.createLinearGradient(tagX, headY - 14, tagX + 130, headY + 14);
    liveGrad.addColorStop(0, "rgba(205, 195, 240, 0.25)");
    liveGrad.addColorStop(0.5, "rgba(255, 218, 200, 0.25)");
    liveGrad.addColorStop(1, "rgba(160, 212, 202, 0.25)");
    ctx.fillStyle = liveGrad;
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.90)";
    ctx.font = "600 12px -apple-system, BlinkMacSystemFont, 'Inter', monospace";
    ctx.textAlign = "center";
    ctx.fillText("HyperEVM Live", tagX + 65, headY);

    // 2. Pair Name + Side Badge + Leverage
    ctx.textAlign = "left";
    const pairY = 190;
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "700 42px -apple-system, BlinkMacSystemFont, 'Inter', sans-serif";
    ctx.fillText(symbolFormatted, padX, pairY);

    const pairW = ctx.measureText(symbolFormatted).width;
    const badgeX2 = padX + pairW + 18;
    const badgeW = side === "long" ? 64 : 72;
    drawRoundedRect(ctx, badgeX2, pairY - 18, badgeW, 36, 8);
    ctx.fillStyle = side === "long" ? "#00D964" : "#FF3B30";
    ctx.fill();

    ctx.fillStyle = side === "long" ? "#000000" : "#FFFFFF";
    ctx.font = "800 15px -apple-system, BlinkMacSystemFont, 'Inter', monospace";
    ctx.textAlign = "center";
    ctx.fillText(sideLabel, badgeX2 + badgeW / 2, pairY);

    ctx.textAlign = "left";
    ctx.fillStyle = "#8B949E";
    ctx.font = "600 22px -apple-system, BlinkMacSystemFont, 'Inter', monospace";
    ctx.fillText(`${rawLeverage}×`, badgeX2 + badgeW + 14, pairY);

    // 3. Middle Massive ROI % & Dollar
    const roiLabelY = 370;
    ctx.fillStyle = "#8B949E";
    ctx.font = "700 16px -apple-system, BlinkMacSystemFont, 'Inter', monospace";
    ctx.fillText(pnlHeadingLabel, padX, roiLabelY);

    const roiValY = 475;
    ctx.fillStyle = isLoss ? colors.pnlNegative : colors.pnlPositive;
    ctx.font = "800 96px -apple-system, BlinkMacSystemFont, 'Inter', sans-serif";
    ctx.fillText(pnlPctFormatted, padX - 4, roiValY);

    if (!hideDollar) {
      const dollarY = 560;
      ctx.fillStyle = "#8B949E";
      ctx.font = "600 24px -apple-system, BlinkMacSystemFont, 'Inter', monospace";
      ctx.fillText(dollarFormatted, padX, dollarY);
    }

    // 4. Clean 3-Column Stats Row
    const statsTop = 670;
    ctx.strokeStyle = "#21262D";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padX, statsTop);
    ctx.lineTo(splitX - padX, statsTop);
    ctx.stroke();

    const colWidth = (splitX - padX * 2) / 3;
    statCols.forEach((col, i) => {
      const cx = padX + i * colWidth;
      if (i > 0) {
        ctx.strokeStyle = "#21262D";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, statsTop + 20);
        ctx.lineTo(cx, statsTop + 85);
        ctx.stroke();
      }

      const textOffsetX = cx + (i === 0 ? 0 : 20);
      ctx.fillStyle = "#8B949E";
      ctx.font = "600 13px -apple-system, BlinkMacSystemFont, 'Inter', monospace";
      ctx.fillText(col.label, textOffsetX, statsTop + 35);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "700 20px -apple-system, BlinkMacSystemFont, 'Inter', monospace";
      ctx.fillText(col.value, textOffsetX, statsTop + 68);
    });

    // 5. Bottom micro footer with domain and referral
    const footY = height - 70;
    ctx.strokeStyle = "rgba(33, 38, 45, 0.6)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padX, footY - 25);
    ctx.lineTo(splitX - padX, footY - 25);
    ctx.stroke();

    ctx.fillStyle = "#8B949E";
    ctx.font = "600 14px -apple-system, BlinkMacSystemFont, 'Inter', monospace";
    ctx.fillText("godcandle.trade", padX, footY);

    // Optional scannable QR Matrix
    try {
      const qrSize = 36;
      const matrix = encodeQr(referralUrl);
      const qrX = splitX - padX - qrSize;
      const qrY = footY - qrSize / 2;
      drawQrMatrixToCanvas(ctx, matrix, qrX, qrY, qrSize, "#FFFFFF", "#0D1117");
      ctx.textAlign = "right";
      ctx.fillText(`Ref: ${referralCode}`, qrX - 12, footY);
    } catch {
      ctx.textAlign = "right";
      ctx.fillText(`Ref: ${referralCode}`, splitX - padX, footY);
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
        className="relative z-10 w-full sm:max-w-[880px] lg:max-w-[920px] flex flex-col items-center gap-3 sm:gap-4 animate-in zoom-in-95 fade-in-0 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Screen Reader & Test Metadata */}
        <span className="sr-only">godcandle PnL Share Card</span>
        <span className="sr-only">Editorial 16:10 Apple-inspired outcome card</span>
        <span className="sr-only">1600 × 1000 px</span>

        {/* Split Card with delicate rainbow gradient border */}
        <div className="relative w-full min-h-[460px] sm:min-h-0 aspect-[16/10] sm:aspect-auto sm:h-[480px] md:h-[500px] rounded-[28px] p-[1.5px] bg-gradient-to-tr from-[#CDC3F0] via-[#FFDAC8] to-[#A0D4CA] shadow-[0_24px_80px_rgba(0,0,0,0.55)] flex overflow-hidden">
          <div className="w-full h-full bg-[#0D1117] rounded-[26.5px] flex flex-col sm:flex-row overflow-hidden relative">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-30 size-8 flex items-center justify-center rounded-full bg-[#161B22]/90 hover:bg-[#21262D] text-[#E6EDF3] shadow-md border border-[#30363D] hover:border-[#58A6FF] transition-all cursor-pointer"
              aria-label="Close modal"
            >
              <X className="size-4" />
            </button>

            {/* LEFT HALF (50%): Deep Solid Dark Surface (#0D1117 / #161B22) */}
            <div className="relative flex-1 sm:w-1/2 h-full bg-[#0D1117] p-5 sm:p-7 flex flex-col justify-between overflow-y-auto no-scrollbar z-10 text-[#E6EDF3]">
              {/* Top Row: godcandle logo + HyperEVM Live */}
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 font-bold tracking-tight text-white font-mono text-sm">
                      <span className="inline-block w-1.5 h-3.5 bg-[#00D964] rounded-xs" />
                      <span className="font-bold text-[18px] tracking-tight font-sans text-white">godcandle</span>
                    </div>
                    <span className="rounded-full border border-white/10 bg-gradient-to-r from-[#CDC3F0]/20 via-[#FFDAC8]/20 to-[#A0D4CA]/20 px-2.5 py-0.5 text-[10px] font-mono text-white/90">
                      HyperEVM Live
                    </span>
                  </div>
                  <span className="hidden md:inline-block text-[9px] uppercase tracking-[1.5px] font-mono text-[#8B949E]">
                    TRADE SMARTER TOGETHER · ZERO FEES
                  </span>
                </div>

                {/* Pair Name + Side Badge + Leverage */}
                <div className="flex items-center gap-2.5 mt-3 sm:mt-4">
                  <MarketLogo symbol={market.symbol} size={28} />
                  <span
                    id="pnl-modal-title"
                    className="font-bold text-2xl sm:text-[28px] tracking-tight text-white font-sans"
                  >
                    {symbolFormatted}
                  </span>
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider font-mono",
                      side === "long" ? "bg-[#00D964] text-black" : "bg-[#FF3B30] text-white"
                    )}
                  >
                    {sideLabel}
                  </span>
                  <span className="text-sm font-semibold font-mono text-[#8B949E]">
                    {rawLeverage}×
                  </span>
                </div>
              </div>

              {/* Middle Section: Massive Bold ROI % and Dollar Amount */}
              <div className="my-auto py-2 sm:py-3">
                <p className="text-[10px] sm:text-[11px] uppercase tracking-wider font-mono font-semibold text-[#8B949E]">
                  {pnlHeadingLabel}
                </p>
                <div
                  className={cn(
                    "font-sans text-[48px] sm:text-[62px] md:text-[68px] font-extrabold tracking-[-2px] leading-none my-1",
                    isProfit ? "text-[#00D964]" : "text-[#FF3B30]"
                  )}
                >
                  {pnlPctFormatted}
                </div>
                {!hideDollar && (
                  <p className="text-sm sm:text-base font-semibold font-mono text-[#8B949E] mt-1">
                    {dollarFormatted}
                  </p>
                )}
              </div>

              {/* Bottom Section: Clean 3-Column Stats Row & Domain */}
              <div className="space-y-3 pt-3 border-t border-[#21262D]">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-[9px] sm:text-[10px] font-mono uppercase text-[#8B949E] tracking-wider truncate">
                      {statCols[0]?.label}
                    </p>
                    <p className="text-xs sm:text-sm font-bold font-mono text-white mt-0.5 truncate">
                      {statCols[0]?.value}
                    </p>
                  </div>
                  <div className="border-l border-[#21262D] pl-2.5">
                    <p className="text-[9px] sm:text-[10px] font-mono uppercase text-[#8B949E] tracking-wider truncate">
                      {statCols[1]?.label}
                    </p>
                    <p className="text-xs sm:text-sm font-bold font-mono text-white mt-0.5 truncate">
                      {statCols[1]?.value}
                    </p>
                  </div>
                  <div className="border-l border-[#21262D] pl-2.5">
                    <p className="text-[9px] sm:text-[10px] font-mono uppercase text-[#8B949E] tracking-wider truncate">
                      {statCols[2]?.label}
                    </p>
                    <p className="text-xs sm:text-sm font-bold font-mono text-white mt-0.5 truncate">
                      {statCols[2]?.value}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#21262D]/60 text-[10px] text-[#8B949E] font-mono">
                  <span>godcandle.trade</span>
                  <span>Ref: {referralCode}</span>
                </div>
              </div>
            </div>

            {/* RIGHT HALF (50%): Dedicated Claude Monet Art Panel */}
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

              {/* Delicate Iridescent Pastel Rainbow Sheen Overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-[#CDC3F0]/25 via-[#FFDAC8]/20 to-[#A0D4CA]/25 pointer-events-none" />

              {/* Subtle Edge Vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/20 pointer-events-none" />

              {/* Content Overlay */}
              <div className="relative z-10 h-full w-full p-6 sm:p-7 flex flex-col justify-between">
                {/* Top Row: Network Badge */}
                <div className="flex justify-start items-center gap-2 pr-12">
                  <div className="rounded-full bg-[#0D1117]/80 backdrop-blur-md border border-white/20 px-2.5 py-1 flex items-center gap-1.5 text-[10px] font-mono text-white shadow-xs">
                    <span className="size-1.5 rounded-full bg-[#00D964] animate-pulse" />
                    <span>Mainnet Live</span>
                  </div>
                </div>

                {/* Bottom Floating Plaque (Quantin dark glass aesthetic) */}
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

        {/* Hidden Canvas used for generating 1600 × 1000 px full-resolution PNG */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Action Buttons Row directly under the PnL card */}
        <div className="flex items-center justify-center gap-2.5 sm:gap-3 flex-wrap">
          <button
            type="button"
            onClick={handleCopyImage}
            disabled={isExporting}
            className="h-10 px-4 rounded-xl border border-[#30363D] bg-[#161B22] hover:bg-[#21262D] text-white text-xs font-mono font-medium transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
          >
            {copied === "image" ? <Check className="size-4 text-[#00D964]" /> : <Copy className="size-4 text-[#8B949E]" />}
            <span>{copied === "image" ? "Image Copied!" : "Copy Image"}</span>
          </button>

          <button
            type="button"
            onClick={shareToX}
            className="h-10 px-4 rounded-xl border border-white/20 bg-white hover:bg-white/90 text-black text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md"
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
            className="h-10 px-4 rounded-xl bg-[#00D964] hover:bg-[#00BF57] text-[#080B0F] text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(0,217,100,0.25)] disabled:opacity-50"
          >
            <Download className="size-4 stroke-[2.5]" />
            <span>Download PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
}
