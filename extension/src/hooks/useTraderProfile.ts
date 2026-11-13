import { useState, useEffect, useCallback } from "react";
import { TraderProfile } from "../types/trader";

export function useTraderProfile(address: string | null) {
  const [profile, setProfile] = useState<TraderProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async (targetAddress: string) => {
    setLoading(true);
    setError(null);

    try {
      if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage(
          { type: "FETCH_TRADER_PROFILE", address: targetAddress },
          (response) => {
            setLoading(false);
            if (response && response.success) {
              setProfile(response.data);
            } else {
              setError(response?.error || "Failed to fetch trader profile from Hyperliquid");
            }
          }
        );
      } else {
        // Fallback directly via service in dev/test
        const { fetchTraderProfile } = await import("../services/hyperliquidDataProvider");
        const data = await fetchTraderProfile(targetAddress);
        setProfile(data);
        setLoading(false);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching profile");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!address) {
      setProfile(null);
      setLoading(false);
      setError(null);
      return;
    }

    loadProfile(address);

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadProfile(address);
    }, 30000);

    return () => clearInterval(interval);
  }, [address, loadProfile]);

  return { profile, loading, error, refresh: () => address && loadProfile(address) };
}
