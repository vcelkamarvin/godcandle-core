/**
 * Supabase Client & Paper Trading Persistence Layer
 * Provides sync with Supabase tables (paper_accounts, paper_positions, paper_trades, paper_equity_snapshots)
 * and exposes queries for the weekly_leaderboard view (Candle Cup hook).
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { useState, useEffect } from "react";
import type { EnginePosition, EngineClosedTrade } from "./engine/types";

export interface WeeklyLeaderboardEntry {
  trade_id: string;
  account_id: string;
  trader_identifier: string;
  asset: string;
  side: "long" | "short";
  leverage: number;
  margin: number;
  entry_price: number;
  exit_price: number;
  pnl: number;
  roi_pct: number;
  liquidated: boolean;
  closed_at: string;
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const url =
    (typeof process !== "undefined" && process.env?.["NEXT_PUBLIC_SUPABASE_URL"]) ||
    (typeof process !== "undefined" && process.env?.["VITE_SUPABASE_URL"]) ||
    (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_URL);

  const anonKey =
    (typeof process !== "undefined" && process.env?.["NEXT_PUBLIC_SUPABASE_ANON_KEY"]) ||
    (typeof process !== "undefined" && process.env?.["VITE_SUPABASE_ANON_KEY"]) ||
    (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY);

  if (url && anonKey) {
    try {
      supabaseInstance = createClient(url, anonKey);
    } catch (e) {
      console.warn("Failed to initialize Supabase client:", e);
    }
  }

  return supabaseInstance;
}

export async function syncPaperAccount(
  sessionId: string,
  walletAddress?: string | null
): Promise<{ id: string; balance: number; lastResetAt: number } | null> {
  const sb = getSupabase();
  if (!sb) return null;

  try {
    const { data: existing, error: selectErr } = await sb
      .from("paper_accounts")
      .select("id, balance, last_reset_at, wallet_address")
      .eq("session_id", sessionId)
      .maybeSingle();

    if (existing) {
      if (walletAddress && existing.wallet_address !== walletAddress) {
        await sb
          .from("paper_accounts")
          .update({ wallet_address: walletAddress, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
      }
      return {
        id: existing.id,
        balance: parseFloat(existing.balance) || 10000,
        lastResetAt: existing.last_reset_at ? new Date(existing.last_reset_at).getTime() : 0,
      };
    }

    const { data: created, error: insertErr } = await sb
      .from("paper_accounts")
      .insert({
        session_id: sessionId,
        wallet_address: walletAddress ?? null,
        balance: 10000,
      })
      .select("id, balance, last_reset_at")
      .single();

    if (created) {
      return {
        id: created.id,
        balance: parseFloat(created.balance) || 10000,
        lastResetAt: created.last_reset_at ? new Date(created.last_reset_at).getTime() : 0,
      };
    }
  } catch (err) {
    console.warn("Supabase paper account sync failed:", err);
  }
  return null;
}

export async function persistPaperPosition(
  accountId: string,
  pos: EnginePosition
): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;

  try {
    await sb.from("paper_positions").upsert({
      account_id: accountId,
      asset: pos.market,
      side: pos.side,
      margin: pos.stake,
      leverage: pos.leverage,
      notional: pos.stake * pos.leverage,
      entry_price: pos.entry,
      liq_price: pos.liqPrice ?? pos.liquidationPrice,
      tp_price: pos.tp ?? null,
      sl_price: pos.sl ?? null,
      opened_at: new Date(pos.openedAt).toISOString(),
      is_closed: false,
    });
  } catch (err) {
    console.warn("Supabase persist paper position failed:", err);
  }
}

export async function persistPaperCloseTrade(
  accountId: string,
  trade: EngineClosedTrade
): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;

  try {
    // 1. Mark position as closed if exists
    await sb
      .from("paper_positions")
      .update({
        is_closed: true,
        closed_at: new Date(trade.closedAt).toISOString(),
      })
      .eq("account_id", accountId)
      .eq("asset", trade.market)
      .eq("is_closed", false);

    // 2. Insert trade record
    await sb.from("paper_trades").insert({
      account_id: accountId,
      asset: trade.market,
      side: trade.side,
      margin: trade.stake,
      leverage: trade.leverage,
      notional: trade.stake * trade.leverage,
      entry_price: trade.entry,
      exit_price: trade.exit,
      pnl: trade.pnl,
      roi_pct: trade.roiPct,
      liquidated: trade.liquidated ?? false,
      opened_at: new Date(trade.openedAt).toISOString(),
      closed_at: new Date(trade.closedAt).toISOString(),
    });

    // 3. Update account balance
    const { data: acct } = await sb
      .from("paper_accounts")
      .select("balance")
      .eq("id", accountId)
      .single();
    if (acct) {
      const newBal = Math.max(0, parseFloat(acct.balance) + trade.pnl);
      await sb
        .from("paper_accounts")
        .update({ balance: newBal, updated_at: new Date().toISOString() })
        .eq("id", accountId);

      // 4. Record equity snapshot
      await sb.from("paper_equity_snapshots").insert({
        account_id: accountId,
        equity: newBal,
      });
    }
  } catch (err) {
    console.warn("Supabase persist trade failed:", err);
  }
}

export async function fetchWeeklyLeaderboard(): Promise<WeeklyLeaderboardEntry[]> {
  const sb = getSupabase();
  if (!sb) return [];

  try {
    const { data, error } = await sb
      .from("weekly_leaderboard")
      .select("*")
      .limit(50);

    if (error || !data) return [];
    return data as WeeklyLeaderboardEntry[];
  } catch {
    return [];
  }
}

export function useWeeklyLeaderboard() {
  const [data, setData] = useState<WeeklyLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const rows = await fetchWeeklyLeaderboard();
      if (active) {
        setData(rows);
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return { leaderboard: data, loading };
}
