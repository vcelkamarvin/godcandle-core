import React, { useId } from "react";
import { PnlPoint } from "../types/trader";

interface PerformanceChartProps {
  points: PnlPoint[];
  period: "7D" | "30D" | "ALL";
  onPeriodChange: (p: "7D" | "30D" | "ALL") => void;
}

interface Point {
  x: number;
  y: number;
}

/**
 * Generates an SVG path data string using cubic Bezier curves (Catmull-Rom to cubic Bezier conversion).
 * This ensures an organic, sleek, smooth curve passing naturally through all data points.
 */
function buildSmoothSpline(pts: Point[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  if (pts.length === 2) {
    return `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)} L ${pts[1].x.toFixed(1)},${pts[1].y.toFixed(1)}`;
  }

  let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  const k = 0.2; // Smoothing tension factor

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = i > 0 ? pts[i - 1] : pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = i !== pts.length - 2 ? pts[i + 2] : p2;

    const cp1x = p1.x + (p2.x - p0.x) * k;
    const cp1y = p1.y + (p2.y - p0.y) * k;

    const cp2x = p2.x - (p3.x - p1.x) * k;
    const cp2y = p2.y - (p3.y - p1.y) * k;

    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }

  return d;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  points,
  period,
  onPeriodChange
}) => {
  const gradientId = useId();

  // If points are empty or fewer than 2, show empty or flat line
  const hasData = points && points.length >= 2;

  let pathD = "";
  let areaD = "";
  let pnlChange = 0;

  const width = 560; // 560 units wide for ultra-crisp responsive viewBox
  const height = 100;
  const paddingX = 4;
  const paddingTop = 12;
  const paddingBottom = 10;

  if (hasData) {
    const values = points.map((p) => p.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal === 0 ? 1 : maxVal - minVal;

    const first = values[0];
    const last = values[values.length - 1];
    pnlChange = last - first;

    const availableWidth = width - paddingX * 2;
    const availableHeight = height - paddingTop - paddingBottom;

    const chartPoints: Point[] = points.map((p, i) => {
      const x = paddingX + (i / (points.length - 1)) * availableWidth;
      const y = height - paddingBottom - ((p.value - minVal) / range) * availableHeight;
      return { x, y };
    });

    pathD = buildSmoothSpline(chartPoints);
    const firstPt = chartPoints[0];
    const lastPt = chartPoints[chartPoints.length - 1];
    areaD = `${pathD} L ${lastPt.x.toFixed(1)},${height} L ${firstPt.x.toFixed(1)},${height} Z`;
  }

  const isPositive = pnlChange >= 0;
  const strokeColor = isPositive ? "#10B981" : "#EF4444";
  const startFillOpacity = isPositive ? 0.22 : 0.20;

  // Format PnL badge string (e.g. +$8.2M or +$12,450)
  const formatPnlValue = (val: number) => {
    const abs = Math.abs(val);
    const sign = val >= 0 ? "+" : "-";
    if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(1)}B`;
    if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`;
    return `${sign}$${Math.round(abs).toLocaleString("en-US")}`;
  };

  return (
    <div style={{ marginTop: "14px", position: "relative" }}>
      {/* Chart Period Selector & PnL pill */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "8px"
        }}
      >
        {hasData ? (
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              padding: "3px 8px",
              borderRadius: "6px",
              backgroundColor: isPositive ? "rgba(16, 185, 129, 0.10)" : "rgba(239, 68, 68, 0.10)",
              color: strokeColor,
              letterSpacing: "-0.01em",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px"
            }}
          >
            {formatPnlValue(pnlChange)} · {period}
          </span>
        ) : (
          <div />
        )}

        {/* 7D, 30D, ALL Buttons */}
        <div
          style={{
            display: "flex",
            backgroundColor: "#F4F4F5",
            padding: "2px",
            borderRadius: "999px",
            gap: "2px"
          }}
        >
          {(["7D", "30D", "ALL"] as const).map((p) => {
            const isActive = period === p;
            return (
              <button
                key={p}
                onClick={() => onPeriodChange(p)}
                style={{
                  padding: "3px 10px",
                  borderRadius: "999px",
                  border: "none",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                  backgroundColor: isActive ? "#09090B" : "transparent",
                  color: isActive ? "#FFFFFF" : "#71717A",
                  transition: "all 0.15s ease"
                }}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Smooth Cubic Bezier Sparkline */}
      <div style={{ width: "100%", height: `${height}px`, overflow: "hidden" }}>
        {hasData ? (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            style={{ width: "100%", height: "100%", overflow: "visible", display: "block" }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity={startFillOpacity} />
                <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <path d={areaD} fill={`url(#${gradientId})`} />
            <path
              d={pathD}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#A1A1AA",
              fontSize: "12px"
            }}
          >
            No historical PnL curve recorded
          </div>
        )}
      </div>
    </div>
  );
};
