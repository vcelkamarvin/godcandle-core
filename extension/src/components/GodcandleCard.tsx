import React, { useState } from "react";
import { TraderProfile } from "../types/trader";
import { AccountStats } from "./AccountStats";
import { PerformanceChart } from "./PerformanceChart";
import { PositionsTable } from "./PositionsTable";
import { SpotTable } from "./SpotTable";
import { HistoryTable } from "./HistoryTable";
import { DataStatus } from "./DataStatus";

interface GodcandleCardProps {
  username: string;
  walletAddress: string | null;
  profile: TraderProfile | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onConnectWallet?: (addr: string) => void;
}

export const GodcandleCard: React.FC<GodcandleCardProps> = ({
  username,
  walletAddress,
  profile,
  loading,
  error,
  onRefresh,
  onConnectWallet
}) => {
  const [activeTab, setActiveTab] = useState<"Perps" | "Spot" | "History">("Perps");
  const [chartPeriod, setChartPeriod] = useState<"7D" | "30D" | "ALL">("30D");
  const [inputWallet, setInputWallet] = useState("");

  const formatShortAddress = (addr: string | null) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Select performance points based on period
  const getChartPoints = () => {
    if (!profile) return [];
    if (chartPeriod === "7D") return profile.performance.week;
    if (chartPeriod === "30D") return profile.performance.month;
    return profile.performance.allTime;
  };

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "20px",
        boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        overflow: "hidden",
        width: "100%",
        maxWidth: "600px",
        margin: "0 auto",
        color: "#09090B",
        boxSizing: "border-box",
        position: "relative"
      }}
    >
      {/* Signature Pastel Rainbow Top Accent Bar */}
      <div
        style={{
          height: "3px",
          width: "100%",
          background: "linear-gradient(90deg, #FDE68A 0%, #F472B6 25%, #C084FC 50%, #60A5FA 75%, #34D399 100%)"
        }}
      />

      {/* 1. Header Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px 8px 20px"
        }}
      >
        {/* User Identity */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Gradient Orb Avatar */}
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #FF9A8B 0%, #FF6A88 55%, #FF99AC 100%)",
              boxShadow: "0 2px 6px rgba(255, 106, 136, 0.3)"
            }}
          />

          <span style={{ fontWeight: 700, fontSize: "16px", color: "#09090B" }}>
            {username.startsWith("@") ? username.slice(1) : username}
          </span>

          {walletAddress && (
            <a
              href={`https://godcandle-core.vercel.app/leaderboard/${walletAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: "11px",
                fontFamily: "monospace",
                color: "#71717A",
                backgroundColor: "#F4F4F5",
                padding: "2px 6px",
                borderRadius: "4px",
                textDecoration: "none",
                cursor: "pointer",
                transition: "color 0.15s ease"
              }}
              title={`View ${walletAddress} on Godcandle Leaderboard`}
            >
              {formatShortAddress(walletAddress)}
            </a>
          )}
        </div>

        {/* Brand & Exchange Link */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <a
            href={
              profile?.address || walletAddress
                ? `https://godcandle-core.vercel.app/leaderboard/${profile?.address || walletAddress}`
                : "https://godcandle-core.vercel.app/leaderboard"
            }
            target="_blank"
            rel="noopener noreferrer"
            title="Open Godcandle Trader Dossier"
            style={{
              fontWeight: 700,
              fontSize: "13px",
              letterSpacing: "-0.02em",
              color: "#09090B",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              textDecoration: "none"
            }}
          >
            godcandle <span style={{ fontSize: "11px", color: "#A1A1AA" }}>↗</span>
          </a>
        </div>
      </div>

      {/* 2. Body State: No Wallet Linked */}
      {!walletAddress ? (
        <div style={{ padding: "32px 20px", textAlign: "center" }}>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "#18181B" }}>
            Connect Hyperliquid Wallet
          </div>
          <div style={{ fontSize: "13px", color: "#71717A", marginTop: "4px", marginBottom: "16px" }}>
            No public Hyperliquid address is associated with @{username}
          </div>
          <div style={{ display: "flex", gap: "8px", maxWidth: "380px", margin: "0 auto" }}>
            <input
              type="text"
              placeholder="0x..."
              value={inputWallet}
              onChange={(e) => setInputWallet(e.target.value)}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #E4E4E7",
                fontSize: "13px",
                outline: "none"
              }}
            />
            <button
              onClick={() => {
                if (inputWallet.trim().startsWith("0x")) {
                  onConnectWallet?.(inputWallet.trim());
                }
              }}
              style={{
                backgroundColor: "#09090B",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "8px",
                padding: "8px 16px",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer"
              }}
            >
              Link
            </button>
          </div>
        </div>
      ) : loading && !profile ? (
        /* Loading skeleton */
        <div style={{ padding: "40px 20px", textAlign: "center", color: "#71717A", fontSize: "13px" }}>
          <div style={{ marginBottom: "8px", fontWeight: 500 }}>Connecting to Hyperliquid Mainnet...</div>
          <div style={{ fontSize: "12px", color: "#A1A1AA" }}>Fetching real clearinghouse state & fills</div>
        </div>
      ) : profile ? (
        <>
          {/* 3. Account Stats & Division Bar */}
          <AccountStats profile={profile} />

          {/* 4. Performance Sparkline Chart */}
          <div style={{ padding: "0 20px" }}>
            <PerformanceChart
              points={getChartPoints()}
              period={chartPeriod}
              onPeriodChange={setChartPeriod}
            />
          </div>

          {/* 5. Sub-navigation Tabs */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 20px 8px 20px",
              marginTop: "8px"
            }}
          >
            <div style={{ display: "flex", gap: "4px", background: "#F4F4F5", padding: "3px", borderRadius: "999px" }}>
              {(["Perps", "Spot", "History"] as const).map((tab) => {
                const isActive = activeTab === tab;
                const count =
                  tab === "Perps"
                    ? profile.positions.length
                    : tab === "Spot"
                    ? profile.spot.length
                    : profile.history.length;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      padding: "5px 14px",
                      borderRadius: "999px",
                      border: "none",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      backgroundColor: isActive ? "#09090B" : "transparent",
                      color: isActive ? "#FFFFFF" : "#71717A",
                      transition: "all 0.15s ease"
                    }}
                  >
                    {tab} {count > 0 && <span style={{ opacity: 0.8, fontSize: "11px" }}>({count})</span>}
                  </button>
                );
              })}
            </div>

            <span style={{ fontSize: "11px", color: "#A1A1AA", fontWeight: 500 }}>
              {activeTab === "Perps" ? "unrealised PnL · open perps" : activeTab === "Spot" ? "wallet balances" : "chronological fills"}
            </span>
          </div>

          {/* 6. Tab Content */}
          <div style={{ minHeight: "120px" }}>
            {activeTab === "Perps" && (
              <PositionsTable
                positions={profile.positions}
                longExposure={profile.stats.longExposure}
                shortExposure={profile.stats.shortExposure}
              />
            )}
            {activeTab === "Spot" && <SpotTable spot={profile.spot} />}
            {activeTab === "History" && <HistoryTable history={profile.history} />}
          </div>
        </>
      ) : (
        /* Error state */
        <div style={{ padding: "32px 20px", textAlign: "center" }}>
          <div style={{ color: "#EF4444", fontWeight: 600, fontSize: "14px" }}>
            {error || "Hyperliquid API Unavailable"}
          </div>
          <button
            onClick={onRefresh}
            style={{
              marginTop: "12px",
              padding: "6px 14px",
              borderRadius: "8px",
              border: "1px solid #E4E4E7",
              backgroundColor: "#FFFFFF",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* 7. Footer Status */}
      <DataStatus
        loading={loading}
        lastUpdated={profile?.lastUpdated}
        error={error}
        onRefresh={onRefresh}
      />
    </div>
  );
};
