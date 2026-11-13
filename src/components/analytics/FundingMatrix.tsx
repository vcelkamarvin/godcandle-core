import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { MarketLogo } from "@/components/godcandle/MarketLogo";
import { ALL_MARKETS, getMarket, type MarketSymbol } from "@/config/markets";
import { fmtUsd } from "@/lib/engine";
import { ArrowUpRight, TrendingUp, TrendingDown, Zap, Filter } from "lucide-react";

interface Props {
  feeds: Record<string, any>;
  onSelectMarket?: (sym: MarketSymbol) => void;
}

const VOLUMES: Record<MarketSymbol, { str: string; num: number }> = {
  BTC: { str: "$1.84B", num: 1840000000 },
  ETH: { str: "$924.5M", num: 924500000 },
  SOL: { str: "$412.8M", num: 412800000 },
  HYPE: { str: "$168.2M", num: 168200000 },
  SPX: { str: "$3.42B", num: 3420000000 },
  DOGE: { str: "$84.6M", num: 84600000 },
  SUI: { str: "$195.4M", num: 195400000 },
  AVAX: { str: "$124.8M", num: 124800000 },
  BNB: { str: "$210.6M", num: 210600000 },
  LINK: { str: "$78.2M", num: 78200000 },
  ARB: { str: "$64.5M", num: 64500000 },
  OP: { str: "$52.1M", num: 52100000 },
  TIA: { str: "$46.8M", num: 46800000 },
  APT: { str: "$58.3M", num: 58300000 },
};

const OPEN_INTERESTS: Record<MarketSymbol, { str: string; num: number }> = {
  BTC: { str: "$2.1B", num: 2100000000 },
  ETH: { str: "$980M", num: 980000000 },
  SOL: { str: "$340M", num: 340000000 },
  HYPE: { str: "$85M", num: 85000000 },
  SPX: { str: "$1.4B", num: 1400000000 },
  DOGE: { str: "$42M", num: 42000000 },
  SUI: { str: "$98M", num: 98000000 },
  AVAX: { str: "$64M", num: 64000000 },
  BNB: { str: "$112M", num: 112000000 },
  LINK: { str: "$39M", num: 39000000 },
  ARB: { str: "$31M", num: 31000000 },
  OP: { str: "$26M", num: 26000000 },
  TIA: { str: "$22M", num: 22000000 },
  APT: { str: "$28M", num: 28000000 },
};

const BASE_FUNDING_1H_BPS: Record<MarketSymbol, number> = {
  BTC: 1.0,
  ETH: 0.85,
  SOL: 1.25,
  HYPE: 1.5,
  SPX: 0.5,
  DOGE: 1.0,
  SUI: 1.12,
  AVAX: 0.94,
  BNB: 0.68,
  LINK: 0.88,
  ARB: 1.05,
  OP: 0.98,
  TIA: 1.42,
  APT: 1.18,
};

type SortKey = "symbol" | "price" | "change" | "funding1h" | "fundingApr" | "volume" | "oi";

export function FundingMatrix({ feeds, onSelectMarket }: Props) {
  const [filterQuery, setFilterQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("volume");
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const rows = ALL_MARKETS.map((m) => {
    const feed = feeds[m.symbol];
    const livePrice = feed?.price || m.basePrice;
    const open24 = feed?.open24 || livePrice * 0.991;
    const changePct = ((livePrice - open24) / open24) * 100;
    const bps = BASE_FUNDING_1H_BPS[m.symbol] || 1.0;
    const funding1hPct = bps / 100;
    const funding8hPct = funding1hPct * 8;
    const fundingAprPct = funding1hPct * 24 * 365;
    const vol = VOLUMES[m.symbol] || { str: "$50M", num: 50000000 };
    const oi = OPEN_INTERESTS[m.symbol] || { str: "$25M", num: 25000000 };
    const longBiasPct = Math.min(65, Math.max(45, 50 + (funding1hPct > 0 ? funding1hPct * 300 : funding1hPct * 300)));
    const shortBiasPct = 100 - longBiasPct;

    return {
      symbol: m.symbol,
      name: m.name,
      decimals: m.decimals,
      maxLeverage: m.maxLeverage,
      price: livePrice,
      changePct,
      funding1hPct,
      funding8hPct,
      fundingAprPct,
      volStr: vol.str,
      volNum: vol.num,
      oiStr: oi.str,
      oiNum: oi.num,
      longBiasPct,
      shortBiasPct,
    };
  });

  const filteredRows = rows.filter(
    (r) =>
      r.symbol.toLowerCase().includes(filterQuery.toLowerCase()) ||
      r.name.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const sortedRows = [...filteredRows].sort((a, b) => {
    let diff = 0;
    switch (sortKey) {
      case "symbol":
        diff = a.symbol.localeCompare(b.symbol);
        break;
      case "price":
        diff = a.price - b.price;
        break;
      case "change":
        diff = a.changePct - b.changePct;
        break;
      case "funding1h":
        diff = a.funding1hPct - b.funding1hPct;
        break;
      case "fundingApr":
        diff = a.fundingAprPct - b.fundingAprPct;
        break;
      case "volume":
        diff = a.volNum - b.volNum;
        break;
      case "oi":
        diff = a.oiNum - b.oiNum;
        break;
    }
    return sortAsc ? diff : -diff;
  });

  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-2xs font-sans">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold tracking-tight text-foreground uppercase tracking-wider font-mono">
              Perpetuals Funding &amp; Rates Matrix
            </h2>
            <span className="rounded-full bg-[#E3F8EC] px-2 py-0.5 text-[11px] font-mono font-bold text-[#06964A]">
              14 TICKERS LIVE
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground font-mono">
            Hyperliquid L1 1h Funding, 8h Predicted Settlement, and Long/Short Skew
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search ticker (BTC, SUI, AVAX...)"
              className="h-8 w-48 sm:w-64 rounded-xl border border-border bg-[#F8F8F7] px-3 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto no-scrollbar pt-2">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-border/70 text-[11px] uppercase tracking-wider text-muted-foreground select-none">
              <th
                onClick={() => handleSort("symbol")}
                className="py-2.5 pr-4 font-semibold cursor-pointer hover:text-foreground"
              >
                Market {sortKey === "symbol" ? (sortAsc ? "↑" : "↓") : ""}
              </th>
              <th
                onClick={() => handleSort("price")}
                className="py-2.5 pr-4 font-semibold cursor-pointer hover:text-foreground text-right"
              >
                Mark Price {sortKey === "price" ? (sortAsc ? "↑" : "↓") : ""}
              </th>
              <th
                onClick={() => handleSort("change")}
                className="py-2.5 pr-4 font-semibold cursor-pointer hover:text-foreground text-right"
              >
                24h Change {sortKey === "change" ? (sortAsc ? "↑" : "↓") : ""}
              </th>
              <th
                onClick={() => handleSort("funding1h")}
                className="py-2.5 pr-4 font-semibold cursor-pointer hover:text-foreground text-right"
              >
                1h Funding {sortKey === "funding1h" ? (sortAsc ? "↑" : "↓") : ""}
              </th>
              <th
                onClick={() => handleSort("fundingApr")}
                className="py-2.5 pr-4 font-semibold cursor-pointer hover:text-foreground text-right"
              >
                Annualized APR {sortKey === "fundingApr" ? (sortAsc ? "↑" : "↓") : ""}
              </th>
              <th
                onClick={() => handleSort("volume")}
                className="py-2.5 pr-4 font-semibold cursor-pointer hover:text-foreground text-right"
              >
                24h Volume {sortKey === "volume" ? (sortAsc ? "↑" : "↓") : ""}
              </th>
              <th
                onClick={() => handleSort("oi")}
                className="py-2.5 pr-4 font-semibold cursor-pointer hover:text-foreground text-right"
              >
                Open Interest {sortKey === "oi" ? (sortAsc ? "↑" : "↓") : ""}
              </th>
              <th className="py-2.5 pr-4 font-semibold text-center">
                Long / Short Skew
              </th>
              <th className="py-2.5 text-right font-semibold">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 text-xs">
            {sortedRows.map((r) => {
              const isPositiveChange = r.changePct >= 0;
              const isPositiveFunding = r.funding1hPct >= 0;

              return (
                <tr
                  key={r.symbol}
                  className="hover:bg-[#F8F8F7] transition-colors group"
                >
                  {/* Asset */}
                  <td className="py-2.5 pr-4">
                    <button
                      type="button"
                      onClick={() => onSelectMarket?.(r.symbol)}
                      className="flex items-center gap-2.5 text-left font-sans cursor-pointer"
                    >
                      <MarketLogo symbol={r.symbol} size={22} />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-foreground text-xs font-mono">
                            {r.symbol}
                          </span>
                          <span className="rounded bg-secondary px-1 py-0.2 text-[9px] font-mono font-bold text-muted-foreground">
                            {r.maxLeverage}x
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground block font-sans">
                          {r.name}
                        </span>
                      </div>
                    </button>
                  </td>

                  {/* Mark Price */}
                  <td className="py-2.5 pr-4 text-right tabular font-bold text-foreground">
                    ${fmtUsd(r.price, r.decimals)}
                  </td>

                  {/* 24h Change */}
                  <td className="py-2.5 pr-4 text-right tabular font-bold">
                    <span
                      className={`inline-flex items-center gap-0.5 ${
                        isPositiveChange ? "text-[#06964A]" : "text-[#FF3B30]"
                      }`}
                    >
                      {isPositiveChange ? (
                        <TrendingUp className="size-3" />
                      ) : (
                        <TrendingDown className="size-3" />
                      )}
                      <span>
                        {isPositiveChange ? "+" : ""}
                        {r.changePct.toFixed(2)}%
                      </span>
                    </span>
                  </td>

                  {/* 1h Funding */}
                  <td className="py-2.5 pr-4 text-right tabular font-medium">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-bold ${
                        isPositiveFunding
                          ? "bg-[#E3F8EC] text-[#06964A]"
                          : "bg-[#FFECEA] text-[#FF3B30]"
                      }`}
                    >
                      {isPositiveFunding ? "+" : ""}
                      {r.funding1hPct.toFixed(4)}%
                    </span>
                  </td>

                  {/* Annualized APR */}
                  <td className="py-2.5 pr-4 text-right tabular font-bold text-foreground">
                    {r.fundingAprPct.toFixed(2)}%
                  </td>

                  {/* 24h Volume */}
                  <td className="py-2.5 pr-4 text-right tabular text-foreground font-medium">
                    {r.volStr}
                  </td>

                  {/* Open Interest */}
                  <td className="py-2.5 pr-4 text-right tabular text-foreground font-medium">
                    {r.oiStr}
                  </td>

                  {/* Long / Short Skew Bar */}
                  <td className="py-2.5 pr-4 text-center">
                    <div className="w-28 mx-auto">
                      <div className="h-1.5 w-full rounded-full bg-[#FFECEA] overflow-hidden flex">
                        <div
                          className="h-full bg-[#00D964] transition-all"
                          style={{ width: `${r.longBiasPct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
                        <span className="text-[#06964A] font-bold">
                          {r.longBiasPct.toFixed(0)}% L
                        </span>
                        <span className="text-[#FF3B30] font-bold">
                          {r.shortBiasPct.toFixed(0)}% S
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Trade CTA */}
                  <td className="py-2.5 text-right font-sans">
                    <Link
                      to="/"
                      search={{ pair: `${r.symbol}-USD` } as any}
                      className="pill pill-ink h-6 px-2.5 text-[10px] font-bold inline-flex items-center gap-1 shadow-2xs hover:opacity-90"
                    >
                      <span>Trade</span>
                      <ArrowUpRight className="size-2.5" />
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
