import React from "react";
import { SpotHolding } from "../types/trader";

interface SpotTableProps {
  spot: SpotHolding[];
}

export const SpotTable: React.FC<SpotTableProps> = ({ spot }) => {
  const formatPrice = (p: number | null) => {
    if (p === null) return "N/A";
    if (p >= 1000) return "$" + p.toLocaleString("en-US", { maximumFractionDigits: 0 });
    if (p >= 1) return "$" + p.toFixed(2);
    return "$" + p.toFixed(4);
  };

  const formatUsd = (num: number | null) => {
    if (num === null) return "N/A";
    return "$" + num.toLocaleString("en-US", { maximumFractionDigits: 2 });
  };

  if (!spot || spot.length === 0) {
    return (
      <div style={{ padding: "28px 20px", textAlign: "center", color: "#A1A1AA", fontSize: "13px" }}>
        No spot holdings detected on Hyperliquid
      </div>
    );
  }

  return (
    <div style={{ padding: "0 20px" }}>
      {spot.map((item) => (
        <div
          key={item.coin}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 0",
            borderBottom: "1px solid #F4F4F5"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontWeight: 700, fontSize: "14px", color: "#09090B" }}>
              {item.coin}
            </span>
            <span style={{ fontSize: "11px", color: "#71717A", background: "#F4F4F5", padding: "1px 6px", borderRadius: "4px" }}>
              Spot
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "12px", fontFamily: "monospace" }}>
            <span style={{ color: "#71717A" }}>
              {item.total.toLocaleString("en-US", { maximumFractionDigits: 4 })} {item.coin}
            </span>
            <span style={{ color: "#52525B" }}>
              {formatPrice(item.currentPrice)}
            </span>
            <span style={{ fontWeight: 600, color: "#09090B", minWidth: "60px", textAlign: "right" }}>
              {formatUsd(item.value)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
