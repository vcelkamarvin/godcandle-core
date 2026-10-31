/**
 * Supabase Edge Function: Paper Trading Server-Side Liquidation Worker
 * Subscribed to live Hyperliquid prices, continuously checking open paper positions
 * every second and executing authoritative server-side liquidations.
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const MMR_DEFAULT = 0.0004;

export function calculateLiqPrice(entry: number, leverage: number, side: "long" | "short", mmr = MMR_DEFAULT): number {
  const initialMarginRate = 1 / leverage;
  if (side === "long") {
    return entry * (1 - initialMarginRate + mmr);
  } else {
    return entry * (1 + initialMarginRate - mmr);
  }
}

export function checkIsLiquidated(mark: number, liqPrice: number, side: "long" | "short"): boolean {
  return side === "long" ? mark <= liqPrice : mark >= liqPrice;
}

serve(async (req: Request) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Parse marks passed or fetch latest mids from Hyperliquid
  let marks: Record<string, number> = {};
  try {
    const body = await req.json();
    marks = body.marks || {};
  } catch {
    // If called via cron / webhook without body, fetch mids from Hyperliquid
    try {
      const res = await fetch("https://api.hyperliquid.xyz/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "allMids" }),
      });
      marks = await res.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
    }
  }

  // Fetch all open positions
  const { data: openPositions, error } = await supabase
    .from("paper_positions")
    .select("*")
    .eq("is_closed", false);

  if (error || !openPositions) {
    return new Response(JSON.stringify({ error: error?.message }), { status: 500 });
  }

  const liquidatedIds: string[] = [];

  for (const pos of openPositions) {
    const rawAsset = pos.asset.replace("-USD", "");
    const mark = parseFloat(marks[rawAsset] as any) || parseFloat(marks[pos.asset] as any);
    if (!mark) continue;

    const liqPrice = parseFloat(pos.liq_price) || calculateLiqPrice(parseFloat(pos.entry_price), pos.leverage, pos.side);
    const isLiq = checkIsLiquidated(mark, liqPrice, pos.side);

    if (isLiq) {
      const margin = parseFloat(pos.margin);
      const notional = parseFloat(pos.notional);
      const entry = parseFloat(pos.entry_price);
      const exit = liqPrice;
      const pnl = -margin;
      const roi = -100;

      // Close position server-side
      await supabase
        .from("paper_positions")
        .update({
          is_closed: true,
          closed_at: new Date().toISOString(),
        })
        .eq("id", pos.id);

      // Insert server-authenticated trade record
      await supabase.from("paper_trades").insert({
        account_id: pos.account_id,
        position_id: pos.id,
        asset: pos.asset,
        side: pos.side,
        margin,
        leverage: pos.leverage,
        notional,
        entry_price: entry,
        exit_price: exit,
        pnl,
        roi_pct: roi,
        liquidated: true,
        opened_at: pos.opened_at,
        closed_at: new Date().toISOString(),
      });

      liquidatedIds.push(pos.id);
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      liquidatedCount: liquidatedIds.length,
      liquidatedIds,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});
