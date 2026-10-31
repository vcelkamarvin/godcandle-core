import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { type MarketSymbol, type HyperliquidMarketData } from "@/lib/hyperliquid";
import { fmtUsd } from "@/lib/engine";

interface Props {
  markets: Record<MarketSymbol, HyperliquidMarketData>;
  totalVolume: number;
  totalOi: number;
}

const MARKET_COLORS: Record<MarketSymbol, string> = {
  BTC: "#0A0A0A",
  ETH: "#627EEA",
  SOL: "#14F195",
  HYPE: "#CDC3F0",
  SPX: "#FF9500",
  DOGE: "#FFD60A",
};

export function PerpsBreakdownChart({
  markets,
  totalVolume,
  totalOi,
}: Props) {
  const [metric, setMetric] = useState<"volume" | "oi">("volume");
  const [hoverMarket, setHoverMarket] = useState<MarketSymbol | null>(null);

  const marketList = Object.values(markets);

  return (
    <div className="rounded-2xl border border-hairline bg-white p-4 shadow-2xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xs font-semibold uppercase tracking-wider font-mono text-muted-foreground">
              Perps Volume & Open Interest Breakdown
            </h2>
            <span className="rounded bg-[#EFEFFC] px-1.5 py-0.5 text-[9px] font-mono font-bold text-[#5E5CE6]">
              6 Core Markets
            </span>
          </div>

          <div className="mt-1.5 flex flex-wrap items-baseline gap-3">
            <p className="tabular text-2xl font-bold tracking-tight text-foreground font-mono">
              ${fmtUsd(metric === "volume" ? totalVolume : totalOi, 0)}
            </p>
            <span className="text-[11px] font-mono text-muted-foreground">
              Total {metric === "volume" ? "24h Volume across all perps" : "Open Interest aggregate"}
            </span>
          </div>
        </div>

        {/* Metric Switcher */}
        <div className="flex rounded-lg border border-hairline bg-[#F8F8F7] p-0.5 text-[10px] font-mono font-medium">
          <button
            type="button"
            onClick={() => setMetric("volume")}
            className={`rounded-md px-3 py-1 transition-all ${
              metric === "volume"
                ? "bg-foreground font-bold text-white shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            24H VOLUME
          </button>
          <button
            type="button"
            onClick={() => setMetric("oi")}
            className={`rounded-md px-3 py-1 transition-all ${
              metric === "oi"
                ? "bg-foreground font-bold text-white shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            OPEN INTEREST
          </button>
        </div>
      </div>

      {/* Stacked Proportional Distribution Bar */}
      <div className="mt-4">
        <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-1.5">
          <span>Market Share Allocation</span>
          <span>100% of L1 Perp Flow</span>
        </div>

        <div className="flex h-5 w-full overflow-hidden rounded-lg bg-[#F8F8F7] p-0.5 border border-hairline">
          {marketList.map((m) => {
            const val = metric === "volume" ? m.volume24hUsd : m.openInterestUsd;
            const total = metric === "volume" ? totalVolume : totalOi;
            const sharePct = (val / Math.max(1, total)) * 100;
            const isHovered = hoverMarket === m.symbol;

            return (
              <div
                key={m.symbol}
                onMouseEnter={() => setHoverMarket(m.symbol)}
                onMouseLeave={() => setHoverMarket(null)}
                className="h-full cursor-pointer transition-all duration-200 first:rounded-l last:rounded-r relative group"
                style={{
                  width: `${sharePct}%`,
                  backgroundColor: MARKET_COLORS[m.symbol],
                  opacity: hoverMarket && !isHovered ? 0.35 : 1,
                }}
              >
                {sharePct > 7 && (
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold text-white truncate px-1">
                    {m.symbol} {sharePct.toFixed(0)}%
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Markets Technical Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-hairline text-[10px] text-muted-foreground uppercase">
              <th className="pb-2 font-medium">Market</th>
              <th className="pb-2 font-medium text-right">Mark Price</th>
              <th className="pb-2 font-medium text-right">24h Chg</th>
              <th className="pb-2 font-medium text-right">24h Volume</th>
              <th className="pb-2 font-medium text-right">Open Interest</th>
              <th className="pb-2 font-medium text-right">Funding (1h / APR)</th>
              <th className="pb-2 font-medium text-right">Max Lev</th>
              <th className="pb-2 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {marketList.map((m) => {
              const val = metric === "volume" ? m.volume24hUsd : m.openInterestUsd;
              const total = metric === "volume" ? totalVolume : totalOi;
              const share = ((val / Math.max(1, total)) * 100).toFixed(1);
              const isHovered = hoverMarket === m.symbol;

              return (
                <tr
                  key={m.symbol}
                  onMouseEnter={() => setHoverMarket(m.symbol)}
                  onMouseLeave={() => setHoverMarket(null)}
                  className={`transition-colors ${
                    isHovered ? "bg-[#F8F8F7]" : "hover:bg-[#FAFAF9]"
                  }`}
                >
                  <td className="py-2.5 font-sans">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: MARKET_COLORS[m.symbol] }}
                      />
                      <span className="font-semibold text-foreground">{m.symbol}</span>
                      <span className="text-[10px] text-muted-foreground">{m.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-right font-medium tabular text-foreground">
                    ${fmtUsd(m.markPx, 2)}
                  </td>
                  <td
                    className={`py-2.5 text-right font-medium tabular ${
                      m.change24h >= 0 ? "text-gain" : "text-loss"
                    }`}
                  >
                    {m.change24h >= 0 ? "+" : ""}{m.change24h.toFixed(2)}%
                  </td>
                  <td className="py-2.5 text-right tabular text-foreground">
                    ${fmtUsd(m.volume24hUsd, 0)}
                    <span className="ml-1 text-[10px] text-muted-foreground font-mono">
                      ({((m.volume24hUsd / Math.max(1, totalVolume)) * 100).toFixed(1)}%)
                    </span>
                  </td>
                  <td className="py-2.5 text-right tabular text-foreground">
                    ${fmtUsd(m.openInterestUsd, 0)}
                    <span className="ml-1 text-[10px] text-muted-foreground font-mono">
                      ({((m.openInterestUsd / Math.max(1, totalOi)) * 100).toFixed(1)}%)
                    </span>
                  </td>
                  <td className="py-2.5 text-right tabular text-muted-foreground">
                    <span className="text-foreground">{m.fundingRatePct}</span>
                    <span className="text-[10px] text-muted-foreground ml-1">
                      ({m.fundingAprPct})
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-foreground">
                      {m.maxLeverage}x
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-sans">
                    <Link
                      to="/"
                      className="pill pill-ink px-2.5 py-1 text-[10px] font-semibold"
                    >
                      Trade
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
