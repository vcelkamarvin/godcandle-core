import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  X,
  Download,
  Copy,
  Check,
  Share2,
  Sparkles,
  Target,
  Zap,
  Users,
  Percent,
  ArrowRight,
} from "lucide-react";
import { fmtDuration, fmtSigned, fmtUsd, type ClosedTrade, type Position } from "@/lib/trade";
import { getMarket, MARKETS, type MarketSymbol } from "@/config/markets";
import { MarketLogo } from "./MarketLogo";
import { encodeQr, drawQrMatrixToCanvas, generateQrSvgPath } from "@/lib/qr";
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

const CURATED_ARTS: CuratedArt[] = [
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
  initialMode,
  initialHideDollar,
}: ShareModalProps) {
  const [mode, setMode] = useState<CardMode>(initialMode ?? "pnl");
  const [theme, setTheme] = useState<CardTheme>("editorial");
  const [selectedArtId, setSelectedArtId] = useState<string>("etretat");
  const [hideDollar, setHideDollar] = useState<boolean>(initialHideDollar ?? false);
  const [showMetrics, setShowMetrics] = useState<boolean>(true);
  const [copied, setCopied] = useState<"image" | "link" | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Trade data extraction & normalization
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

  // Mode custom state
  const defaultGoalPrice = useMemo(() => {
    return Math.round(rawEntry * (side === "long" ? 1.15 : 0.85));
  }, [rawEntry, side]);

  const [customGoal, setCustomGoal] = useState<number>(defaultGoalPrice);
  const [customBoost, setCustomBoost] = useState<number>(5.0);
  const [syndicateDesk, setSyndicateDesk] = useState<string>("Alpha Syndicate");

  // Sync mode and hideDollar when modal opens or initial props change
  useEffect(() => {
    if (trade) {
      if (initialMode) {
        setMode(initialMode);
      }
      if (initialHideDollar !== undefined) {
        setHideDollar(initialHideDollar);
      }
      setCustomGoal(Math.round(rawEntry * (side === "long" ? 1.15 : 0.85)));
      setCustomBoost(Math.min(25, Math.max(2, Math.round(rawLeverage / 20))));
    }
  }, [trade, initialMode, initialHideDollar, rawEntry, side, rawLeverage]);

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

  // Calculations per Mode
  const { displayRoiPct, displayDollar, statCols, modeBadgeText, pnlHeadingLabel } = useMemo(() => {
    if (mode === "goal") {
      const effectiveGoal = customGoal > 0 ? customGoal : defaultGoalPrice;
      const priceDeltaPct = rawEntry > 0 ? ((effectiveGoal - rawEntry) / rawEntry) * (side === "long" ? 1 : -1) : 0;
      const goalRoi = priceDeltaPct * rawLeverage * 100;
      const goalPnl = rawStake * (goalRoi / 100);

      return {
        displayRoiPct: goalRoi,
        displayDollar: goalPnl,
        modeBadgeText: "🎯 GOAL HIT",
        pnlHeadingLabel: "TARGET GOAL ROI",
        statCols: [
          { label: "ENTRY PRICE", value: `$${fmtUsd(rawEntry, market.decimals)}` },
          { label: "CURRENT EXIT", value: `$${fmtUsd(rawExit, market.decimals)}` },
          { label: "TARGET GOAL", value: `$${fmtUsd(effectiveGoal, market.decimals)}` },
        ],
      };
    }

    if (mode === "boost") {
      const boostMult = customBoost > 0 ? customBoost : 2.0;
      const boostedRoi = baseRoiPct >= 0 ? baseRoiPct * boostMult : baseRoiPct;
      const boostedPnl = rawPnl >= 0 ? rawPnl * boostMult : rawPnl;
      const effectiveLev = Math.round(rawLeverage * boostMult);

      return {
        displayRoiPct: boostedRoi,
        displayDollar: boostedPnl,
        modeBadgeText: `⚡ BOOST ${boostMult}×`,
        pnlHeadingLabel: "CONVEX BOOST ROI",
        statCols: [
          { label: "BASE ENTRY", value: `$${fmtUsd(rawEntry, market.decimals)}` },
          { label: "EXIT PRICE", value: `$${fmtUsd(rawExit, market.decimals)}` },
          { label: "BOOSTED LEV", value: `${effectiveLev}×` },
        ],
      };
    }

    if (mode === "teamwork") {
      const effectiveDesk = syndicateDesk.trim() || "Alpha Syndicate";
      const teamRoi = baseRoiPct * 1.2;
      const teamPoolPnl = rawPnl * 4;

      return {
        displayRoiPct: teamRoi,
        displayDollar: teamPoolPnl,
        modeBadgeText: `👥 ${effectiveDesk}`,
        pnlHeadingLabel: "SYNDICATE DESK POOL ROI",
        statCols: [
          { label: "DESK ENTRY", value: `$${fmtUsd(rawEntry, market.decimals)}` },
          { label: "DESK EXIT", value: `$${fmtUsd(rawExit, market.decimals)}` },
          { label: "SYNDICATE DESK", value: effectiveDesk },
        ],
      };
    }

    // Default PnL
    return {
      displayRoiPct: baseRoiPct,
      displayDollar: rawPnl,
      modeBadgeText: null,
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
    customGoal,
    side,
    rawLeverage,
    rawStake,
    customBoost,
    baseRoiPct,
    rawPnl,
    syndicateDesk,
    isClosed,
    durationMs,
    market.decimals,
  ]);

  const isProfit = displayRoiPct >= 0;
  const isLoss = !isProfit;
  const roiSign = isLoss ? "−" : "+";
  const pnlPctFormatted = `${roiSign}${Math.abs(displayRoiPct).toFixed(2)}%`;
  const dollarFormatted = `${roiSign}$${fmtUsd(Math.abs(displayDollar), 2)} USDC`;

  const leverageStr = `${rawLeverage}×`;
  const symbolFormatted = `${market.symbol}-USD`;

  const instrumentLabel =
    mode === "goal"
      ? "GOAL HIT TARGET"
      : mode === "boost"
      ? "CONVEX BOOST PROTOCOL"
      : mode === "teamwork"
      ? "SYNDICATE COLLABORATIVE DESK"
      : "1000x SYNTHETIC PERPETUAL";

  // Selected artwork metadata
  const selectedArt = useMemo(() => {
    return CURATED_ARTS.find((a) => a.id === selectedArtId) ?? DEFAULT_ART;
  }, [selectedArtId]);

  // Referral code logic (wallet or local session key)
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

  // QR matrix generation
  const qrMatrix = useMemo(() => {
    try {
      return encodeQr(referralUrl);
    } catch {
      return encodeQr("https://godcandle.trade");
    }
  }, [referralUrl]);

  const qrSvg = useMemo(() => {
    return generateQrSvgPath(qrMatrix, 2);
  }, [qrMatrix]);

  // Color tokens
  const colors = useMemo(() => {
    if (theme === "obsidian") {
      return {
        bg: "#0A0A0C",
        border: "#26262B",
        textMain: "#FFFFFF",
        textSecondary: "#9CA3AF",
        divider: "#1F1F24",
        pnlPositive: "#00D964",
        pnlNegative: "#FF3B30",
        qrBg: "#FFFFFF",
        qrFg: "#0A0A0A",
        plaqueBg: "rgba(10, 10, 12, 0.85)",
        plaqueBorder: "rgba(255, 255, 255, 0.15)",
        plaqueText: "#FFFFFF",
      };
    }
    if (theme === "aurora") {
      return {
        bg: "#0B0E14",
        border: "#2A2D3A",
        textMain: "#FFFFFF",
        textSecondary: "#A0AEC0",
        divider: "#1E222D",
        pnlPositive: "#00D964",
        pnlNegative: "#FF3B30",
        qrBg: "#FFFFFF",
        qrFg: "#0A0A0A",
        plaqueBg: "rgba(11, 14, 20, 0.85)",
        plaqueBorder: "rgba(255, 255, 255, 0.18)",
        plaqueText: "#FFFFFF",
      };
    }
    // Apple Editorial White
    return {
      bg: "#FFFFFF",
      border: "#E5E5E5",
      textMain: "#0A0A0A",
      textSecondary: "#737373",
      divider: "#F0F0EE",
      pnlPositive: "#06964A",
      pnlNegative: "#FF3B30",
      qrBg: "#FFFFFF",
      qrFg: "#0A0A0A",
      plaqueBg: "rgba(255, 255, 255, 0.88)",
      plaqueBorder: "rgba(230, 230, 230, 0.9)",
      plaqueText: "#0A0A0A",
    };
  }, [theme]);

  // Asset Coin Badge Color for Canvas
  const assetColor = useMemo(() => {
    switch (market.symbol) {
      case "BTC":
        return "#F7931A";
      case "ETH":
        return "#627EEA";
      case "SOL":
        return "#9945FF";
      case "HYPE":
        return "#00D964";
      case "DOGE":
        return "#C2A633";
      case "SPX":
        return "#1E3A8A";
      default:
        return "#00D964";
    }
  }, [market.symbol]);

  // Draw 1600 × 1000 px High-Resolution Canvas
  const drawCardToCanvas = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const width = 1600;
    const height = 1000;
    canvas.width = width;
    canvas.height = height;

    // Load Monet artwork
    const photoImg = await loadImage(selectedArt.url);

    ctx.save();

    // Background
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, width, height);

    // Subtle Aurora background glow if in aurora theme
    if (theme === "aurora") {
      const auroraGrad = ctx.createRadialGradient(400, 200, 50, 400, 200, 750);
      auroraGrad.addColorStop(0, isProfit ? "rgba(0, 217, 100, 0.08)" : "rgba(255, 59, 48, 0.08)");
      auroraGrad.addColorStop(0.5, "rgba(205, 195, 240, 0.05)");
      auroraGrad.addColorStop(1, "transparent");
      ctx.fillStyle = auroraGrad;
      ctx.fillRect(0, 0, width, height);
    }

    // Outer card boundary (24px radius) with delicate iridescent rainbow gradient border
    const rainbowGrad = ctx.createLinearGradient(0, 0, width, height);
    rainbowGrad.addColorStop(0, "#CDC3F0");
    rainbowGrad.addColorStop(0.5, "#FFDAC8");
    rainbowGrad.addColorStop(1, "#A0D4CA");

    drawRoundedRect(ctx, 1.5, 1.5, width - 3, height - 3, 24);
    ctx.strokeStyle = rainbowGrad;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Clip inner content
    drawRoundedRect(ctx, 3, 3, width - 6, height - 6, 22);
    ctx.clip();

    const padding = 54;
    const contentW = width - padding * 2; // 1492

    // ==========================================
    // 1. HEADER (Height: 76px, Y: 54 -> 130)
    // ==========================================
    const headerTop = padding;
    const headerH = 76;
    const headerYCenter = headerTop + headerH / 2;

    // Left: godcandle logo + bright green bar indicator
    ctx.fillStyle = "#00D964";
    drawRoundedRect(ctx, padding, headerYCenter - 15, 8, 30, 3);
    ctx.fill();

    ctx.fillStyle = colors.textMain;
    ctx.font = "700 32px -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("godcandle", padding + 18, headerYCenter);

    // Sub-tag: PRECOMPILE v1 · HyperEVM with delicate rainbow badge
    const godcandleW = ctx.measureText("godcandle").width;
    const subTagX = padding + 18 + godcandleW + 16;
    const subTagText = "PRECOMPILE v1 · HyperEVM";
    ctx.font = "600 13px -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Text', sans-serif";
    const subTagW = ctx.measureText(subTagText).width + 20;
    const subTagH = 26;

    drawRoundedRect(ctx, subTagX, headerYCenter - subTagH / 2, subTagW, subTagH, 13);
    const tagGrad = ctx.createLinearGradient(
      subTagX,
      headerYCenter - subTagH / 2,
      subTagX + subTagW,
      headerYCenter + subTagH / 2
    );
    tagGrad.addColorStop(0, "rgba(205, 195, 240, 0.4)");
    tagGrad.addColorStop(0.5, "rgba(255, 218, 200, 0.35)");
    tagGrad.addColorStop(1, "rgba(160, 212, 202, 0.4)");
    ctx.fillStyle = tagGrad;
    ctx.fill();
    ctx.strokeStyle = colors.divider;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = colors.textMain;
    ctx.textAlign = "center";
    ctx.fillText(subTagText, subTagX + subTagW / 2, headerYCenter);

    // Right: Slogan
    ctx.textAlign = "right";
    ctx.fillStyle = colors.textSecondary;
    ctx.font = "600 13px -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Text', sans-serif";
    ctx.letterSpacing = "2px";
    ctx.fillText("TRADE SMARTER TOGETHER · ZERO FEES", width - padding, headerYCenter);
    ctx.letterSpacing = "0px";

    // Header divider with subtle rainbow gradient
    const divGrad = ctx.createLinearGradient(padding, headerTop + headerH, width - padding, headerTop + headerH);
    divGrad.addColorStop(0, "#CDC3F0");
    divGrad.addColorStop(0.5, "#FFDAC8");
    divGrad.addColorStop(1, "#A0D4CA");
    ctx.strokeStyle = divGrad;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padding, headerTop + headerH);
    ctx.lineTo(width - padding, headerTop + headerH);
    ctx.stroke();

    // ==========================================
    // 2. MAIN CONTENT (Height: ~635px, Y: 132 -> 767)
    // ==========================================
    const mainTop = headerTop + headerH + 20;
    const mainH = 615;
    const leftColW = Math.round(contentW * 0.54); // 805
    const rightColW = contentW - leftColW - 28; // 659
    const rightColX = padding + leftColW + 28;

    // --- LEFT COLUMN (54%) ---
    const textX = padding;

    // A. Instrument type
    const instrumentLabel =
      mode === "goal"
        ? "GOAL HIT TARGET"
        : mode === "boost"
        ? "CONVEX BOOST PROTOCOL"
        : mode === "teamwork"
        ? "SYNDICATE COLLABORATIVE DESK"
        : "1000x SYNTHETIC PERPETUAL";

    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = colors.textSecondary;
    ctx.font = "600 16px -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Text', sans-serif";
    ctx.letterSpacing = "1.5px";
    ctx.fillText(instrumentLabel, textX, mainTop + 14);
    ctx.letterSpacing = "0px";

    // B. Asset coin badge + Pair name: "BTC-USD"
    const iconSize = 48;
    const iconY = mainTop + 46;

    // Asset circle badge
    ctx.save();
    ctx.beginPath();
    ctx.arc(textX + iconSize / 2, iconY + iconSize / 2, iconSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = assetColor;
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "700 22px -apple-system, BlinkMacSystemFont, 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(market.symbol.slice(0, 3), textX + iconSize / 2, iconY + iconSize / 2 + 1);
    ctx.restore();

    // Pair Symbol text
    ctx.fillStyle = colors.textMain;
    let symbolFontSize = 54;
    ctx.font = `700 ${symbolFontSize}px -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display', sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(symbolFormatted, textX + iconSize + 16, iconY + iconSize / 2);

    // C. Position Details: LONG / SHORT pill · Leverage · Mode Badge
    const posDetailsY = iconY + iconSize + 22;

    // Side Badge
    const sideW = 76;
    const sideH = 32;
    drawRoundedRect(ctx, textX, posDetailsY, sideW, sideH, 6);
    ctx.fillStyle = side === "long" ? (theme === "editorial" ? "#06964A" : "#00D964") : "#FF3B30";
    ctx.fill();

    ctx.fillStyle = side === "long" && theme !== "editorial" ? "#000000" : "#FFFFFF";
    ctx.font = "700 17px -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Text', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(sideLabel, textX + sideW / 2, posDetailsY + sideH / 2);

    // Leverage
    ctx.textAlign = "left";
    ctx.fillStyle = colors.textSecondary;
    ctx.font = "600 20px -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Text', sans-serif";
    const levText = `  ·   ${leverageStr}`;
    ctx.fillText(levText, textX + sideW + 6, posDetailsY + sideH / 2);
    const levW = ctx.measureText(levText).width;

    // Optional Mode Badge Pill (e.g. 🎯 GOAL HIT, ⚡ BOOST 5x, 👥 SYNDICATE)
    if (modeBadgeText) {
      const modeBadgeX = textX + sideW + 6 + levW + 12;
      ctx.font = "600 15px -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Text', sans-serif";
      const mTextW = ctx.measureText(modeBadgeText).width;
      const mBadgeW = mTextW + 20;

      drawRoundedRect(ctx, modeBadgeX, posDetailsY + 1, mBadgeW, sideH - 2, 6);
      ctx.fillStyle = theme === "editorial" ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.08)";
      ctx.fill();
      ctx.strokeStyle = theme === "editorial" ? "rgba(0, 0, 0, 0.12)" : "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = colors.textMain;
      ctx.textAlign = "center";
      ctx.fillText(modeBadgeText, modeBadgeX + mBadgeW / 2, posDetailsY + sideH / 2);
    }

    // D. PnL Heading Label
    const pnlLabelY = posDetailsY + 54;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = colors.textSecondary;
    ctx.font = "600 17px -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Text', sans-serif";
    ctx.letterSpacing = "1.5px";
    ctx.fillText(pnlHeadingLabel, textX, pnlLabelY);
    ctx.letterSpacing = "0px";

    // E. Giant High-Contrast Bold ROI % Figure
    const pnlFigureY = pnlLabelY + 28;
    ctx.fillStyle = isLoss ? colors.pnlNegative : colors.pnlPositive;
    let pnlFontSize = 104;
    ctx.font = `800 ${pnlFontSize}px -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display', sans-serif`;
    while (ctx.measureText(pnlPctFormatted).width > leftColW - 40 && pnlFontSize > 44) {
      pnlFontSize -= 4;
      ctx.font = `800 ${pnlFontSize}px -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display', sans-serif`;
    }
    ctx.letterSpacing = pnlFontSize > 90 ? "-3px" : "-1px";
    ctx.fillText(pnlPctFormatted, textX, pnlFigureY);
    ctx.letterSpacing = "0px";

    // Optional Dollar Amount (stacked beneath percentage for clean alignment & no horizontal overflow)
    let dollarY = pnlFigureY + pnlFontSize + 4;
    if (!hideDollar) {
      ctx.fillStyle = colors.textSecondary;
      ctx.font = "600 24px -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Text', sans-serif";
      ctx.fillText(dollarFormatted, textX, dollarY);
    }

    // F. Trading Data Row Divider
    const dataDividerY = !hideDollar ? dollarY + 44 : pnlFigureY + pnlFontSize + 28;
    ctx.strokeStyle = colors.divider;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(textX, dataDividerY);
    ctx.lineTo(rightColX - 28, dataDividerY);
    ctx.stroke();

    // G. Three Data Columns: ENTRY | EXIT/MARK | TARGET/DURATION
    if (showMetrics) {
      const rowY = dataDividerY + 24;
      const colSpacing = (rightColX - 28 - textX) / 3;

      statCols.forEach((col, idx) => {
        const colX = textX + idx * colSpacing;

        // Label: 15px uppercase
        ctx.fillStyle = colors.textSecondary;
        ctx.font = "600 15px -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Text', sans-serif";
        ctx.letterSpacing = "1px";
        ctx.fillText(col.label, colX, rowY);
        ctx.letterSpacing = "0px";

        // Value: 28px bold
        ctx.fillStyle = colors.textMain;
        ctx.font = "600 28px -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display', sans-serif";
        ctx.fillText(col.value, colX, rowY + 30);

        // Thin vertical divider between columns
        if (idx < 2) {
          const sepX = colX + colSpacing - 18;
          ctx.strokeStyle = colors.divider;
          ctx.beginPath();
          ctx.moveTo(sepX, rowY + 4);
          ctx.lineTo(sepX, rowY + 58);
          ctx.stroke();
        }
      });
    }

    // --- RIGHT COLUMN (46%): Claude Monet Impressionist Art Panel ---
    ctx.save();
    // Clip right column to 16px radius
    drawRoundedRect(ctx, rightColX, mainTop, rightColW, mainH, 16);
    ctx.clip();

    if (photoImg) {
      // Object-fit: cover, centered
      const imgAspect = photoImg.width / photoImg.height;
      const targetAspect = rightColW / mainH;
      let drawW = rightColW;
      let drawH = mainH;
      let drawX = rightColX;
      let drawY = mainTop;

      if (imgAspect > targetAspect) {
        drawW = mainH * imgAspect;
        drawX = rightColX - (drawW - rightColW) / 2;
      } else {
        drawH = rightColW / imgAspect;
        drawY = mainTop - (drawH - mainH) / 2;
      }

      ctx.drawImage(photoImg, drawX, drawY, drawW, drawH);
    } else {
      // Impressionist fallback palette gradient when image is not loaded
      const fallbackGrad = ctx.createLinearGradient(rightColX, mainTop, rightColX + rightColW, mainTop + mainH);
      fallbackGrad.addColorStop(0, "#7AA5BD"); // Étretat sea blue
      fallbackGrad.addColorStop(0.3, "#A8C3D2");
      fallbackGrad.addColorStop(0.65, "#E2CBB4"); // Cliffs ochre
      fallbackGrad.addColorStop(1, "#D6A374");
      ctx.fillStyle = fallbackGrad;
      ctx.fillRect(rightColX, mainTop, rightColW, mainH);
    }

    // Delicate iridescent pastel rainbow gradient sheen overlay
    const artRainbow = ctx.createLinearGradient(
      rightColX,
      mainTop,
      rightColX + rightColW,
      mainTop + mainH
    );
    artRainbow.addColorStop(0, "rgba(205, 195, 240, 0.28)");
    artRainbow.addColorStop(0.5, "rgba(255, 218, 200, 0.22)");
    artRainbow.addColorStop(1, "rgba(160, 212, 202, 0.26)");
    ctx.fillStyle = artRainbow;
    ctx.fillRect(rightColX, mainTop, rightColW, mainH);

    // Impressionist depth vignettes
    const artVignette = ctx.createLinearGradient(rightColX, mainTop, rightColX, mainTop + mainH);
    artVignette.addColorStop(0, "rgba(0, 0, 0, 0.15)");
    artVignette.addColorStop(0.5, "transparent");
    artVignette.addColorStop(1, "rgba(0, 0, 0, 0.45)");
    ctx.fillStyle = artVignette;
    ctx.fillRect(rightColX, mainTop, rightColW, mainH);

    // Top Right Network Badge on Monet panel
    const topBadgeText = "HyperEVM Live";
    ctx.font = "600 13px -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Text', sans-serif";
    const topBadgeW = ctx.measureText(topBadgeText).width + 30;
    const topBadgeH = 28;
    const topBadgeX = rightColX + rightColW - topBadgeW - 16;
    const topBadgeY = mainTop + 16;

    drawRoundedRect(ctx, topBadgeX, topBadgeY, topBadgeW, topBadgeH, 14);
    ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.stroke();

    // Green pulse dot
    ctx.beginPath();
    ctx.arc(topBadgeX + 13, topBadgeY + topBadgeH / 2, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = "#00D964";
    ctx.fill();

    ctx.fillStyle = "#0A0A0A";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(topBadgeText, topBadgeX + 22, topBadgeY + topBadgeH / 2 + 1);

    // Floating Plaque on Monet Panel
    const plaquePadding = 20;
    const plaqueW = rightColW - plaquePadding * 2;
    const plaqueH = 104;
    const plaqueX = rightColX + plaquePadding;
    const plaqueY = mainTop + mainH - plaqueH - plaquePadding;

    // Glass plaque background
    drawRoundedRect(ctx, plaqueX, plaqueY, plaqueW, plaqueH, 14);
    ctx.fillStyle = colors.plaqueBg;
    ctx.fill();
    ctx.strokeStyle = colors.plaqueBorder;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Plaque Title
    ctx.fillStyle = colors.plaqueText;
    ctx.font = "700 22px -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("1000x Synthetic Perps.", plaqueX + 20, plaqueY + 22);

    // Plaque Subtitle
    ctx.fillStyle = colors.textSecondary;
    ctx.font = "500 15px -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Text', sans-serif";
    ctx.fillText("Mark-clamped BBO · Zero Entry Fees", plaqueX + 20, plaqueY + 54);

    // Rainbow Pill Badge: Claude Monet, 1885
    const pillText = `${selectedArt.artist}, ${selectedArt.year}`;
    ctx.font = "600 13px -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Text', sans-serif";
    const pillW = ctx.measureText(pillText).width + 22;
    const pillH = 26;
    const pillX = plaqueX + plaqueW - pillW - 18;
    const pillY = plaqueY + 18;

    drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 13);
    const pillGrad = ctx.createLinearGradient(pillX, pillY, pillX + pillW, pillY + pillH);
    pillGrad.addColorStop(0, "#CDC3F0");
    pillGrad.addColorStop(0.5, "#FFDAC8");
    pillGrad.addColorStop(1, "#A0D4CA");
    ctx.fillStyle = pillGrad;
    ctx.fill();

    ctx.fillStyle = "#0A0A0A";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(pillText, pillX + pillW / 2, pillY + pillH / 2);

    // Plaque Art Title right-aligned bottom
    ctx.fillStyle = colors.textSecondary;
    ctx.font = "italic 500 13px -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Text', sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(selectedArt.title, plaqueX + plaqueW - 20, plaqueY + 66);

    ctx.restore();

    // ==========================================
    // 3. BOTTOM REFERRAL STRIP (Y: 767 -> 946)
    // ==========================================
    const footerTop = mainTop + mainH + 20;
    const footerH = height - padding - footerTop;
    const footerYCenter = footerTop + footerH / 2;

    // Divider line above referral strip
    ctx.strokeStyle = colors.divider;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, footerTop);
    ctx.lineTo(width - padding, footerTop);
    ctx.stroke();

    // Group 1: Left - godcandle brand indicator & Referral Code
    ctx.fillStyle = "#00D964";
    drawRoundedRect(ctx, padding, footerYCenter - 14, 6, 28, 2);
    ctx.fill();

    const footerLeftX = padding + 16;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = colors.textSecondary;
    ctx.font = "600 13px -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Text', sans-serif";
    ctx.letterSpacing = "1.5px";
    ctx.fillText("INVITE FRIENDS", footerLeftX, footerYCenter - 18);
    ctx.letterSpacing = "0px";

    ctx.fillStyle = colors.textMain;
    ctx.font = "700 24px -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display', sans-serif";
    ctx.fillText(referralCode, footerLeftX, footerYCenter + 3);

    // Group 2: Center-Right - Dynamic Scannable QR Code
    const qrSize = 82;
    const qrX = width - padding - 310;
    const qrY = footerYCenter - qrSize / 2;

    // Draw quiet rounded background box with subtle border matching preview
    drawRoundedRect(ctx, qrX - 4, qrY - 4, qrSize + 8, qrSize + 8, 8);
    ctx.fillStyle = colors.qrBg;
    ctx.fill();
    ctx.strokeStyle = "#E5E5E5";
    ctx.lineWidth = 1;
    ctx.stroke();

    drawQrMatrixToCanvas(ctx, qrMatrix, qrX, qrY, qrSize, colors.qrFg, colors.qrBg);

    // Group 3: Right - Referral Action
    const refActionX = qrX + qrSize + 28;
    ctx.strokeStyle = colors.divider;
    ctx.beginPath();
    ctx.moveTo(refActionX, footerYCenter - 22);
    ctx.lineTo(refActionX, footerYCenter + 22);
    ctx.stroke();

    const actionTextX = refActionX + 24;
    ctx.fillStyle = colors.textSecondary;
    ctx.font = "600 13px -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Text', sans-serif";
    ctx.letterSpacing = "1.5px";
    ctx.fillText("REFERRAL CODE", actionTextX, footerYCenter - 18);
    ctx.letterSpacing = "0px";

    ctx.fillStyle = colors.textMain;
    ctx.font = "700 22px -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display', sans-serif";
    ctx.fillText(`${referralCode}  →`, actionTextX, footerYCenter + 3);

    ctx.restore();
  }, [
    selectedArt,
    colors,
    theme,
    isProfit,
    isLoss,
    mode,
    modeBadgeText,
    pnlHeadingLabel,
    market.symbol,
    market.decimals,
    assetColor,
    symbolFormatted,
    side,
    sideLabel,
    leverageStr,
    pnlPctFormatted,
    dollarFormatted,
    hideDollar,
    showMetrics,
    statCols,
    instrumentLabel,
    referralCode,
    qrMatrix,
  ]);

  useEffect(() => {
    if (trade) {
      drawCardToCanvas();
    }
  }, [trade, drawCardToCanvas]);

  const handleDownload = async () => {
    if (!trade) return;
    setIsExporting(true);
    try {
      await drawCardToCanvas();
      const canvas = canvasRef.current;
      if (!canvas) {
        setIsExporting(false);
        return;
      }
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `godcandle-${market.symbol}-PnL-${Date.now()}.png`;
      link.href = url;
      link.click();
      setCopied("image");
      toast.success("1600 × 1000 px PnL card downloaded successfully!");
      setTimeout(() => setCopied(null), 2500);
    } catch (err) {
      console.error("Failed to download canvas:", err);
      toast.error("Failed to export image. Copied text summary instead.");
      handleCopyText();
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyImage = async () => {
    if (!trade) return;
    setIsExporting(true);
    try {
      await drawCardToCanvas();
      const canvas = canvasRef.current;
      if (!canvas) {
        setIsExporting(false);
        return;
      }
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setIsExporting(false);
          handleCopyText();
          return;
        }
        try {
          await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
          setCopied("image");
          toast.success("PnL card image copied to clipboard!");
          setTimeout(() => setCopied(null), 2500);
        } catch {
          handleCopyText();
        } finally {
          setIsExporting(false);
        }
      });
    } catch {
      handleCopyText();
      setIsExporting(false);
    }
  };

  const handleCopyText = async () => {
    if (!trade) return;
    const text = `godcandle.trade | ${symbolFormatted} ${sideLabel} ${leverageStr}\n${pnlHeadingLabel}: ${pnlPctFormatted} (${dollarFormatted})\nEntry: $${fmtUsd(rawEntry, market.decimals)} | Exit: $${fmtUsd(rawExit, market.decimals)}\nTrade on HyperEVM: ${referralUrl}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied("link");
      toast.success("Trade summary copied to clipboard!");
      setTimeout(() => setCopied(null), 2500);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const shareToX = () => {
    if (!trade) return;
    const text = `Just hit ${pnlPctFormatted} ROI on ${symbolFormatted} ${leverageStr} on @godcandle_trade!\n\nZero entry fees, mark-clamped BBO on HyperEVM.\n${referralUrl}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (!trade) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pnl-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="relative w-full max-w-4xl rounded-2xl border border-white/10 bg-[#0E0E10] shadow-[0_32px_80px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/[0.08] bg-[#121214] shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-gradient-to-tr from-[#CDC3F0]/20 via-[#FFDAC8]/20 to-[#A0D4CA]/20 border border-white/15 flex items-center justify-center text-white">
              <Share2 className="size-4" />
            </div>
            <div>
              <h3
                id="pnl-modal-title"
                className="text-[15px] font-semibold text-white tracking-tight leading-none"
              >
                godcandle PnL Share Card
              </h3>
              <p className="text-[11px] text-white/50 mt-1">
                Editorial 16:10 Apple-inspired outcome card with verified trade data & Monet art
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="size-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Customization Toolbar */}
        <div className="px-6 py-2.5 border-b border-white/[0.08] bg-[#0A0A0C] flex flex-wrap items-center justify-between gap-3 text-[12px] shrink-0">
          {/* Card Highlight Mode */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider text-white/40 font-medium">
              Mode:
            </span>
            <div className="flex rounded-md bg-white/[0.04] p-0.5 border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setMode("pnl")}
                className={cn(
                  "px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer",
                  mode === "pnl"
                    ? "bg-white/20 text-white font-semibold shadow-xs"
                    : "text-white/50 hover:text-white"
                )}
              >
                <Percent className="size-3" /> PnL Return
              </button>
              <button
                type="button"
                onClick={() => setMode("goal")}
                className={cn(
                  "px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer",
                  mode === "goal"
                    ? "bg-white/20 text-white font-semibold shadow-xs"
                    : "text-white/50 hover:text-white"
                )}
              >
                <Target className="size-3" /> Goal Hit
              </button>
              <button
                type="button"
                onClick={() => setMode("boost")}
                className={cn(
                  "px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer",
                  mode === "boost"
                    ? "bg-white/20 text-white font-semibold shadow-xs"
                    : "text-white/50 hover:text-white"
                )}
              >
                <Zap className="size-3" /> Convex Boost
              </button>
              <button
                type="button"
                onClick={() => setMode("teamwork")}
                className={cn(
                  "px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer",
                  mode === "teamwork"
                    ? "bg-white/20 text-white font-semibold shadow-xs"
                    : "text-white/50 hover:text-white"
                )}
              >
                <Users className="size-3" /> Syndicate Desk
              </button>
            </div>
          </div>

          {/* Theme Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider text-white/40 font-medium">
              Style:
            </span>
            <div className="flex rounded-md bg-white/[0.04] p-0.5 border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setTheme("editorial")}
                className={cn(
                  "px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer",
                  theme === "editorial"
                    ? "bg-white text-black font-semibold shadow-xs"
                    : "text-white/50 hover:text-white"
                )}
              >
                Apple White
              </button>
              <button
                type="button"
                onClick={() => setTheme("obsidian")}
                className={cn(
                  "px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer",
                  theme === "obsidian"
                    ? "bg-white/20 text-white font-semibold shadow-xs"
                    : "text-white/50 hover:text-white"
                )}
              >
                Obsidian
              </button>
              <button
                type="button"
                onClick={() => setTheme("aurora")}
                className={cn(
                  "px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer",
                  theme === "aurora"
                    ? "bg-white/20 text-white font-semibold shadow-xs"
                    : "text-white/50 hover:text-white"
                )}
              >
                Aurora
              </button>
            </div>
          </div>

          {/* Curated Art Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider text-white/40 font-medium">
              Monet Art:
            </span>
            <div className="flex rounded-md bg-white/[0.04] p-0.5 border border-white/[0.08]">
              {CURATED_ARTS.map((art) => (
                <button
                  key={art.id}
                  type="button"
                  onClick={() => setSelectedArtId(art.id)}
                  className={cn(
                    "px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer",
                    selectedArtId === art.id
                      ? "bg-white/20 text-white font-semibold shadow-xs"
                      : "text-white/50 hover:text-white"
                  )}
                >
                  {art.title.replace("The Cliffs at Étretat", "Étretat (1885)").replace("Impression, Sunrise", "Sunrise (1872)")}
                </button>
              ))}
            </div>
          </div>

          {/* Metric & Dollar Toggles */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer text-white/60 hover:text-white select-none">
              <input
                type="checkbox"
                checked={hideDollar}
                onChange={(e) => setHideDollar(e.target.checked)}
                className="rounded border-white/20 bg-white/5 accent-white cursor-pointer"
              />
              <span className="text-[11px]">Hide $</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-white/60 hover:text-white select-none">
              <input
                type="checkbox"
                checked={showMetrics}
                onChange={(e) => setShowMetrics(e.target.checked)}
                className="rounded border-white/20 bg-white/5 accent-white cursor-pointer"
              />
              <span className="text-[11px]">Metrics</span>
            </label>
          </div>
        </div>

        {/* Goal Customization Sub-bar */}
        {mode === "goal" && (
          <div className="px-6 py-2 bg-[#0E0E10] border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-2 text-[11px] shrink-0 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold flex items-center gap-1">
                <Target className="size-3 text-[#00D964]" /> Target Goal Price:
              </span>
              <div className="relative flex items-center">
                <span className="absolute left-2.5 text-white/40 font-mono">$</span>
                <input
                  type="number"
                  value={customGoal || ""}
                  onChange={(e) => setCustomGoal(Number(e.target.value))}
                  className="h-6 w-28 pl-5 pr-2 rounded bg-white/[0.06] border border-white/10 text-white font-mono text-[11px] focus:outline-none focus:border-white"
                  placeholder="Target Price"
                />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-white/40 text-[10px] uppercase font-semibold mr-1">
                Presets:
              </span>
              {[
                { label: "+10%", mult: 1.1 },
                { label: "+25%", mult: 1.25 },
                { label: "+50%", mult: 1.5 },
                { label: "+100%", mult: 2.0 },
                { label: "+250%", mult: 3.5 },
              ].map(({ label, mult }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setCustomGoal(Math.round(rawEntry * (side === "long" ? mult : 1 / mult)))}
                  className="px-2 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-white/80 hover:text-white text-[11px] font-mono transition-colors cursor-pointer"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Boost Customization Sub-bar */}
        {mode === "boost" && (
          <div className="px-6 py-2 bg-[#0E0E10] border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-2 text-[11px] shrink-0 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold flex items-center gap-1">
                <Zap className="size-3 text-[#FFD60A]" /> Convex Boost Multiplier:
              </span>
              <div className="relative flex items-center">
                <input
                  type="number"
                  step="0.5"
                  value={customBoost || ""}
                  onChange={(e) => setCustomBoost(Number(e.target.value))}
                  className="h-6 w-16 px-2 rounded bg-white/[0.06] border border-white/10 text-white font-mono text-[11px] focus:outline-none focus:border-white"
                  placeholder="5.0"
                />
                <span className="ml-1 text-white font-bold">x</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-white/40 text-[10px] uppercase font-semibold mr-1">Boost:</span>
              {[2.0, 3.5, 5.0, 10.0, 25.0, 50.0, 100.0].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setCustomBoost(m)}
                  className={cn(
                    "px-2 py-0.5 rounded border text-[11px] font-mono transition-colors cursor-pointer",
                    customBoost === m
                      ? "bg-white/20 border-white/40 text-white font-bold"
                      : "bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.06] text-white/80 hover:text-white"
                  )}
                >
                  {m}x
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Teamwork Customization Sub-bar */}
        {mode === "teamwork" && (
          <div className="px-6 py-2 bg-[#0E0E10] border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-2 text-[11px] shrink-0 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold flex items-center gap-1">
                <Users className="size-3 text-[#CDC3F0]" /> Syndicate Desk:
              </span>
              <input
                type="text"
                value={syndicateDesk}
                onChange={(e) => setSyndicateDesk(e.target.value)}
                className="h-6 w-36 px-2 rounded bg-white/[0.06] border border-white/10 text-white font-sans text-[11px] focus:outline-none focus:border-white"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-white/40 text-[10px] uppercase font-semibold mr-1">Desks:</span>
              {["Alpha Syndicate", "Candle Cup Desk", "Precompile Quants"].map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setSyndicateDesk(name)}
                  className={cn(
                    "px-2 py-0.5 rounded border text-[11px] transition-colors cursor-pointer",
                    syndicateDesk === name
                      ? "bg-white/20 border-white/40 text-white font-bold"
                      : "bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.06] text-white/80 hover:text-white"
                  )}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Live Visual Card Preview (16:10 Aspect Ratio) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#070708] flex items-center justify-center">
          {/* Card Outer with Signature Delicate Iridescent Pastel Rainbow Border */}
          <div className="w-full max-w-[800px] p-[1.5px] rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-[#CDC3F0] via-[#FFDAC8] to-[#A0D4CA] shadow-[0_24px_64px_rgba(0,0,0,0.6)]">
            <div
              className={cn(
                "w-full aspect-[16/10] rounded-[calc(1rem-1.5px)] sm:rounded-[calc(1.5rem-1.5px)] transition-all duration-300 relative overflow-hidden flex flex-col p-4 sm:p-6 select-none",
                theme === "editorial" && "bg-white text-[#0A0A0A]",
                theme === "obsidian" && "bg-[#0A0A0C] text-white",
                theme === "aurora" && "bg-[#0B0E14] text-white"
              )}
            >
              {/* Header: ~60px proportional */}
              <div
                className="flex items-center justify-between pb-3 sm:pb-3.5 border-b shrink-0"
                style={{ borderColor: colors.divider }}
              >
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <div className="flex items-center gap-1.5 font-bold tracking-tight text-inherit">
                    <span className="inline-block w-1.5 sm:w-2 h-4 sm:h-5 bg-[#00D964] rounded-xs" />
                    <span className="font-bold text-[16px] sm:text-[20px] tracking-tight">godcandle</span>
                  </div>
                  <span className="rounded-full border border-border/60 bg-gradient-to-r from-[#CDC3F0]/40 via-[#FFDAC8]/40 to-[#A0D4CA]/40 px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold tracking-wider text-inherit flex items-center gap-1 font-mono">
                    <Sparkles className="size-2.5 text-[#00D964]" />
                    PRECOMPILE v1 · HyperEVM
                  </span>
                </div>

                <span
                  className="text-[9px] sm:text-[11px] uppercase tracking-[2px] font-semibold"
                  style={{ color: colors.textSecondary }}
                >
                  TRADE SMARTER TOGETHER · ZERO FEES
                </span>
              </div>

              {/* Main Content: Two Columns (54% / 46%) */}
              <div className="flex-1 flex min-h-0 pt-3 sm:pt-4">
                {/* Left Column (54%) */}
                <div className="w-[54%] flex flex-col justify-between pr-3 sm:pr-5">
                  <div>
                    <p
                      className="text-[9px] sm:text-[11px] uppercase tracking-[1.5px] font-medium"
                      style={{ color: colors.textSecondary }}
                    >
                      {instrumentLabel}
                    </p>

                    {/* Pair + Asset Icon */}
                    <div className="flex items-center gap-2 sm:gap-2.5 mt-0.5 sm:mt-1">
                      <MarketLogo symbol={market.symbol} size={28} />
                      <h1
                        className="text-[26px] sm:text-[36px] font-bold tracking-[-1px] leading-tight"
                        style={{ color: colors.textMain }}
                      >
                        {symbolFormatted}
                      </h1>
                    </div>

                    {/* Side & Leverage Badge */}
                    <div className="flex items-center gap-1.5 mt-1 sm:mt-1.5">
                      <span
                        className={cn(
                          "rounded-md px-2 py-0.5 text-[10px] sm:text-[12px] font-bold uppercase tracking-wider",
                          side === "long"
                            ? theme === "editorial"
                              ? "bg-[#06964A] text-white"
                              : "bg-[#00D964] text-black"
                            : "bg-[#FF3B30] text-white"
                        )}
                      >
                        {sideLabel}
                      </span>
                      <span className="text-[12px] sm:text-[14px] font-semibold" style={{ color: colors.textSecondary }}>
                        · {leverageStr}
                      </span>
                      {modeBadgeText && (
                        <span
                          className="rounded-md px-2 py-0.5 text-[9px] sm:text-[11px] font-semibold border ml-1 truncate"
                          style={{
                            backgroundColor: theme === "editorial" ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.08)",
                            borderColor: theme === "editorial" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.15)",
                            color: colors.textMain,
                          }}
                        >
                          {modeBadgeText}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle: Giant ROI % Typography */}
                  <div className="my-auto py-1 sm:py-2">
                    <p
                      className="text-[9px] sm:text-[11px] uppercase tracking-wider font-semibold"
                      style={{ color: colors.textSecondary }}
                    >
                      {pnlHeadingLabel}
                    </p>
                    <div
                      className="text-[40px] sm:text-[58px] font-extrabold tracking-[-2px] leading-none my-0.5"
                      style={{ color: isLoss ? colors.pnlNegative : colors.pnlPositive }}
                    >
                      {pnlPctFormatted}
                    </div>
                    {!hideDollar && (
                      <p
                        className="text-[11px] sm:text-[14px] font-semibold mt-1"
                        style={{ color: colors.textSecondary }}
                      >
                        {dollarFormatted}
                      </p>
                    )}
                  </div>

                  {/* Bottom Stats Row */}
                  {showMetrics && (
                    <div
                      className="pt-2 sm:pt-3 border-t grid grid-cols-3 gap-1 sm:gap-2"
                      style={{ borderColor: colors.divider }}
                    >
                      {statCols.map((col, idx) => (
                        <div
                          key={col.label}
                          className={cn(idx < 2 && "border-r pr-1 sm:pr-2")}
                          style={{ borderColor: colors.divider }}
                        >
                          <p
                            className="text-[7px] sm:text-[9px] uppercase font-semibold tracking-wider truncate"
                            style={{ color: colors.textSecondary }}
                          >
                            {col.label}
                          </p>
                          <p
                            className="text-[10px] sm:text-[14px] font-bold leading-tight mt-0.5 truncate"
                            style={{ color: colors.textMain }}
                          >
                            {col.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Column (46%): Claude Monet Impressionist Art Panel */}
                <div className="w-[46%] h-full rounded-xl sm:rounded-2xl overflow-hidden shrink-0 relative bg-[#F5F5F3]">
                  <img
                    src={selectedArt.url}
                    alt={`${selectedArt.artist} - ${selectedArt.title}`}
                    className="w-full h-full object-cover object-center filter saturate-[1.05]"
                  />

                  {/* Signature delicate iridescent pastel rainbow overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#CDC3F0]/25 via-[#FFDAC8]/20 to-[#A0D4CA]/25 pointer-events-none" />

                  {/* Soft impressionist depth vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/15 pointer-events-none" />

                  {/* Top Right Network Badge */}
                  <div className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 z-10">
                    <div className="rounded-full bg-white/90 backdrop-blur-md border border-white/70 px-2 py-0.5 sm:px-2.5 sm:py-1 flex items-center gap-1.5 text-[8px] sm:text-[10px] font-mono text-[#0A0A0A] shadow-xs">
                      <span className="size-1.5 rounded-full bg-[#00D964] animate-pulse" />
                      <span className="font-semibold">HyperEVM Live</span>
                    </div>
                  </div>

                  {/* Floating Plaque on Monet artwork */}
                  <div
                    className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-3.5 sm:left-3.5 sm:right-3.5 rounded-xl sm:rounded-2xl backdrop-blur-md p-2.5 sm:p-3 border shadow-lg z-10"
                    style={{
                      backgroundColor: colors.plaqueBg,
                      borderColor: colors.plaqueBorder,
                    }}
                  >
                    <p
                      className="font-bold text-[12px] sm:text-[15px] leading-tight"
                      style={{ color: colors.plaqueText }}
                    >
                      1000x Synthetic Perps.
                    </p>
                    <p
                      className="text-[9px] sm:text-[11px] font-medium mt-0.5"
                      style={{ color: colors.textSecondary }}
                    >
                      Mark-clamped BBO · Zero Entry Fees
                    </p>
                    <div className="mt-1.5 flex items-center justify-between text-[8px] sm:text-[10px]">
                      <span className="rounded-full bg-gradient-to-r from-[#CDC3F0]/80 via-[#FFDAC8]/80 to-[#A0D4CA]/80 px-2 py-0.5 font-bold text-[#0A0A0A] border border-black/10">
                        {selectedArt.artist}, {selectedArt.year}
                      </span>
                      <span
                        className="italic truncate max-w-[130px] pl-1 font-serif text-[8px] sm:text-[10px]"
                        style={{ color: colors.textSecondary }}
                      >
                        {selectedArt.title}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Referral Strip */}
              <div
                className="pt-2 sm:pt-3 mt-2 sm:mt-3 border-t flex items-center justify-between shrink-0"
                style={{ borderColor: colors.divider }}
              >
                {/* Left: Invite Friends */}
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <div className="h-5 sm:h-6 w-1 bg-[#00D964] rounded-xs" />
                  <div>
                    <p
                      className="text-[7px] sm:text-[9px] uppercase tracking-[1.5px] font-semibold leading-none"
                      style={{ color: colors.textSecondary }}
                    >
                      INVITE FRIENDS
                    </p>
                    <p
                      className="text-[11px] sm:text-[14px] font-bold leading-tight mt-0.5"
                      style={{ color: colors.textMain }}
                    >
                      {referralCode}
                    </p>
                  </div>
                </div>

                {/* Center-Right & Right: Dynamic Scannable Vector QR & Link */}
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Real Vector QR Code */}
                  <div className="p-1 bg-white rounded border border-[#E5E5E5] shrink-0">
                    <svg
                      viewBox={`0 0 ${qrSvg.viewBoxSize} ${qrSvg.viewBoxSize}`}
                      className="size-8 sm:size-10"
                      shapeRendering="crispEdges"
                    >
                      <path d={qrSvg.path} fill="#0A0A0A" />
                    </svg>
                  </div>

                  <div className="h-5 sm:h-6 w-[1px]" style={{ backgroundColor: colors.divider }} />

                  <div className="text-right">
                    <p
                      className="text-[7px] sm:text-[9px] uppercase tracking-[1.5px] font-semibold leading-none"
                      style={{ color: colors.textSecondary }}
                    >
                      REFERRAL CODE
                    </p>
                    <p
                      className="text-[11px] sm:text-[14px] font-bold leading-tight mt-0.5 flex items-center justify-end gap-1"
                      style={{ color: colors.textMain }}
                    >
                      <span>{referralCode}</span>
                      <ArrowRight className="size-2.5 sm:size-3" />
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden Canvas used for generating 1600 × 1000 px full-resolution PNG */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Action Buttons Row */}
        <div className="px-6 py-3.5 border-t border-white/[0.08] bg-[#121214] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-[12px] text-white/50">
            {copied === "image" && (
              <span className="text-[#00D964] font-semibold flex items-center gap-1.5 animate-fade-in">
                <Check className="size-4" /> 1600 × 1000 px card exported successfully!
              </span>
            )}
            {copied === "link" && (
              <span className="text-[#00D964] font-semibold flex items-center gap-1.5 animate-fade-in">
                <Check className="size-4" /> Trade summary copied to clipboard!
              </span>
            )}
            {!copied && <span>Full-fidelity export: 1600 × 1000 px (16:10 Aspect Ratio)</span>}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="h-9 px-3 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white text-[12px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Copy className="size-3.5" />
              <span>Copy Text</span>
            </button>

            <button
              type="button"
              onClick={shareToX}
              className="h-9 px-3.5 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white hover:text-white text-[12px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 24.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>Share to X</span>
            </button>

            <button
              type="button"
              onClick={handleCopyImage}
              disabled={isExporting}
              className="h-9 px-3.5 rounded-lg border border-white/15 bg-white/10 hover:bg-white/20 text-white text-[12px] font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Share2 className="size-3.5" />
              <span>Copy Image</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={isExporting}
              className="h-9 px-4 rounded-lg bg-gradient-to-r from-[#00D964] to-[#00B853] hover:from-[#00F06F] hover:to-[#00D964] text-black text-[13px] font-bold shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Download className="size-4 stroke-[2.5]" />
              <span>Download PNG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
