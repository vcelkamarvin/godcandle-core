import React, { useState, useMemo, useRef } from "react";
import {
  type Timeframe,
  type TimeSeriesMetricPoint,
  generateTimeSeriesData,
} from "@/lib/hyperliquid";
import { fmtUsd } from "@/lib/engine";

interface Props {
  currentTvl: number;
  currentVolume: number;
  liquidReserves: number;
  solvencyRatio: number;
}

export function HousePoolSolvencyChart({
  currentTvl,
  currentVolume,
  liquidReserves,
  solvencyRatio,
}: Props) {
  const [timeframe, setTimeframe] = useState<Timeframe>("30D");
  const [activeMetric, setActiveMetric] = useState<"tvl" | "solvency" | "netOi">("tvl");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const data = useMemo(() => {
    return generateTimeSeriesData(timeframe, currentTvl, currentVolume);
  }, [timeframe, currentTvl, currentVolume]);

  const activePoint = hoverIndex !== null && data[hoverIndex] ? data[hoverIndex] : data[data.length - 1];

  // SVG Chart Geometry
  const width = 800;
  const height = 300;
  const histHeight = 65;
  const padTop = 20;
  const padBottom = 35;
  const padLeft = 10;
  const padRight = 75;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom - histHeight - 15;

  // Compute Scales
  const values = useMemo(() => {
    if (activeMetric === "solvency") return data.map((d) => d.solvencyRatio);
    if (activeMetric === "netOi") return data.map((d) => d.netOi);
    return data.map((d) => d.tvl);
  }, [data, activeMetric]);

  const minVal = useMemo(() => Math.min(...values) * 0.96, [values]);
  const maxVal = useMemo(() => Math.max(...values) * 1.04, [values]);
  const maxVol = useMemo(() => Math.max(...data.map((d) => d.volume24h), 1), [data]);

  const getX = (index: number) => {
    return padLeft + (index / (data.length - 1)) * plotW;
  };

  const getY = (val: number) => {
    const norm = (val - minVal) / (maxVal - minVal || 1);
    return padTop + plotH - norm * plotH;
  };

  // Build SVG Path
  const mainPath = useMemo(() => {
    return data
      .map((d, i) => {
        const x = getX(i);
        const y = getY(
          activeMetric === "solvency"
            ? d.solvencyRatio
            : activeMetric === "netOi"
            ? d.netOi
            : d.tvl
        );
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  }, [data, activeMetric, minVal, maxVal]);

  const areaPath = useMemo(() => {
    if (!data.length) return "";
    const firstX = getX(0);
    const lastX = getX(data.length - 1);
    const bottomY = padTop + plotH;
    return `${mainPath} L ${lastX.toFixed(1)} ${bottomY} L ${firstX.toFixed(1)} ${bottomY} Z`;
  }, [mainPath, data]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const index = Math.round(relX * (data.length - 1));
    const clampedIndex = Math.max(0, Math.min(data.length - 1, index));
    setHoverIndex(clampedIndex);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  return (
    <div className="rounded-2xl border border-hairline bg-white p-4 shadow-2xs">
      {/* Chart Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xs font-semibold uppercase tracking-wider font-mono text-muted-foreground">
              House Pool Solvency & TVL
            </h2>
            <span className="rounded bg-[#EFEFFC] px-1.5 py-0.5 text-[9px] font-mono font-bold text-[#5E5CE6]">
              L1 Precompile
            </span>
          </div>

          <div className="mt-1.5 flex flex-wrap items-baseline gap-3">
            <p className="tabular text-2xl font-bold tracking-tight text-foreground">
              {activeMetric === "solvency"
                ? `${activePoint?.solvencyRatio ?? solvencyRatio}%`
                : `$${fmtUsd(activePoint?.tvl ?? currentTvl, 0)}`}
            </p>
            <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
              <span>Reserves: <strong className="text-foreground">${fmtUsd(activePoint?.liquidReserves ?? liquidReserves, 0)}</strong></span>
              <span>·</span>
              <span>Net OI: <strong className="text-foreground">${fmtUsd(activePoint?.netOi ?? 0, 0)}</strong></span>
              <span>·</span>
              <span className="text-gain font-semibold">100% Solvent</span>
            </div>
          </div>
        </div>

        {/* Control Pills: Metric switcher & Timeframes */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Metric Selector */}
          <div className="flex rounded-lg border border-hairline bg-[#F8F8F7] p-0.5 text-[10px] font-medium">
            {(
              [
                ["tvl", "TVL & House LP"],
                ["solvency", "Solvency %"],
                ["netOi", "Net OI"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveMetric(key)}
                className={`rounded-md px-2.5 py-1 transition-all ${
                  activeMetric === key
                    ? "bg-white font-semibold text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Timeframe Selector */}
          <div className="flex rounded-lg border border-hairline bg-[#F8F8F7] p-0.5 text-[10px] font-mono font-medium">
            {(["24H", "7D", "30D", "1Y", "ALL"] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`rounded-md px-2 py-1 transition-all ${
                  timeframe === tf
                    ? "bg-foreground font-bold text-white shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Chart Area */}
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
            {/* Rainbow pastel gradient fill */}
            <linearGradient id="tvlGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#CDC3F0" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#FFDAC8" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#A0D4CA" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="volBarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#CDC3F0" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#E6E6E3" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Grid Hairlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = padTop + plotH * pct;
            const val = maxVal - pct * (maxVal - minVal);
            return (
              <g key={i}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#E6E6E3"
                  strokeWidth="1"
                  strokeDasharray="2 3"
                />
                <text
                  x={width - padRight + 10}
                  y={y + 3}
                  fontSize="9"
                  fontFamily='"JetBrains Mono", monospace'
                  fill="#8A8A86"
                >
                  {activeMetric === "solvency"
                    ? `${val.toFixed(0)}%`
                    : `$${(val / 1000000).toFixed(2)}M`}
                </text>
              </g>
            );
          })}

          {/* Histogram Baseline & Label */}
          <line
            x1={padLeft}
            y1={height - padBottom}
            x2={width - padRight}
            y2={height - padBottom}
            stroke="#E6E6E3"
            strokeWidth="1"
          />
          <text
            x={width - padRight + 10}
            y={height - padBottom - 18}
            fontSize="8"
            fontFamily='"JetBrains Mono", monospace'
            fill="#8A8A86"
          >
            VOL (24H)
          </text>

          {/* Volume Histogram Bars */}
          {data.map((d, i) => {
            const barW = Math.max(3, plotW / data.length - 3);
            const barH = (d.volume24h / maxVol) * histHeight;
            const x = getX(i) - barW / 2;
            const y = height - padBottom - barH;
            const isHovered = hoverIndex === i;

            return (
              <rect
                key={i}
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx="2"
                fill={isHovered ? "#0A0A0A" : "url(#volBarGradient)"}
                className="transition-colors duration-150"
              />
            );
          })}

          {/* Area Fill */}
          <path d={areaPath} fill="url(#tvlGradient)" />

          {/* Main Line */}
          <path
            d={mainPath}
            fill="none"
            stroke="#0A0A0A"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* X Axis Time Labels */}
          {data
            .filter((_, i) => i % Math.ceil(data.length / 6) === 0 || i === data.length - 1)
            .map((d, i) => {
              const originalIndex = data.indexOf(d);
              return (
                <text
                  key={i}
                  x={getX(originalIndex)}
                  y={height - 10}
                  textAnchor="middle"
                  fontSize="9"
                  fontFamily='"JetBrains Mono", monospace'
                  fill="#8A8A86"
                >
                  {d.dateLabel}
                </text>
              );
            })}

          {/* Interactive Crosshair & Hover Tooltip */}
          {hoverIndex !== null && activePoint && (
            <g>
              {/* Vertical Hairline */}
              <line
                x1={getX(hoverIndex)}
                y1={padTop}
                x2={getX(hoverIndex)}
                y2={height - padBottom}
                stroke="#0A0A0A"
                strokeWidth="1"
                strokeDasharray="3 3"
              />

              {/* Indicator Dot on Curve */}
              <circle
                cx={getX(hoverIndex)}
                cy={getY(
                  activeMetric === "solvency"
                    ? activePoint.solvencyRatio
                    : activeMetric === "netOi"
                    ? activePoint.netOi
                    : activePoint.tvl
                )}
                r="5"
                fill="#0A0A0A"
                stroke="#FFFFFF"
                strokeWidth="2"
              />

              {/* Glowing Outer Halo */}
              <circle
                cx={getX(hoverIndex)}
                cy={getY(
                  activeMetric === "solvency"
                    ? activePoint.solvencyRatio
                    : activeMetric === "netOi"
                    ? activePoint.netOi
                    : activePoint.tvl
                )}
                r="9"
                fill="#CDC3F0"
                opacity="0.5"
              />
            </g>
          )}
        </svg>

        {/* Floating Tooltip Box */}
        {hoverIndex !== null && activePoint && (
          <div
            className="pointer-events-none absolute top-2 rounded-xl border border-hairline bg-white/95 p-2.5 shadow-md backdrop-blur-md transition-all text-xs z-10"
            style={{
              left: `${Math.min(
                Math.max(10, (hoverIndex / (data.length - 1)) * 100),
                70
              )}%`,
            }}
          >
            <p className="font-mono text-[10px] text-muted-foreground">{activePoint.dateLabel}</p>
            <div className="mt-1 space-y-0.5 tabular text-[11px]">
              <div className="flex justify-between gap-4 font-semibold text-foreground">
                <span>House Pool TVL:</span>
                <span>${fmtUsd(activePoint.tvl, 0)}</span>
              </div>
              <div className="flex justify-between gap-4 text-muted-foreground">
                <span>Liquid Reserves:</span>
                <span className="font-medium text-foreground">${fmtUsd(activePoint.liquidReserves, 0)}</span>
              </div>
              <div className="flex justify-between gap-4 text-muted-foreground">
                <span>Net OI Exposure:</span>
                <span className="font-medium text-foreground">${fmtUsd(activePoint.netOi, 0)}</span>
              </div>
              <div className="flex justify-between gap-4 text-muted-foreground">
                <span>Solvency Ratio:</span>
                <span className="font-bold text-gain">{activePoint.solvencyRatio}%</span>
              </div>
              <div className="flex justify-between gap-4 text-muted-foreground pt-0.5 border-t border-hairline">
                <span>Volume:</span>
                <span className="font-mono text-foreground">${fmtUsd(activePoint.volume24h, 0)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chart Footer Highlights */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-hairline pt-2 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-foreground" /> TVL Curve
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-xs bg-[#CDC3F0]" /> Volume Histogram
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Solvency Cap: 300%
          </span>
        </div>
        <div className="font-mono">
          Settlement Priority: <strong className="text-foreground">Atomic Block Return (0 Debt)</strong>
        </div>
      </div>
    </div>
  );
}
