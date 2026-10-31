import React, { useState, useMemo, useRef } from "react";
import {
  type MarketSymbol,
  type HyperliquidMarketData,
  generateCorridorTicks,
} from "@/lib/hyperliquid";
import { fmtUsd } from "@/lib/engine";

interface Props {
  markets: Record<MarketSymbol, HyperliquidMarketData>;
  selectedMarket: MarketSymbol;
  onSelectMarket: (sym: MarketSymbol) => void;
}

export function CorridorDeviationChart({
  markets,
  selectedMarket,
  onSelectMarket,
}: Props) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentMarketData = markets[selectedMarket];
  const corridorLimit = currentMarketData?.corridorBps ?? 1.5;

  // Generate or sample live corridor ticks for the selected market
  const ticks = useMemo(() => {
    return generateCorridorTicks(
      selectedMarket,
      currentMarketData?.markPx ?? 68000,
      40
    );
  }, [selectedMarket, currentMarketData?.markPx]);

  const activeTick = hoverIndex !== null && ticks[hoverIndex] ? ticks[hoverIndex] : ticks[ticks.length - 1];

  // SVG Chart Geometry
  const width = 800;
  const height = 260;
  const padTop = 25;
  const padBottom = 30;
  const padLeft = 10;
  const padRight = 75;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  // Y-axis spans from -2.0 bps to +2.0 bps (or -4.0 to +4.0 for altcoins)
  const yRangeMax = corridorLimit * 1.4;
  const yRangeMin = -yRangeMax;

  const getX = (index: number) => {
    return padLeft + (index / (ticks.length - 1)) * plotW;
  };

  const getY = (bps: number) => {
    const norm = (bps - yRangeMin) / (yRangeMax - yRangeMin);
    return padTop + plotH - norm * plotH;
  };

  const upperLimitY = getY(corridorLimit);
  const lowerLimitY = getY(-corridorLimit);
  const zeroY = getY(0);

  // Build Deviation Path
  const devPath = useMemo(() => {
    return ticks
      .map((d, i) => {
        const x = getX(i);
        const y = getY(d.deviationBps);
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  }, [ticks, yRangeMin, yRangeMax]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const index = Math.round(relX * (ticks.length - 1));
    const clampedIndex = Math.max(0, Math.min(ticks.length - 1, index));
    setHoverIndex(clampedIndex);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const clampedCount = ticks.filter((t) => t.isClamped).length;

  return (
    <div className="rounded-2xl border border-hairline bg-white p-4 shadow-2xs">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xs font-semibold uppercase tracking-wider font-mono text-muted-foreground">
              Mark-Clamped BBO Corridor Telemetry
            </h2>
            <span className="rounded bg-[#FFECEA] px-1.5 py-0.5 text-[9px] font-mono font-bold text-[#FF3B30]">
              ±{corridorLimit.toFixed(1)} bps Limit
            </span>
          </div>

          <div className="mt-1.5 flex flex-wrap items-baseline gap-3">
            <p className="tabular text-2xl font-bold tracking-tight text-foreground font-mono">
              {activeTick ? (activeTick.deviationBps >= 0 ? "+" : "") : "+"}
              {activeTick?.deviationBps.toFixed(2)} bps
            </p>
            <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
              <span>BBO Mid: <strong className="text-foreground">${fmtUsd(activeTick?.midPx ?? 0, 2)}</strong></span>
              <span>·</span>
              <span>Mark: <strong className="text-foreground">${fmtUsd(activeTick?.markPx ?? 0, 2)}</strong></span>
              <span>·</span>
              <span className={activeTick?.isClamped ? "text-loss font-bold" : "text-gain font-semibold"}>
                {activeTick?.isClamped ? "CLAMPED (0 SLIPPAGE)" : "WITHIN CORRIDOR"}
              </span>
            </div>
          </div>
        </div>

        {/* Market Switcher */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(["BTC", "ETH", "SOL", "HYPE", "SPX", "DOGE"] as MarketSymbol[]).map((sym) => (
            <button
              key={sym}
              type="button"
              onClick={() => onSelectMarket(sym)}
              className={`pill h-7 px-2.5 text-[10px] font-mono transition-all ${
                selectedMarket === sym
                  ? "pill-ink font-bold shadow-2xs"
                  : "bg-[#F8F8F7] text-muted-foreground hover:text-foreground"
              }`}
            >
              {sym}
            </button>
          ))}
        </div>
      </div>

      {/* Corridor Chart Area */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative mt-3 cursor-crosshair select-none"
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Shaded corridor band */}
            <linearGradient id="corridorShade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#CDC3F0" stopOpacity="0.15" />
              <stop offset="50%" stopColor="#A0D4CA" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#CDC3F0" stopOpacity="0.15" />
            </linearGradient>

            {/* Upper clamp warning zone */}
            <linearGradient id="upperClampZone" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF3B30" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#FF3B30" stopOpacity="0.0" />
            </linearGradient>

            {/* Lower clamp warning zone */}
            <linearGradient id="lowerClampZone" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF3B30" stopOpacity="0.0" />
              <stop offset="100%" stopColor="#FF3B30" stopOpacity="0.12" />
            </linearGradient>
          </defs>

          {/* Upper Clamping Warning Zone (> +corridorLimit) */}
          <rect
            x={padLeft}
            y={padTop}
            width={plotW}
            height={upperLimitY - padTop}
            fill="url(#upperClampZone)"
          />

          {/* Safe Fair Corridor Band (between lower and upper limit) */}
          <rect
            x={padLeft}
            y={upperLimitY}
            width={plotW}
            height={lowerLimitY - upperLimitY}
            fill="url(#corridorShade)"
          />

          {/* Lower Clamping Warning Zone (< -corridorLimit) */}
          <rect
            x={padLeft}
            y={lowerLimitY}
            width={plotW}
            height={height - padBottom - lowerLimitY}
            fill="url(#lowerClampZone)"
          />

          {/* Upper Corridor Boundary Line (+1.5 bps) */}
          <line
            x1={padLeft}
            y1={upperLimitY}
            x2={width - padRight}
            y2={upperLimitY}
            stroke="#FF3B30"
            strokeWidth="1.2"
            strokeDasharray="4 3"
          />
          <text
            x={width - padRight + 8}
            y={upperLimitY + 3}
            fontSize="9"
            fontFamily='"JetBrains Mono", monospace'
            fill="#FF3B30"
            fontWeight="bold"
          >
            +{corridorLimit.toFixed(1)} bps
          </text>

          {/* Zero Parity Midline (0.00 bps) */}
          <line
            x1={padLeft}
            y1={zeroY}
            x2={width - padRight}
            y2={zeroY}
            stroke="#0A0A0A"
            strokeWidth="1"
            strokeDasharray="2 2"
            opacity="0.6"
          />
          <text
            x={width - padRight + 8}
            y={zeroY + 3}
            fontSize="9"
            fontFamily='"JetBrains Mono", monospace'
            fill="#8A8A86"
          >
            0.00 bps
          </text>

          {/* Lower Corridor Boundary Line (-1.5 bps) */}
          <line
            x1={padLeft}
            y1={lowerLimitY}
            x2={width - padRight}
            y2={lowerLimitY}
            stroke="#FF3B30"
            strokeWidth="1.2"
            strokeDasharray="4 3"
          />
          <text
            x={width - padRight + 8}
            y={lowerLimitY + 3}
            fontSize="9"
            fontFamily='"JetBrains Mono", monospace'
            fill="#FF3B30"
            fontWeight="bold"
          >
            -{corridorLimit.toFixed(1)} bps
          </text>

          {/* Deviation Curve */}
          <path
            d={devPath}
            fill="none"
            stroke="#0A0A0A"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Clamped Warning Points Indicator */}
          {ticks.map((t, i) => {
            if (!t.isClamped) return null;
            const cx = getX(i);
            const cy = getY(t.deviationBps);
            return (
              <g key={i}>
                <circle cx={cx} cy={cy} r="6" fill="#FF3B30" opacity="0.3" className="animate-ping" />
                <circle cx={cx} cy={cy} r="3.5" fill="#FF3B30" stroke="#FFFFFF" strokeWidth="1.5" />
              </g>
            );
          })}

          {/* Time Labels on X-axis */}
          {ticks
            .filter((_, i) => i % Math.ceil(ticks.length / 5) === 0 || i === ticks.length - 1)
            .map((d, i) => {
              const origIdx = ticks.indexOf(d);
              return (
                <text
                  key={i}
                  x={getX(origIdx)}
                  y={height - 8}
                  textAnchor="middle"
                  fontSize="9"
                  fontFamily='"JetBrains Mono", monospace'
                  fill="#8A8A86"
                >
                  {d.timeLabel}
                </text>
              );
            })}

          {/* Interactive Crosshair */}
          {hoverIndex !== null && activeTick && (
            <g>
              <line
                x1={getX(hoverIndex)}
                y1={padTop}
                x2={getX(hoverIndex)}
                y2={height - padBottom}
                stroke="#0A0A0A"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle
                cx={getX(hoverIndex)}
                cy={getY(activeTick.deviationBps)}
                r="4.5"
                fill={activeTick.isClamped ? "#FF3B30" : "#0A0A0A"}
                stroke="#FFFFFF"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {/* Floating Tooltip Box */}
        {hoverIndex !== null && activeTick && (
          <div
            className="pointer-events-none absolute top-2 rounded-xl border border-hairline bg-white/95 p-2.5 shadow-md backdrop-blur-md transition-all text-xs z-10 font-mono"
            style={{
              left: `${Math.min(
                Math.max(10, (hoverIndex / (ticks.length - 1)) * 100),
                70
              )}%`,
            }}
          >
            <p className="text-[10px] text-muted-foreground">{activeTick.timeLabel} · {selectedMarket}</p>
            <div className="mt-1 space-y-0.5 tabular text-[11px]">
              <div className="flex justify-between gap-4 font-semibold text-foreground">
                <span>Deviation:</span>
                <span className={activeTick.isClamped ? "text-loss font-bold" : "text-gain"}>
                  {activeTick.deviationBps >= 0 ? "+" : ""}{activeTick.deviationBps.toFixed(2)} bps
                </span>
              </div>
              <div className="flex justify-between gap-4 text-muted-foreground">
                <span>BBO Mid:</span>
                <span className="text-foreground">${fmtUsd(activeTick.midPx, 2)}</span>
              </div>
              <div className="flex justify-between gap-4 text-muted-foreground">
                <span>MarkPx:</span>
                <span className="text-foreground">${fmtUsd(activeTick.markPx, 2)}</span>
              </div>
              <div className="flex justify-between gap-4 text-muted-foreground pt-0.5 border-t border-hairline">
                <span>Execution Status:</span>
                <span className={activeTick.isClamped ? "text-loss font-bold" : "text-gain font-semibold"}>
                  {activeTick.isClamped ? "Clamped (Protected)" : "BBO Passthrough"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Corridor Stats Cards */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 border-t border-hairline pt-3">
        <div className="rounded-xl bg-[#F8F8F7] p-2">
          <p className="text-[9px] font-mono text-muted-foreground uppercase">Corridor Compliance</p>
          <p className="tabular mt-0.5 text-xs font-bold text-gain">99.78% inside limit</p>
        </div>
        <div className="rounded-xl bg-[#F8F8F7] p-2">
          <p className="text-[9px] font-mono text-muted-foreground uppercase">Recent Clamps (24H)</p>
          <p className="tabular mt-0.5 text-xs font-bold text-foreground font-mono">{clampedCount} spikes suppressed</p>
        </div>
        <div className="rounded-xl bg-[#F8F8F7] p-2">
          <p className="text-[9px] font-mono text-muted-foreground uppercase">Max Bound Offset</p>
          <p className="tabular mt-0.5 text-xs font-bold text-foreground font-mono">+1.48 bps</p>
        </div>
        <div className="rounded-xl bg-[#F8F8F7] p-2">
          <p className="text-[9px] font-mono text-muted-foreground uppercase">Protection</p>
          <p className="tabular mt-0.5 text-xs font-bold text-foreground">Zero Front-running MEV</p>
        </div>
      </div>
    </div>
  );
}
