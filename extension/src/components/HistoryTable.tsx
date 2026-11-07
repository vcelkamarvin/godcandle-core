import React from "react";
import { TradeFill } from "../types/trader";

interface HistoryTableProps {
  history: TradeFill[];
}

export const HistoryTable: React.FC<HistoryTableProps> = ({ history }) => {
  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " +
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatPrice = (p: number) => {
    if (p >= 1000) return "$" + p.toLocaleString("en-US", { maximumFractionDigits: 0 });
    if (p >= 1) return "$" + p.toFixed(2);
    return "$" + p.toFixed(4);
  };

  if (!history || history.length === 0) {
    return (
      <div style={{ padding: "28px 20px", textAlign: "center", color: "#A1A1AA", fontSize: "13px" }}>
        No recent fills found
      </div>
    );
  }

  return (
    <div style={{ padding: "0 20px" }}>
      {history.slice(0, 15).map((fill, idx) => {
        const isBuy = fill.side === "B";
        const hasRealized = fill.closedPnl !== 0;
        const isProfit = fill.closedPnl > 0;

        return (
          <div
            key={fill.tid || idx}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 0",
              borderBottom: "1px solid #F4F4F5"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontWeight: 700, fontSize: "13px", color: "#09090B" }}>
                {fill.coin}
              </span>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "1px 5px",
                  borderRadius: "4px",
                  backgroundColor: isBuy ? "#DCFCE7" : "#FEE2E2",
                  color: isBuy ? "#15803D" : "#B91C1C"
                }}
              >
                {isBuy ? "BUY" : "SELL"}
              </span>
              <span style={{ fontSize: "11px", color: "#A1A1AA" }}>
                {formatTime(fill.time)}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "12px", fontFamily: "monospace" }}>
              <span style={{ color: "#71717A" }}>
                {fill.sz} {fill.coin}
              </span>
              <span style={{ color: "#52525B" }}>
                {formatPrice(fill.px)}
              </span>
              {hasRealized ? (
                <span
                  style={{
                    fontWeight: 700,
                    color: isProfit ? "#16A34A" : "#DC2626",
                    minWidth: "60px",
                    textAlign: "right"
                  }}
                >
                  {isProfit ? "+" : ""}${Math.round(fill.closedPnl).toLocaleString()}
                </span>
              ) : (
                <span style={{ color: "#A1A1AA", minWidth: "60px", textAlign: "right" }}>
                  —
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
