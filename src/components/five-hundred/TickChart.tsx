import { useEffect, useRef, useCallback } from "react";
import type { MarketSymbol, PositionRecord } from "@/lib/five-hundred";
import { SHARED_BTC_PRICE } from "@/lib/mock-data";

export type ActivePosition = PositionRecord;

interface Tick {
  time: number; // millisecond timestamp
  price: number;
}

interface Ripple {
  time: number;
  dir: "up" | "down" | "flat";
}

interface TickChartProps {
  marketSymbol: MarketSymbol;
  spotPrice: number;
  activePosition: PositionRecord | null;
  targetPrice?: number;
  leverage?: number;
  onPriceUpdate: (price: number, change24h: number, tickDir: "up" | "down" | "flat") => void;
  onLiquidate: (id: string) => void;
  onSetTargetPrice?: (price: number) => void;
  demoVolatility?: number; // 1x to 5x multiplier
  isMarketClosed?: boolean;
  formatPrice: (p: number) => string;
  className?: string;
}

interface AssetParam {
  basePrice: number;
  driftMin: number;
  driftMax: number;
  jumpProb: number;
  jumpMultiplier: number;
  decimals: number;
}

const ASSET_PARAMS: Partial<Record<MarketSymbol, AssetParam>> = {
  BTC: {
    basePrice: SHARED_BTC_PRICE,
    driftMin: -6,
    driftMax: 6,
    jumpProb: 0.08,
    jumpMultiplier: 4,
    decimals: 1,
  },
  ETH: {
    basePrice: 2800,
    driftMin: -0.8,
    driftMax: 0.8,
    jumpProb: 0.08,
    jumpMultiplier: 4,
    decimals: 2,
  },
  SPX: {
    basePrice: 6120,
    driftMin: -0.3,
    driftMax: 0.3,
    jumpProb: 0.04,
    jumpMultiplier: 2.5,
    decimals: 1,
  },
  SOL: {
    basePrice: 178.5,
    driftMin: -0.1,
    driftMax: 0.1,
    jumpProb: 0.08,
    jumpMultiplier: 4,
    decimals: 2,
  },
  HYPE: {
    basePrice: 24.8,
    driftMin: -0.04,
    driftMax: 0.04,
    jumpProb: 0.08,
    jumpMultiplier: 4,
    decimals: 2,
  },
  DOGE: {
    basePrice: 0.22,
    driftMin: -0.0008,
    driftMax: 0.0008,
    jumpProb: 0.08,
    jumpMultiplier: 4,
    decimals: 4,
  },
  SUI: {
    basePrice: 2.15,
    driftMin: -0.008,
    driftMax: 0.008,
    jumpProb: 0.08,
    jumpMultiplier: 4,
    decimals: 2,
  },
  AVAX: {
    basePrice: 28.6,
    driftMin: -0.05,
    driftMax: 0.05,
    jumpProb: 0.08,
    jumpMultiplier: 4,
    decimals: 2,
  },
  BNB: {
    basePrice: 620.5,
    driftMin: -0.3,
    driftMax: 0.3,
    jumpProb: 0.08,
    jumpMultiplier: 4,
    decimals: 1,
  },
  LINK: {
    basePrice: 14.8,
    driftMin: -0.03,
    driftMax: 0.03,
    jumpProb: 0.08,
    jumpMultiplier: 4,
    decimals: 2,
  },
  ARB: {
    basePrice: 0.62,
    driftMin: -0.002,
    driftMax: 0.002,
    jumpProb: 0.08,
    jumpMultiplier: 4,
    decimals: 3,
  },
  OP: {
    basePrice: 1.75,
    driftMin: -0.005,
    driftMax: 0.005,
    jumpProb: 0.08,
    jumpMultiplier: 4,
    decimals: 2,
  },
  TIA: {
    basePrice: 5.4,
    driftMin: -0.015,
    driftMax: 0.015,
    jumpProb: 0.08,
    jumpMultiplier: 4,
    decimals: 2,
  },
  APT: {
    basePrice: 9.8,
    driftMin: -0.02,
    driftMax: 0.02,
    jumpProb: 0.08,
    jumpMultiplier: 4,
    decimals: 2,
  },
};

export function getAssetParams(symbol: string, spotPrice?: number): AssetParam {
  const found = ASSET_PARAMS[symbol as MarketSymbol];
  if (found) return found;
  const base = spotPrice && spotPrice > 0 ? spotPrice : 10;
  const decimals = base < 1 ? 4 : base < 10 ? 3 : 2;
  const drift = base * 0.0008;
  return {
    basePrice: base,
    driftMin: -drift,
    driftMax: drift,
    jumpProb: 0.08,
    jumpMultiplier: 3.5,
    decimals,
  };
}

export function TickChart({
  marketSymbol,
  spotPrice,
  activePosition,
  targetPrice,
  leverage = 500,
  onPriceUpdate,
  onLiquidate,
  onSetTargetPrice,
  demoVolatility = 1,
  isMarketClosed = false,
  formatPrice,
  className = "",
}: TickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDraggingTargetRef = useRef(false);

  // References for continuous 60fps simulation loop
  const stateRef = useRef<{
    symbol: MarketSymbol;
    ticks: Tick[];
    liveHeadPrice: number;
    targetHeadPrice: number;
    lastTickTime: number;
    nextTickDelay: number;
    lastTickDir: "up" | "down" | "flat";
    flashTime: number;
    flashDir: "up" | "down";
    flashIntensity: number;
    smoothedMinPrice: number;
    smoothedMaxPrice: number;
    liquidatedTriggered: boolean;
    ripples: Ripple[];
    realAnchorPrice: number;
    // Crossfade transition state
    crossfadeAlpha: number;
    crossfadeSnapshot: HTMLCanvasElement | null;
    isTransitioning: boolean;
  }>({
    symbol: marketSymbol,
    ticks: [],
    liveHeadPrice: spotPrice,
    targetHeadPrice: spotPrice,
    realAnchorPrice: spotPrice,
    lastTickTime: 0,
    nextTickDelay: 180,
    lastTickDir: "flat",
    flashTime: 0,
    flashDir: "up",
    flashIntensity: 0,
    smoothedMinPrice: spotPrice * 0.999,
    smoothedMaxPrice: spotPrice * 1.001,
    liquidatedTriggered: false,
    ripples: [],
    crossfadeAlpha: 1,
    crossfadeSnapshot: null,
    isTransitioning: false,
  });

  // Seed initial history for an asset so chart is full upon mounting
  const seedTicks = useCallback((symbol: MarketSymbol, base: number) => {
    const params = getAssetParams(symbol, base);
    const ticks: Tick[] = [];
    const now = Date.now();
    const count = 180;
    const interval = 200; // 36 seconds of history

    let currentPrice = base;
    const startTime = now - count * interval;

    for (let i = 0; i < count; i++) {
      const isJump = Math.random() < params.jumpProb;
      const rawDelta =
        (Math.random() - 0.495) *
        (params.driftMax - params.driftMin) *
        (isJump ? params.jumpMultiplier : 1);
      currentPrice += rawDelta;
      ticks.push({
        time: startTime + i * interval,
        price: Number(currentPrice.toFixed(params.decimals)),
      });
    }

    return { ticks, currentPrice };
  }, []);

  // Initialize ticks on mount
  useEffect(() => {
    const state = stateRef.current;
    if (state.ticks.length === 0) {
      const { ticks, currentPrice } = seedTicks(marketSymbol, spotPrice);
      state.symbol = marketSymbol;
      state.ticks = ticks;
      state.liveHeadPrice = currentPrice;
      state.targetHeadPrice = currentPrice;
      state.realAnchorPrice = spotPrice;
      state.lastTickTime = Date.now();
      state.nextTickDelay = 150 + Math.random() * 100;
      state.smoothedMinPrice = currentPrice * 0.999;
      state.smoothedMaxPrice = currentPrice * 1.001;
      state.liquidatedTriggered = false;
    }
  }, [marketSymbol, spotPrice, seedTicks]);

  // Handle incoming real live price updates from parent
  useEffect(() => {
    const state = stateRef.current;
    if (state.symbol === marketSymbol && spotPrice > 0) {
      state.realAnchorPrice = spotPrice;
    }
  }, [marketSymbol, spotPrice]);

  // Handle asset switch with smooth crossfade
  useEffect(() => {
    const state = stateRef.current;
    if (state.symbol === marketSymbol) return;

    // Snapshot existing canvas for smooth crossfade
    const canvas = canvasRef.current;
    if (canvas && canvas.width > 0 && canvas.height > 0) {
      const snapshot = document.createElement("canvas");
      snapshot.width = canvas.width;
      snapshot.height = canvas.height;
      const sCtx = snapshot.getContext("2d");
      if (sCtx) {
        sCtx.drawImage(canvas, 0, 0);
        state.crossfadeSnapshot = snapshot;
        state.crossfadeAlpha = 1;
        state.isTransitioning = true;
      }
    }

    // Initialize new asset ticks using spotPrice
    const base = spotPrice > 0 ? spotPrice : getAssetParams(marketSymbol, spotPrice).basePrice;
    const { ticks, currentPrice } = seedTicks(marketSymbol, base);
    state.symbol = marketSymbol;
    state.ticks = ticks;
    state.liveHeadPrice = currentPrice;
    state.targetHeadPrice = currentPrice;
    state.realAnchorPrice = base;
    state.lastTickTime = Date.now();
    state.nextTickDelay = 160 + Math.random() * 90;
    state.liquidatedTriggered = false;
    state.smoothedMinPrice = currentPrice * 0.999;
    state.smoothedMaxPrice = currentPrice * 1.001;
  }, [marketSymbol, spotPrice, seedTicks]);

  // Reset liquidation flag when active position updates
  useEffect(() => {
    if (activePosition?.status === "open") {
      stateRef.current.liquidatedTriggered = false;
    }
  }, [activePosition?.id, activePosition?.status]);

  // Main 60 FPS RequestAnimationFrame render loop
  useEffect(() => {
    let animId: number;
    let lastFrameTime = performance.now();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const renderLoop = (timeNow: number) => {
      animId = requestAnimationFrame(renderLoop);

      const dt = Math.min(0.1, (timeNow - lastFrameTime) / 1000);
      lastFrameTime = timeNow;

      const state = stateRef.current;
      const nowMs = Date.now();
      const params = getAssetParams(state.symbol, state.realAnchorPrice);

      // 1. Tick generator (runs every 100-180ms for lively 1000x micro-volatility)
      if (nowMs - state.lastTickTime >= state.nextTickDelay) {
        state.lastTickTime = nowMs;
        state.nextTickDelay = 100 + Math.random() * 80;

        const isJump = Math.random() < params.jumpProb;
        const volMultiplier = Math.max(1, demoVolatility);
        const drift =
          (Math.random() - 0.495) *
          (params.driftMax - params.driftMin) *
          1.45 *
          (isJump ? params.jumpMultiplier : 1) *
          volMultiplier;

        // Rapid mean-reverting pull toward realAnchorPrice so tick chart faithfully dances strictly on live price
        const anchorDelta = (state.realAnchorPrice - state.targetHeadPrice) * 0.35;
        const newTarget = Number((state.targetHeadPrice + drift + anchorDelta).toFixed(params.decimals));
        const prevPrice = state.targetHeadPrice;
        state.targetHeadPrice = newTarget;

        const dir: "up" | "down" | "flat" =
          newTarget > prevPrice ? "up" : newTarget < prevPrice ? "down" : "flat";
        state.lastTickDir = dir;

        if (dir !== "flat") {
          state.flashTime = nowMs;
          state.flashDir = dir;
          state.flashIntensity = 1.0;
        }

        // Spawn a heartbeat ripple from head dot
        state.ripples.push({ time: nowMs, dir });
        if (state.ripples.length > 8) state.ripples.shift();

        state.ticks.push({ time: nowMs, price: newTarget });

        // Prune ticks older than 90 seconds
        const pruneThreshold = nowMs - 90000;
        while (state.ticks.length > 50 && (state.ticks[0]?.time ?? 0) < pruneThreshold) {
          state.ticks.shift();
        }

        // Notify parent of updated price
        const change24h = ((newTarget - params.basePrice) / params.basePrice) * 100;
        onPriceUpdate(newTarget, change24h, dir);
      }

      // 2. Smooth exponential lerp for live head price
      const lerpSpeed = Math.min(1, dt * 14);
      state.liveHeadPrice += (state.targetHeadPrice - state.liveHeadPrice) * lerpSpeed;

      // 3. Flash decay (smoothly settles to neutral white)
      if (state.flashIntensity > 0) {
        const elapsed = nowMs - state.flashTime;
        state.flashIntensity = Math.max(0, 1 - elapsed / 350);
      }

      // 4. Check live liquidation condition
      if (
        activePosition &&
        activePosition.status === "open" &&
        !state.liquidatedTriggered &&
        !isMarketClosed
      ) {
        const cur = state.liveHeadPrice;
        const liq = activePosition.liqPrice;
        const isLiq =
          (activePosition.side === "long" && cur <= liq) ||
          (activePosition.side === "short" && cur >= liq);

        if (isLiq) {
          state.liquidatedTriggered = true;
          onLiquidate(activePosition.id);
        }
      }

      // 5. Canvas dimensions handling
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      if (width === 0 || height === 0) return;

      const physicalW = Math.round(width * dpr);
      const physicalH = Math.round(height * dpr);

      if (canvas.width !== physicalW || canvas.height !== physicalH) {
        canvas.width = physicalW;
        canvas.height = physicalH;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Clear frame
      ctx.clearRect(0, 0, width, height);

      // Continuous scrolling parameters
      const scrollSpeed = 55; // pixels per second
      const rightMargin = 88; // space reserved for right-pinned price tag & axis
      const headX = width - rightMargin;

      // Calculate time window visible on screen
      const visibleDurationMs = (headX / scrollSpeed) * 1000;
      const minVisibleTime = nowMs - visibleDurationMs;

      // Find min and max price among visible ticks for auto-scaling
      let minP = state.liveHeadPrice;
      let maxP = state.liveHeadPrice;

      for (let i = 0; i < state.ticks.length; i++) {
        const t = state.ticks[i];
        if (t && t.time >= minVisibleTime - 2000) {
          if (t.price < minP) minP = t.price;
          if (t.price > maxP) maxP = t.price;
        }
      }

      // Smooth Auto-Zoom Requirement:
      // When no position: y-range tightly hugs the price corridor so ticks produce lively vertical action.
      // When a position opens: ease out over ~600ms to include entry, liquidation, target.
      // When position closes: ease back over ~600ms to hug the price.
      let padFactor = 0.045; // tight corridor hug to make micro-volatility visibly dynamic
      if (activePosition && activePosition.status === "open") {
        if (activePosition.liqPrice < minP) minP = activePosition.liqPrice;
        if (activePosition.liqPrice > maxP) maxP = activePosition.liqPrice;
        if (activePosition.entryPrice < minP) minP = activePosition.entryPrice;
        if (activePosition.entryPrice > maxP) maxP = activePosition.entryPrice;
        if (targetPrice) {
          if (targetPrice < minP) minP = targetPrice;
          if (targetPrice > maxP) maxP = targetPrice;
        }
        padFactor = 0.22; // comfortable breathing room for labeled lines
      }

      const priceRange = Math.max(1, maxP - minP);
      const targetMin = minP - priceRange * padFactor;
      const targetMax = maxP + priceRange * padFactor;

      // Smooth auto-scaling easing (easing rate ~4.5 for smooth 600ms transition)
      const easeRate = Math.min(1, dt * 4.5);
      state.smoothedMinPrice += (targetMin - state.smoothedMinPrice) * easeRate;
      state.smoothedMaxPrice += (targetMax - state.smoothedMaxPrice) * easeRate;

      const yMin = state.smoothedMinPrice;
      const yMax = state.smoothedMaxPrice;

      const priceToY = (p: number) => {
        if (yMax <= yMin) return height / 2;
        const norm = (p - yMin) / (yMax - yMin);
        return height - 32 - norm * (height - 64);
      };

      const timeToX = (t: number) => {
        return headX - ((nowMs - t) / 1000) * scrollSpeed;
      };

      // 6. Draw Subtle Vignette Shifting smoothly toward warm red only as Leverage Rises
      const levRatio = Math.min(1, Math.max(0, (leverage - 50) / 950));
      const vigAlpha = 0.02 + levRatio * 0.05;

      const vignetteGrad = ctx.createRadialGradient(
        width * 0.45,
        height * 0.5,
        Math.min(width, height) * 0.3,
        width * 0.45,
        height * 0.5,
        Math.max(width, height) * 0.75,
      );
      vignetteGrad.addColorStop(0, "rgba(0,0,0,0)");
      vignetteGrad.addColorStop(1, `rgba(217, 45, 69, ${vigAlpha})`);
      ctx.fillStyle = vignetteGrad;
      ctx.fillRect(0, 0, width, height);

      // 7. Draw Subtle Background Grid
      ctx.save();
      ctx.lineWidth = 1;

      // 7.1 Horizontal grid lines (4 lines across Y axis)
      const numYLines = 4;
      ctx.font = "11px 'Inter', monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";

      for (let i = 0; i <= numYLines; i++) {
        const p = yMin + (i / numYLines) * (yMax - yMin);
        const y = priceToY(p);

        ctx.strokeStyle = "rgba(10, 10, 12, 0.06)";
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();

        // Right axis price text
        ctx.fillStyle = "rgba(10, 10, 12, 0.45)";
        ctx.fillText(formatPrice(p), headX + 12, y);
      }

      // 7.2 Vertical scrolling time grid lines every 5 seconds
      const fiveSec = 5000;
      const firstTickTime = Math.floor(minVisibleTime / fiveSec) * fiveSec;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";

      for (let t = firstTickTime; t <= nowMs + 1000; t += fiveSec) {
        const x = timeToX(t);
        if (x >= -20 && x <= headX) {
          ctx.strokeStyle = "rgba(10, 10, 12, 0.04)";
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height - 20);
          ctx.stroke();

          // Time label (e.g. 14:22:05)
          const d = new Date(t);
          const timeStr = d.toTimeString().slice(0, 8);
          ctx.fillStyle = "rgba(10, 10, 12, 0.35)";
          ctx.fillText(timeStr, x, height - 6);
        }
      }
      ctx.restore();

      // 8. Draw Active Position Danger Zone & Labeled Lines (Entry, Liq, Target)
      if (activePosition && activePosition.status === "open") {
        const entryY = priceToY(activePosition.entryPrice);
        const liqY = priceToY(activePosition.liqPrice);
        const curY = priceToY(state.liveHeadPrice);

        // 8.1 Danger zone shaded area between current price and liquidation line
        ctx.save();
        const topDangerY = Math.min(curY, liqY);
        const botDangerY = Math.max(curY, liqY);
        const dangerHeight = Math.max(1, botDangerY - topDangerY);

        const pulseAlpha = 0.08 + 0.05 * Math.sin(timeNow * 0.005);
        const dangerGrad = ctx.createLinearGradient(0, topDangerY, 0, botDangerY);

        if (activePosition.side === "long") {
          dangerGrad.addColorStop(0, `rgba(255, 67, 67, ${pulseAlpha * 0.3})`);
          dangerGrad.addColorStop(1, `rgba(255, 67, 67, ${pulseAlpha * 1.2})`);
        } else {
          dangerGrad.addColorStop(0, `rgba(255, 67, 67, ${pulseAlpha * 1.2})`);
          dangerGrad.addColorStop(1, `rgba(255, 67, 67, ${pulseAlpha * 0.3})`);
        }

        ctx.fillStyle = dangerGrad;
        ctx.fillRect(0, topDangerY, headX, dangerHeight);

        // 8.2 Entry Line (Solid/subtle dash with ENTRY tag)
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = "rgba(10, 10, 12, 0.35)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, entryY);
        ctx.lineTo(headX, entryY);
        ctx.stroke();

        // Entry tag pill on left
        ctx.setLineDash([]);
        ctx.fillStyle = "#FFFFFF";
        ctx.strokeStyle = "rgba(10, 10, 12, 0.18)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(8, entryY - 10, 114, 20, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#0B0B0C";
        ctx.font = "11px 'Inter', monospace";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(`ENTRY ${formatPrice(activePosition.entryPrice)}`, 16, entryY);

        // 8.3 Red Dashed Liquidation Line
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = "#D92D45";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, liqY);
        ctx.lineTo(headX, liqY);
        ctx.stroke();

        // Liquidation tag pill
        ctx.setLineDash([]);
        ctx.fillStyle = "#FFF5F5";
        ctx.strokeStyle = "rgba(217, 45, 69, 0.45)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(8, liqY - 10, 136, 20, 10);
        ctx.fill();
        ctx.stroke();

        const liqPct = (100 / activePosition.leverage).toFixed(2);
        ctx.fillStyle = "#D92D45";
        ctx.font = "bold 11px 'Inter', monospace";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(`LIQ ${formatPrice(activePosition.liqPrice)} (${liqPct}%)`, 16, liqY);

        // 8.4 Target Line (if targetPrice is set)
        if (targetPrice) {
          const tgtY = priceToY(targetPrice);
          ctx.setLineDash([3, 3]);
          ctx.strokeStyle = "#087F4D";
          ctx.lineWidth = 1.25;
          ctx.beginPath();
          ctx.moveTo(0, tgtY);
          ctx.lineTo(headX, tgtY);
          ctx.stroke();

          // Target tag pill
          ctx.setLineDash([]);
          ctx.fillStyle = "#F0FDF4";
          ctx.strokeStyle = "rgba(8, 127, 77, 0.4)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(8, tgtY - 10, 122, 20, 10);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#087F4D";
          ctx.font = "bold 11px 'Inter', monospace";
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(`TARGET ${formatPrice(targetPrice)}`, 16, tgtY);
        }

        ctx.restore();
      }

      // 9. Draw Continuous Stepped Tick Line and Under-Line Gradient
      const visibleTicks: { x: number; y: number }[] = [];
      const ticks = state.ticks;

      for (let i = 0; i < ticks.length; i++) {
        const tick = ticks[i];
        if (!tick) continue;
        const x = timeToX(tick.time);
        if (x >= -40 && x <= headX) {
          visibleTicks.push({ x, y: priceToY(tick.price) });
        }
      }

      const headY = priceToY(state.liveHeadPrice);

      const first = visibleTicks[0];
      if (first) {
        ctx.save();

        // 9.1 Construct stepped path
        ctx.beginPath();
        ctx.moveTo(Math.max(0, first.x), first.y);

        let prevX = first.x;
        let prevY = first.y;

        for (let i = 1; i < visibleTicks.length; i++) {
          const curr = visibleTicks[i];
          if (!curr) continue;
          ctx.lineTo(curr.x, prevY);
          ctx.lineTo(curr.x, curr.y);
          prevX = curr.x;
          prevY = curr.y;
        }

        ctx.lineTo(headX, prevY);
        ctx.lineTo(headX, headY);

        // 9.2 Subtle Under-Line Gradient Fill
        ctx.save();
        ctx.lineTo(headX, height - 20);
        ctx.lineTo(Math.max(0, first.x), height - 20);
        ctx.closePath();

        const lineGrad = ctx.createLinearGradient(0, Math.min(headY, height / 2), 0, height - 20);
        lineGrad.addColorStop(0, "rgba(10, 10, 12, 0.06)");
        lineGrad.addColorStop(0.5, "rgba(10, 10, 12, 0.02)");
        lineGrad.addColorStop(1, "rgba(10, 10, 12, 0.00)");

        ctx.fillStyle = lineGrad;
        ctx.fill();
        ctx.restore();

        // 9.3 Stroke the stepped line (solid crisp dark line)
        ctx.beginPath();
        ctx.moveTo(Math.max(0, first.x), first.y);
        prevY = first.y;
        for (let i = 1; i < visibleTicks.length; i++) {
          const curr = visibleTicks[i];
          if (!curr) continue;
          ctx.lineTo(curr.x, prevY);
          ctx.lineTo(curr.x, curr.y);
          prevY = curr.y;
        }
        ctx.lineTo(headX, prevY);
        ctx.lineTo(headX, headY);

        ctx.strokeStyle = "#0B0B0C";
        ctx.lineWidth = 1.75;
        ctx.lineJoin = "miter";
        ctx.stroke();
        ctx.restore();
      }

      // 10. Heartbeat Ripple Rings from Head Dot on New Ticks
      for (let i = state.ripples.length - 1; i >= 0; i--) {
        const rip = state.ripples[i];
        if (!rip) continue;
        const age = nowMs - rip.time;
        if (age > 600) {
          state.ripples.splice(i, 1);
          continue;
        }
        const progress = age / 600;
        const ripRadius = 6 + progress * 28;
        const ripAlpha = (1 - progress) * 0.45;

        ctx.save();
        ctx.beginPath();
        ctx.arc(headX, headY, ripRadius, 0, Math.PI * 2);
        ctx.strokeStyle =
          rip.dir === "up"
            ? `rgba(8, 127, 77, ${ripAlpha})`
            : rip.dir === "down"
              ? `rgba(217, 45, 69, ${ripAlpha})`
              : `rgba(10, 10, 12, ${ripAlpha * 0.5})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }

      // 11. Head Elements: Dashed Current-Price Line, Subtle Accent Glow, Dot, Price Tag
      ctx.save();

      // 11.1 Dashed horizontal line across the chart at current price
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "rgba(10, 10, 12, 0.20)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, headY);
      ctx.lineTo(headX, headY);
      ctx.stroke();
      ctx.setLineDash([]);

      // 11.2 Delicate Glow behind the head dot
      const pulseRadius = 14 + 4 * Math.sin(timeNow * 0.005);
      const meshHeadGlow = ctx.createRadialGradient(
        headX,
        headY,
        0,
        headX,
        headY,
        pulseRadius * 2.5,
      );
      meshHeadGlow.addColorStop(0, "rgba(8, 127, 77, 0.25)");
      meshHeadGlow.addColorStop(0.5, "rgba(205, 195, 240, 0.2)");
      meshHeadGlow.addColorStop(1, "rgba(255, 255, 255, 0)");

      ctx.fillStyle = meshHeadGlow;
      ctx.beginPath();
      ctx.arc(headX, headY, pulseRadius * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Inner dot
      ctx.fillStyle = "#0B0B0C";
      ctx.beginPath();
      ctx.arc(headX, headY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // 11.3 Pinned Price Tag on the Right Axis (Flashes green/red on tick, settles to clean white pill)
      const tagW = 78;
      const tagH = 24;
      const tagX = headX + 6;
      const tagY = Math.max(12, Math.min(height - 36, headY - tagH / 2));

      let tagBg = "#FFFFFF";
      let tagBorder = "rgba(10, 10, 12, 0.18)";
      let tagTextColor = "#0B0B0C";

      if (state.flashIntensity > 0) {
        if (state.flashDir === "up") {
          tagBg = `rgba(8, 127, 77, ${0.12 + state.flashIntensity * 0.25})`;
          tagBorder = `rgba(8, 127, 77, ${0.4 + state.flashIntensity * 0.5})`;
          tagTextColor = "#087F4D";
        } else {
          tagBg = `rgba(217, 45, 69, ${0.12 + state.flashIntensity * 0.25})`;
          tagBorder = `rgba(217, 45, 69, ${0.4 + state.flashIntensity * 0.5})`;
          tagTextColor = "#D92D45";
        }
      }

      ctx.fillStyle = tagBg;
      ctx.strokeStyle = tagBorder;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(tagX, tagY, tagW, tagH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = tagTextColor;
      ctx.font = "bold 11px 'Inter', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(formatPrice(state.liveHeadPrice), tagX + tagW / 2, tagY + tagH / 2);

      ctx.restore();

      // 12. Liquidation Screen Flash Overlay
      if (state.liquidatedTriggered && activePosition?.status === "liquidated") {
        ctx.save();
        ctx.fillStyle = "rgba(255, 67, 67, 0.22)";
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }

      // 13. Crossfade Transition Overlay (When switching asset)
      if (state.isTransitioning && state.crossfadeSnapshot) {
        state.crossfadeAlpha = Math.max(0, state.crossfadeAlpha - dt * 3);
        if (state.crossfadeAlpha > 0) {
          ctx.save();
          ctx.globalAlpha = state.crossfadeAlpha;
          ctx.drawImage(state.crossfadeSnapshot, 0, 0, width, height);
          ctx.restore();
        } else {
          state.isTransitioning = false;
          state.crossfadeSnapshot = null;
        }
      }

      ctx.restore();
    };

    animId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [
    activePosition,
    demoVolatility,
    formatPrice,
    isMarketClosed,
    leverage,
    onLiquidate,
    onPriceUpdate,
    targetPrice,
  ]);

  // Handle pointer down on chart for dragging/setting target line
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canvasRef.current || !onSetTargetPrice) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    const rect = canvasRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    if (height <= 0) return;

    const yMin = stateRef.current.smoothedMinPrice;
    const yMax = stateRef.current.smoothedMaxPrice;
    const norm = (height - 32 - y) / (height - 64);
    const price = yMin + norm * (yMax - yMin);

    isDraggingTargetRef.current = true;
    onSetTargetPrice(Number(price.toFixed(getAssetParams(marketSymbol, spotPrice).decimals)));
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingTargetRef.current || !canvasRef.current || !onSetTargetPrice) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    if (height <= 0) return;

    const yMin = stateRef.current.smoothedMinPrice;
    const yMax = stateRef.current.smoothedMaxPrice;
    const norm = (height - 32 - y) / (height - 64);
    const price = yMin + norm * (yMax - yMin);

    onSetTargetPrice(Number(price.toFixed(getAssetParams(marketSymbol, spotPrice).decimals)));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    isDraggingTargetRef.current = false;
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`relative w-full h-full min-h-[360px] overflow-hidden select-none cursor-crosshair ${className}`}
      title="Click or drag to position your take-profit target on the chart"
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
    </div>
  );
}
