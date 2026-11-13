import React from "react";
import { TraderProfile } from "../types/trader";

interface AccountStatsProps {
  profile: TraderProfile;
}

export const AccountStats: React.FC<AccountStatsProps> = ({ profile }) => {
  const formatUsd = (num: number) => {
    return "$" + Math.round(num).toLocaleString("en-US");
  };

  const formatShortUsd = (num: number | null) => {
    if (num === null) return "N/A";
    if (num >= 1_000_000_000) return "$" + (num / 1_000_000_000).toFixed(1) + "B";
    if (num >= 1_000_000) return "$" + (num / 1_000_000).toFixed(1) + "M";
    if (num >= 1_000) return "$" + (num / 1_000).toFixed(1) + "K";
    return "$" + num.toFixed(0);
  };

  const formatPercent = (val: number | null) => {
    if (val === null) return "N/A";
    return val.toFixed(1) + "%";
  };

  const perpEquity = profile.account.perpEquity;
  const spotValue = profile.account.spotValue || 0;
  const totalValue = profile.account.totalAccountValue;
  const perpRatio = totalValue > 0 ? Math.round((perpEquity / totalValue) * 100) : 100;
  const spotRatio = 100 - perpRatio;

  return (
    <div style={{ padding: "0 20px" }}>
      {/* Top numbers row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: "12px" }}>
        {/* Left: Account Size */}
        <div>
          <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em", color: "#737373", textTransform: "uppercase" }}>
            Account Size · AUM
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "4px" }}>
            <span style={{ fontSize: "32px", fontWeight: 700, color: "#0A0A0A", letterSpacing: "-0.03em" }}>
              {formatUsd(totalValue)}
            </span>
          </div>
        </div>

        {/* Right side stats grid */}
        <div style={{ display: "flex", gap: "28px" }}>
          {/* Col 1 */}
          <div>
            <div style={{ fontSize: "10px", fontWeight: 600, color: "#8E8E93", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Closed
            </div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#111", marginTop: "2px" }}>
              {profile.stats.closedTrades !== null ? profile.stats.closedTrades.toLocaleString() : "N/A"}
            </div>

            <div style={{ fontSize: "10px", fontWeight: 600, color: "#8E8E93", letterSpacing: "0.05em", textTransform: "uppercase", marginTop: "10px" }}>
              Win Rate
            </div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#111", marginTop: "2px" }}>
              {formatPercent(profile.stats.winRate)}
            </div>

            <div style={{ fontSize: "10px", fontWeight: 600, color: "#8E8E93", letterSpacing: "0.05em", textTransform: "uppercase", marginTop: "10px" }}>
              Profit Factor
            </div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#111", marginTop: "2px" }}>
              {profile.stats.profitFactor !== null ? profile.stats.profitFactor : "N/A"}
            </div>
          </div>

          {/* Col 2 */}
          <div>
            <div style={{ fontSize: "10px", fontWeight: 600, color: "#8E8E93", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Volume
            </div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#111", marginTop: "2px" }}>
              {formatShortUsd(profile.stats.volume)}
            </div>

            <div style={{ fontSize: "10px", fontWeight: 600, color: "#8E8E93", letterSpacing: "0.05em", textTransform: "uppercase", marginTop: "10px" }}>
              L / S
            </div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#111", marginTop: "2px" }}>
              {profile.stats.longRatio} / {profile.stats.shortRatio}
            </div>

            <div style={{ fontSize: "10px", fontWeight: 600, color: "#8E8E93", letterSpacing: "0.05em", textTransform: "uppercase", marginTop: "10px" }}>
              Max Drawdown
            </div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#EF4444", marginTop: "2px" }}>
              {profile.stats.maxDrawdown !== null ? `-${profile.stats.maxDrawdown}%` : "N/A"}
            </div>
          </div>
        </div>
      </div>

      {/* Asset Division Progress Bar (Perps vs Spot) */}
      <div style={{ marginTop: "14px" }}>
        <div style={{
          display: "flex",
          height: "6px",
          borderRadius: "999px",
          overflow: "hidden",
          backgroundColor: "#F4F4F5",
          width: "100%"
        }}>
          <div style={{
            width: `${perpRatio}%`,
            backgroundColor: "#09090B",
            borderRadius: "999px 0 0 999px"
          }} />
          {spotRatio > 0 && (
            <div style={{
              width: `${spotRatio}%`,
              background: "linear-gradient(90deg, #FBCFE8 0%, #BAE6FD 50%, #A7F3D0 100%)",
              borderRadius: "0 999px 999px 0"
            }} />
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "6px", fontSize: "12px", color: "#71717A" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#09090B", display: "inline-block" }} />
            <span>Perps {formatShortUsd(perpEquity)} · {perpRatio}%</span>
          </div>
          {spotValue > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "linear-gradient(135deg, #EC4899, #06B6D4)", display: "inline-block" }} />
              <span>Spot {formatShortUsd(spotValue)} · {spotRatio}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
