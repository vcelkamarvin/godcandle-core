import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { getUserMappings, saveUserMapping, removeUserMapping } from "../services/walletResolver";
import { profileWalletMap, ProfileMapping } from "../data/profileWalletMap";
import { isValidEvmAddress } from "../services/hyperliquidClient";

export const OptionsPage: React.FC = () => {
  const [mappings, setMappings] = useState<Record<string, ProfileMapping>>({});
  const [newHandle, setNewHandle] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadData = async () => {
    const user = await getUserMappings();
    setMappings({ ...profileWalletMap, ...user });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const handle = newHandle.trim().replace(/^@/, "");
    const address = newAddress.trim().toLowerCase();

    if (!handle) {
      setFeedback("Handle cannot be empty.");
      return;
    }
    if (!isValidEvmAddress(address)) {
      setFeedback("Invalid EVM address (must start with 0x and be 42 chars).");
      return;
    }

    await saveUserMapping(handle, {
      address,
      exchange: "hyperliquid",
      enabled: true
    });

    setNewHandle("");
    setNewAddress("");
    setFeedback(`Saved @${handle} -> ${address}`);
    await loadData();
  };

  const handleDelete = async (handle: string) => {
    await removeUserMapping(handle);
    await loadData();
  };

  return (
    <div style={{ maxWidth: "680px", margin: "40px auto", padding: "0 20px", fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #E4E4E7", paddingBottom: "16px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0, color: "#09090B" }}>
            Godcandle Settings
          </h1>
          <p style={{ color: "#71717A", fontSize: "14px", margin: "4px 0 0 0" }}>
            Manage Twitter/X handle to Hyperliquid wallet mappings.
          </p>
        </div>
        <span style={{ fontSize: "12px", background: "#F4F4F5", padding: "4px 8px", borderRadius: "6px", fontWeight: 600 }}>
          v1.0.0
        </span>
      </div>

      {/* Add new mapping form */}
      <form onSubmit={handleAdd} style={{ margin: "24px 0", padding: "20px", background: "#FAFAFA", borderRadius: "12px", border: "1px solid #E4E4E7" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 600, margin: "0 0 12px 0" }}>Add or Edit Mapping</h3>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="X Handle (e.g. Loracle)"
            value={newHandle}
            onChange={(e) => setNewHandle(e.target.value)}
            style={{ flex: 1, minWidth: "160px", padding: "8px 12px", borderRadius: "8px", border: "1px solid #D4D4D8", fontSize: "13px" }}
          />
          <input
            type="text"
            placeholder="Hyperliquid 0x Address"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            style={{ flex: 2, minWidth: "260px", padding: "8px 12px", borderRadius: "8px", border: "1px solid #D4D4D8", fontSize: "13px", fontFamily: "monospace" }}
          />
          <button
            type="submit"
            style={{ background: "#09090B", color: "#FFFFFF", padding: "8px 18px", borderRadius: "8px", border: "none", fontWeight: 600, cursor: "pointer", fontSize: "13px" }}
          >
            Save
          </button>
        </div>
        {feedback && (
          <div style={{ marginTop: "10px", fontSize: "12px", color: feedback.includes("Invalid") ? "#DC2626" : "#16A34A" }}>
            {feedback}
          </div>
        )}
      </form>

      {/* Existing mappings list */}
      <div>
        <h3 style={{ fontSize: "15px", fontWeight: 600, margin: "0 0 12px 0" }}>Active Mappings</h3>
        <div style={{ border: "1px solid #E4E4E7", borderRadius: "12px", overflow: "hidden" }}>
          {Object.entries(mappings).map(([handle, m]) => (
            <div
              key={handle}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                borderBottom: "1px solid #F4F4F5",
                background: "#FFFFFF"
              }}
            >
              <div>
                <span style={{ fontWeight: 600, fontSize: "14px", color: "#09090B" }}>@{handle}</span>
                <span style={{ marginLeft: "12px", fontSize: "12px", fontFamily: "monospace", color: "#71717A" }}>
                  {m.address}
                </span>
              </div>
              <button
                onClick={() => handleDelete(handle)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#EF4444",
                  fontSize: "12px",
                  cursor: "pointer",
                  padding: "4px 8px"
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const rootEl = document.getElementById("options-root");
if (rootEl) {
  const root = createRoot(rootEl);
  root.render(<OptionsPage />);
}
