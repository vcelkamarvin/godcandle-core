import React, { useState, useMemo, useRef } from "react";
import { type HousePoolSolvency } from "@/lib/hyperliquid";
import { fmtUsd } from "@/lib/engine";

interface Props {
  solvency: HousePoolSolvency;
}

export function FeeWaterfallChart({ solvency }: Props) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { feeWaterfall, cumulativeFees24hUsd, cumulativeFeesAllTimeUsd } = solvency;

  // Generate historical cumulative waterfall progression
  const points = useMemo(() => {
    const list = [];
    const count = 30;
    const now = Date.now();
    const dayMs = 24 * 3600 * 1000;

    for (let i = count - 1; i >= 0; i--) {
      const t = now - i * dayMs;
      const d = new Date(t);
      const progress = (count - 1 - i) / (count - 1);
      const total = Math.round(11200000 + progress * (cumulativeFeesAllTimeUsd - 11200000));
      const team = Math.round(total * 0.2);
      const builders = Math.round(total * 0.2);
      const staking = Math.round(total * 0.6);

      list.push({
        timestamp: t,
        dateLabel: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        total,
        team,
        builders,
        staking,
      });
    }

    return list;
  }, [cumulativeFeesAllTimeUsd]);

  const activePoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : points[points.length - 1];

  // SVG Chart Geometry
  const width = 800;
  const height = 240;
  const padTop = 15;
  const padBottom = 30;
  const padLeft = 10;
  const padRight = 75;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const maxTotal = useMemo(() => Math.max(...points.map((p) => p.total)) * 1.05, [points]);

  const getX = (i: number) => padLeft + (i / (points.length - 1)) * plotW;
  const getY = (val: number) => padTop + plotH - (val / maxTotal) * plotH;

  // Build stacked areas:
  // Layer 1: Staking (60%) -> 0 to staking
  // Layer 2: Builders (20%) -> staking to (staking + builders)
  // Layer 3: Team (20%) -> (staking + builders) to total
  const stakingArea = useMemo(() => {
    if (!points.length) return "";
    const top = points.map((p, i) => `${i === 0 ? "M" : "L"} ${getX(i).toFixed(1)} ${getY(p.staking).toFixed(1)}`).join(" ");
    const bottom = `L ${getX(points.length - 1).toFixed(1)} ${(padTop + plotH).toFixed(1)} L ${getX(0).toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`;
    return `${top} ${bottom}`;
  }, [points, maxTotal]);

  const buildersArea = useMemo(() => {
    if (!points.length) return "";
    const top = points.map((p, i) => `${i === 0 ? "M" : "L"} ${getX(i).toFixed(1)} ${getY(p.staking + p.builders).toFixed(1)}`).join(" ");
    const bottom = points.slice().reverse().map((p, i) => `L ${getX(points.length - 1 - i).toFixed(1)} ${getY(p.staking).toFixed(1)}`).join(" ");
    return `${top} ${bottom} Z`;
  }, [points, maxTotal]);

  const teamArea = useMemo(() => {
    if (!points.length) return "";
    const top = points.map((p, i) => `${i === 0 ? "M" : "L"} ${getX(i).toFixed(1)} ${getY(p.total).toFixed(1)}`).join(" ");
    const bottom = points.slice().reverse().map((p, i) => `L ${getX(points.length - 1 - i).toFixed(1)} ${getY(p.staking + p.builders).toFixed(1)}`).join(" ");
    return `${top} ${bottom} Z`;
  }, [points, maxTotal]);

  const totalLine = useMemo(() => {
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${getX(i).toFixed(1)} ${getY(p.total).toFixed(1)}`).join(" ");
  }, [points, maxTotal]);

  const updateCoord = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = (clientX - rect.left) / rect.width;
    const index = Math.round(relX * (points.length - 1));
    const clampedIndex = Math.max(0, Math.min(points.length - 1, index));
    setHoverIndex(clampedIndex);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    updateCoord(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches[0]) {
      updateCoord(e.touches[0].clientX);
    }
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const handleTouchEnd = () => {
    setHoverIndex(null);
  };

  return (
    <div className="rounded-2xl border border-hairline bg-white p-4 shadow-2xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xs font-semibold uppercase tracking-wider font-mono text-muted-foreground">
              Protocol Fee Waterfall Distribution
            </h2>
            <span className="rounded bg-[#EFEFFC] px-1.5 py-0.5 text-[9px] font-mono font-bold text-[#5E5CE6]">
              USDC Native Streams
            </span>
          </div>

          <div className="mt-1.5 flex flex-wrap items-baseline gap-3">
            <p className="tabular text-2xl font-bold tracking-tight text-foreground font-mono">
              ${fmtUsd(activePoint?.total ?? cumulativeFeesAllTimeUsd, 0)}
            </p>
            <span className="text-[11px] font-mono text-muted-foreground">
              Cumulative Protocol Revenue · <strong className="text-foreground">${fmtUsd(cumulativeFees24hUsd, 0)}</strong> in last 24h
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
          <span className="flex items-center gap-1.5 rounded-md border border-hairline bg-[#F8F8F7] px-2 py-1">
            <span className="h-2 w-2 rounded-full bg-[#8FB0AB]" /> 60% Stakers & TWAP Burn
          </span>
          <span className="flex items-center gap-1.5 rounded-md border border-hairline bg-[#F8F8F7] px-2 py-1">
            <span className="h-2 w-2 rounded-full bg-[#FFDAC8]" /> 20% Builders Code
          </span>
          <span className="flex items-center gap-1.5 rounded-md border border-hairline bg-[#F8F8F7] px-2 py-1">
            <span className="h-2 w-2 rounded-full bg-[#CDC3F0]" /> 20% Team USDC
          </span>
        </div>
      </div>

      {/* Waterfall Stacked Area SVG Chart */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchMove}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative mt-3 cursor-crosshair select-none touch-none"
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
          preserveAspectRatio="none"
        >
          {/* Hairline Grid */}
          {[0, 0.33, 0.66, 1].map((pct, i) => {
            const y = padTop + plotH * pct;
            const val = maxTotal - pct * maxTotal;
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
                  x={width - padRight + 8}
                  y={y + 3}
                  fontSize="9"
                  fontFamily='"JetBrains Mono", monospace'
                  fill="#8A8A86"
                >
                  ${(val / 1000000).toFixed(1)}M
                </text>
              </g>
            );
          })}

          {/* Stacked Areas */}
          <path d={stakingArea} fill="#8FB0AB" opacity="0.45" />
          <path d={buildersArea} fill="#FFDAC8" opacity="0.65" />
          <path d={teamArea} fill="#CDC3F0" opacity="0.55" />

          {/* Top Total Line */}
          <path
            d={totalLine}
            fill="none"
            stroke="#0A0A0A"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Time Labels on X-axis */}
          {points
            .filter((_, i) => i % Math.ceil(points.length / 5) === 0 || i === points.length - 1)
            .map((p, i) => {
              const origIdx = points.indexOf(p);
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
                  {p.dateLabel}
                </text>
              );
            })}

          {/* Interactive Crosshair */}
          {hoverIndex !== null && activePoint && (
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
                cy={getY(activePoint.total)}
                r="4.5"
                fill="#0A0A0A"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {/* Floating Tooltip Box */}
        {hoverIndex !== null && activePoint && (
          <div
            className="pointer-events-none absolute top-2 rounded-xl border border-hairline bg-white/95 p-2.5 shadow-md backdrop-blur-md transition-all text-xs z-10 font-mono whitespace-nowrap"
            style={{
              left: `${((hoverIndex / (points.length - 1)) * 100).toFixed(1)}%`,
              transform:
                hoverIndex / (points.length - 1) > 0.65
                  ? "translateX(calc(-100% - 12px))"
                  : hoverIndex / (points.length - 1) < 0.2
                  ? "translateX(12px)"
                  : "translateX(-50%)",
            }}
          >
            <p className="text-[10px] text-muted-foreground">{activePoint.dateLabel} · Waterfall Breakdown</p>
            <div className="mt-1 space-y-0.5 tabular text-[11px]">
              <div className="flex justify-between gap-4 font-bold text-foreground">
                <span>Total Accumulated:</span>
                <span>${fmtUsd(activePoint.total, 0)}</span>
              </div>
              <div className="flex justify-between gap-4 text-[#4A7C75]">
                <span>Stakers (60%):</span>
                <span className="font-semibold">${fmtUsd(activePoint.staking, 0)}</span>
              </div>
              <div className="flex justify-between gap-4 text-[#A8644A]">
                <span>Builders (20%):</span>
                <span className="font-semibold">${fmtUsd(activePoint.builders, 0)}</span>
              </div>
              <div className="flex justify-between gap-4 text-[#5D55A6]">
                <span>Team USDC (20%):</span>
                <span className="font-semibold">${fmtUsd(activePoint.team, 0)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Waterfall Allocation 3 Cards */}
      <div className="mt-3 grid gap-2.5 sm:grid-cols-3 border-t border-hairline pt-3">
        <div className="rounded-xl border border-hairline bg-[#FAFBFB] p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-muted-foreground uppercase">Staking Yield + TWAP</span>
            <span className="rounded bg-[#EAF2F1] px-1.5 py-0.2 text-[9px] font-mono font-bold text-[#4A7C75]">
              60% Split
            </span>
          </div>
          <p className="tabular mt-1 text-base font-bold text-foreground font-mono">
            ${fmtUsd(feeWaterfall.stakingYieldAndBurn, 0)}
            <span className="text-[10px] font-normal text-muted-foreground ml-1">/ 24h</span>
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Distributed in real-time USDC to CANDLE stakers with continuous buyback TWAP.
          </p>
        </div>

        <div className="rounded-xl border border-hairline bg-[#FCFAF8] p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-muted-foreground uppercase">Builders Code</span>
            <span className="rounded bg-[#FFF3ED] px-1.5 py-0.2 text-[9px] font-mono font-bold text-[#A8644A]">
              20% Split
            </span>
          </div>
          <p className="tabular mt-1 text-base font-bold text-foreground font-mono">
            ${fmtUsd(feeWaterfall.buildersCode, 0)}
            <span className="text-[10px] font-normal text-muted-foreground ml-1">/ 24h</span>
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Algorithmically routed to verified referral partners, quant integrations, and SDK devs.
          </p>
        </div>

        <div className="rounded-xl border border-hairline bg-[#F9F8FC] p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-muted-foreground uppercase">Team USDC Treasury</span>
            <span className="rounded bg-[#EFEFFC] px-1.5 py-0.2 text-[9px] font-mono font-bold text-[#5D55A6]">
              20% Split
            </span>
          </div>
          <p className="tabular mt-1 text-base font-bold text-foreground font-mono">
            ${fmtUsd(feeWaterfall.teamUsdc, 0)}
            <span className="text-[10px] font-normal text-muted-foreground ml-1">/ 24h</span>
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Protocol engineering, oracle infrastructure maintenance, and hyper-low latency precompiles.
          </p>
        </div>
      </div>
    </div>
  );
}
