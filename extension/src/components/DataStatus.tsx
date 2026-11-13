import React from "react";

interface DataStatusProps {
  loading: boolean;
  lastUpdated?: number;
  error?: string | null;
  onRefresh?: () => void;
}

export const DataStatus: React.FC<DataStatusProps> = ({
  loading,
  lastUpdated,
  error,
  onRefresh
}) => {
  const formatTime = (ts?: number) => {
    if (!ts) return "Just now";
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "6px 14px",
      background: "#FAFAFA",
      borderTop: "1px solid #F0F0F0",
      fontSize: "11px",
      color: "#737373",
      fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          backgroundColor: error ? "#EF4444" : loading ? "#F59E0B" : "#10B981",
          display: "inline-block"
        }} />
        <span style={{ fontWeight: 600, color: "#171717" }}>LIVE DATA</span>
        <span style={{ color: "#A3A3A3" }}>•</span>
        <span>HYPERLIQUID</span>
        {lastUpdated && <span>({formatTime(lastUpdated)})</span>}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {error && <span style={{ color: "#EF4444" }}>{error}</span>}
        <button
          onClick={onRefresh}
          disabled={loading}
          style={{
            background: "none",
            border: "none",
            cursor: loading ? "default" : "pointer",
            color: "#525252",
            fontSize: "11px",
            padding: "2px 6px",
            borderRadius: "4px",
            textDecoration: "underline"
          }}
        >
          {loading ? "Updating..." : "Refresh"}
        </button>
      </div>
    </div>
  );
};
