import React from "react";
import { PerpPosition } from "../types/trader";

interface PositionsTableProps {
  positions: PerpPosition[];
  longExposure: number;
  shortExposure: number;
}

export const PositionsTable: React.FC<PositionsTableProps> = ({
  positions,
  longExposure,
  shortExposure
}) => {
  const formatPrice = (p: number | null) => {
    if (p === null) return "N/A";
    if (p >= 1000) return "$" + p.toLocaleString("en-US", { maximumFractionDigits: 0 });
    if (p >= 1) return "$" + p.toFixed(2);
    return "$" + p.toFixed(4);
  };

  const formatUsd = (num: number) => {
    if (num >= 1_000_000) return "$" + (num / 1_000_000).toFixed(1) + "M";
    if (num >= 1_000) return "$" + (num / 1_000).toFixed(1) + "K";
    return "$" + num.toFixed(0);
  };

  const netExposure = longExposure - shortExposure;
  const isNetLong = netExposure >= 0;

  if (positions.length === 0) {
    return (
      <div style={{ padding: "28px 20px", textAlign: "center", color: "#A1A1AA", fontSize: "13px" }}>
        No open perpetual positions
      </div>
    );
  }

  return (
    <div>
      <div style={{ padding: "0 20px" }}>
        {positions.map((pos) => {
          const isLong = pos.side === "LONG";
          const isProfit = pos.unrealizedPnl >= 0;
          return (
            <div
              key={pos.coin}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 0",
                borderBottom: "1px solid #F4F4F5"
              }}
            >
              {/* Asset & Direction & Leverage */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontWeight: 700, fontSize: "14px", color: "#09090B" }}>
                  {pos.coin}
                </span>

                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: "4px",
                    backgroundColor: isLong ? "#DCFCE7" : "#FEE2E2",
                    color: isLong ? "#15803D" : "#B91C1C",
                    letterSpacing: "0.03em"
                  }}
                >
                  {pos.side}
                </span>

                <span style={{ fontSize: "12px", color: "#71717A", fontWeight: 500 }}>
                  {pos.leverage}×
                </span>
              </div>

              {/* Quantity, Entry -> Mark, and PnL */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "12px", fontFamily: "monospace" }}>
                <span style={{ color: "#71717A" }}>
                  {pos.size < 10 ? pos.size.toFixed(2) : pos.size >= 1000 ? (pos.size / 1000).toFixed(1) + "K" : pos.size.toFixed(0)} {pos.coin}
                </span>

                <span style={{ color: "#52525B" }}>
                  {formatPrice(pos.entryPrice)} → {formatPrice(pos.markPrice)}
                </span>

                <span
                  style={{
                    fontWeight: 700,
                    color: isProfit ? "#16A34A" : "#DC2626",
                    minWidth: "60px",
                    textAlign: "right"
                  }}
                >
                  {isProfit ? "+" : ""}${Math.round(pos.unrealizedPnl).toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Open Exposure footer summary */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 20px",
          marginTop: "4px",
          fontSize: "11px",
          color: "#71717A",
          backgroundColor: "#FAFAFA",
          borderTop: "1px solid #F4F4F5"
        }}
      >
        <span style={{ fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
          Open Exposure
        </span>
        <span>
          Long <strong style={{ color: "#09090B" }}>{formatUsd(longExposure)}</strong> · Short <strong style={{ color: "#09090B" }}>{formatUsd(shortExposure)}</strong> · Net {isNetLong ? "long" : "short"} <strong style={{ color: "#09090B" }}>{formatUsd(Math.abs(netExposure))}</strong>
        </span>
      </div>
    </div>
  );
};
