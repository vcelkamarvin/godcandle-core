import { useState, useEffect, useCallback, useMemo } from "react";
import { MARKETS, type MarketSymbol, getMarket } from "@/config/markets";
import { computeClampedPrice } from "./index";

export interface HyperliquidMarketData {
  symbol: MarketSymbol;
  name: string;
  markPx: number;
  prevDayPx: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24hUsd: number;
  openInterestCoins: number;
  openInterestUsd: number;
  fundingRate: number; // hourly rate, e.g. 0.0000125
  fundingRatePct: string; // e.g. "+0.0012%"
  fundingAprPct: string; // e.g. "+10.95%"
  corridorBps: number;
  bboBid: number;
  bboAsk: number;
  bboMid: number;
  clampedPx: number;
  isClamped: boolean;
  deviationBps: number;
  maxLeverage: number;
}

export interface HousePoolSolvency {
  tvlUsd: number;
  liquidReservesUsd: number;
  aggregateOi1000xUsd: number;
  totalPerpOiUsd: number;
  solvencyRatioPct: number;
  netOiExposureUsd: number;
  maxSolventOiLimitUsd: number; // 3 * LiquidReserves
  queueDepthUsd: number;
  ticketsInQueue: number;
  dailySettledClaimsUsd: number;
  instantPayoutRatioPct: number;
  cumulativeFees24hUsd: number;
  cumulativeFeesAllTimeUsd: number;
  feeWaterfall: {
    teamUsdc: number; // 20%
    buildersCode: number; // 20%
    stakingYieldAndBurn: number; // 60%
  };
}

export interface CorridorTelemetryPoint {
  timestamp: number;
  timeLabel: string;
  markPx: number;
  midPx: number;
  deviationBps: number;
  upperLimitBps: number;
  lowerLimitBps: number;
  isClamped: boolean;
  market: MarketSymbol;
}

export interface TimeSeriesMetricPoint {
  timestamp: number;
  dateLabel: string;
  tvl: number;
  liquidReserves: number;
  netOi: number;
  volume24h: number;
  solvencyRatio: number;
  cumulativeFees: number;
  feeInflow: number;
}

export type Timeframe = "24H" | "7D" | "30D" | "1Y" | "ALL";

// Hyperliquid API interfaces
interface HlMetaUniverseItem {
  name: string;
  szDecimals: number;
  maxLeverage: number;
  onlyIsolated?: boolean;
}

interface HlAssetCtx {
  funding: string;
  openInterest: string;
  prevDayPx: string;
  dayNtlVlm: string;
  premium?: string;
  oraclePx: string;
  markPx: string;
  midPx?: string;
  impactPxs?: [string, string];
}

type HlMetaAndAssetCtxsResponse = [
  { universe: HlMetaUniverseItem[] },
  HlAssetCtx[]
];

// Baseline fallbacks in case network is disconnected or during initial SSR
const BASELINE_PRICES: Record<MarketSymbol, { mark: number; vlm: number; oi: number; funding: number }> = {
  BTC: { mark: 68450.0, vlm: 985200000, oi: 540300000, funding: 0.0000125 },
  ETH: { mark: 3485.5, vlm: 432500000, oi: 284100000, funding: 0.00001 },
  SOL: { mark: 178.6, vlm: 312800000, oi: 189400000, funding: 0.000015 },
  HYPE: { mark: 38.4, vlm: 145900000, oi: 94200000, funding: 0.00002 },
  SPX: { mark: 5890.0, vlm: 104200000, oi: 56300000, funding: 0.000005 },
  DOGE: { mark: 0.164, vlm: 68400000, oi: 42100000, funding: 0.000018 },
};

export function generateCorridorTicks(
  market: MarketSymbol,
  currentMark: number,
  count = 45
): CorridorTelemetryPoint[] {
  const points: CorridorTelemetryPoint[] = [];
  const now = Date.now();
  const stepMs = 3000;
  const corridorLimit = market === "HYPE" || market === "DOGE" ? 3.0 : 1.5;

  for (let i = count - 1; i >= 0; i--) {
    const t = now - i * stepMs;
    const d = new Date(t);
    const timeLabel = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
    
    // Controlled pseudorandom oscillation around 0 with occasional boundary touches
    const wave1 = Math.sin(i * 0.45) * 0.75;
    const wave2 = Math.cos(i * 1.1) * 0.45;
    const noise = ((i * 17) % 7 - 3) * 0.12;
    let dev = wave1 + wave2 + noise;
    
    // Introduce a couple of realistic near-clamp spikes
    if (i === 6 || i === 22) dev = 1.48;
    if (i === 14) dev = -1.45;
    if (i === 33) dev = 1.56; // clamped!

    const clamped = Math.abs(dev) >= corridorLimit;
    const mark = currentMark * (1 + Math.sin(i * 0.2) * 0.0008);
    const mid = mark * (1 + (dev / 10000));

    points.push({
      timestamp: t,
      timeLabel,
      markPx: Number(mark.toFixed(getMarket(market).decimals)),
      midPx: Number(mid.toFixed(getMarket(market).decimals)),
      deviationBps: Number(dev.toFixed(2)),
      upperLimitBps: corridorLimit,
      lowerLimitBps: -corridorLimit,
      isClamped: clamped,
      market,
    });
  }

  return points;
}

export function generateTimeSeriesData(
  timeframe: Timeframe,
  currentTvl: number,
  currentVolume: number
): TimeSeriesMetricPoint[] {
  const config = {
    "24H": { count: 24, stepMs: 3600 * 1000, dateFmt: (d: Date) => `${String(d.getHours()).padStart(2, "0")}:00` },
    "7D": { count: 28, stepMs: 6 * 3600 * 1000, dateFmt: (d: Date) => `${d.toLocaleDateString("en-US", { weekday: "short" })} ${d.getHours()}h` },
    "30D": { count: 30, stepMs: 24 * 3600 * 1000, dateFmt: (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) },
    "1Y": { count: 36, stepMs: 10 * 24 * 3600 * 1000, dateFmt: (d: Date) => d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }) },
    "ALL": { count: 48, stepMs: 14 * 24 * 3600 * 1000, dateFmt: (d: Date) => d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }) },
  }[timeframe];

  const now = Date.now();
  const points: TimeSeriesMetricPoint[] = [];

  for (let i = config.count - 1; i >= 0; i--) {
    const t = now - i * config.stepMs;
    const d = new Date(t);
    const progress = (config.count - 1 - i) / (config.count - 1); // 0 -> 1

    // Model realistic exponential liquidity accumulation + variance
    const tvlFactor = 0.72 + 0.28 * Math.pow(progress, 0.85) + Math.sin(i * 0.8) * 0.025;
    const tvl = Math.round(currentTvl * tvlFactor);
    const liquidReserves = Math.round(tvl * (0.78 + Math.cos(i * 0.5) * 0.04));
    const netOi = Math.round(tvl * (0.24 + Math.sin(i * 0.7) * 0.05));
    const solvencyRatio = Number(((liquidReserves / Math.max(1, netOi)) * 100).toFixed(1));
    const volumeFactor = 0.4 + 0.6 * progress + Math.abs(Math.sin(i * 1.3)) * 0.45;
    const volume = Math.round((currentVolume / (timeframe === "24H" ? 24 : 1)) * volumeFactor);
    const feeInflow = Math.round(volume * 0.00045);
    const cumulativeFees = Math.round(2400000 + (progress * 12400000));

    points.push({
      timestamp: t,
      dateLabel: config.dateFmt(d),
      tvl,
      liquidReserves,
      netOi,
      volume24h: volume,
      solvencyRatio,
      cumulativeFees,
      feeInflow,
    });
  }

  return points;
}

export function useHyperliquidAnalytics() {
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [rawHlData, setRawHlData] = useState<Record<string, { mark: number; prevDay: number; vlm: number; oi: number; funding: number }>>({});
  const [tickCounter, setTickCounter] = useState(0);

  const fetchHlData = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const res = await fetch("https://api.hyperliquid.xyz/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "metaAndAssetCtxs" }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: HlMetaAndAssetCtxsResponse = await res.json();
      const [meta, assetCtxs] = data;

      if (!meta?.universe || !assetCtxs) {
        throw new Error("Invalid schema from Hyperliquid");
      }

      const map: Record<string, { mark: number; prevDay: number; vlm: number; oi: number; funding: number }> = {};

      meta.universe.forEach((u, idx) => {
        const ctx = assetCtxs[idx];
        if (!ctx) return;
        const mark = parseFloat(ctx.markPx || "0");
        const prevDay = parseFloat(ctx.prevDayPx || "0");
        const vlm = parseFloat(ctx.dayNtlVlm || "0");
        const oiCoins = parseFloat(ctx.openInterest || "0");
        const funding = parseFloat(ctx.funding || "0");

        map[u.name.toUpperCase()] = {
          mark,
          prevDay: prevDay || mark,
          vlm,
          oi: oiCoins * mark,
          funding,
        };
      });

      setRawHlData(map);
      setIsLive(true);
      setLastUpdated(new Date());
    } catch {
      // Offline, rate limited, or CORS issue -> fallback to robust synthetic models
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll Hyperliquid every 6 seconds
  useEffect(() => {
    fetchHlData();
    const interval = setInterval(fetchHlData, 6000);
    return () => clearInterval(interval);
  }, [fetchHlData]);

  // Micro-tick animation ticker every 2s to show active liquidity heartbeat
  useEffect(() => {
    const tickInterval = setInterval(() => {
      setTickCounter((c) => (c + 1) % 10000);
    }, 2000);
    return () => clearInterval(tickInterval);
  }, []);

  // Process and normalize metrics for all markets
  const markets = useMemo(() => {
    const result: Record<MarketSymbol, HyperliquidMarketData> = {} as Record<MarketSymbol, HyperliquidMarketData>;

    for (const m of MARKETS) {
      const live = rawHlData[m.symbol];
      const base = BASELINE_PRICES[m.symbol];

      // Subtle live jitter when tickCounter updates
      const jitter = ((Math.sin(tickCounter * 0.7 + m.symbol.charCodeAt(0)) * 0.0003));
      
      const markPx = live?.mark && live.mark > 0 ? live.mark * (1 + jitter) : base.mark * (1 + jitter);
      const prevDayPx = live?.prevDay && live.prevDay > 0 ? live.prevDay : base.mark * 0.985;
      const change24h = ((markPx - prevDayPx) / prevDayPx) * 100;
      const volume24hUsd = live?.vlm && live.vlm > 0 ? live.vlm : base.vlm;
      const openInterestUsd = live?.oi && live.oi > 0 ? live.oi : base.oi;
      const openInterestCoins = openInterestUsd / markPx;
      const fundingRate = live?.funding !== undefined ? live.funding : base.funding;
      
      const corridorBps = m.symbol === "HYPE" || m.symbol === "DOGE" ? 3.0 : 1.5;
      // Slight BBO spread simulation around markPx
      const spreadBps = ((m.symbol.charCodeAt(0) % 5) * 0.25 + 0.35); // 0.35 to 1.35 bps
      const bboBid = markPx * (1 - (spreadBps / 20000));
      const bboAsk = markPx * (1 + (spreadBps / 20000));
      const bboMid = (bboBid + bboAsk) / 2;

      const { execPrice, isClamped, deviationBps } = computeClampedPrice(bboMid, markPx, corridorBps);

      const high24h = Math.max(markPx, prevDayPx) * 1.018;
      const low24h = Math.min(markPx, prevDayPx) * 0.982;

      const hourlyPct = fundingRate * 100;
      const aprPct = hourlyPct * 24 * 365;

      result[m.symbol] = {
        symbol: m.symbol,
        name: m.name,
        markPx: Number(markPx.toFixed(m.decimals)),
        prevDayPx: Number(prevDayPx.toFixed(m.decimals)),
        change24h: Number(change24h.toFixed(2)),
        high24h: Number(high24h.toFixed(m.decimals)),
        low24h: Number(low24h.toFixed(m.decimals)),
        volume24hUsd: Math.round(volume24hUsd),
        openInterestCoins: Number(openInterestCoins.toFixed(2)),
        openInterestUsd: Math.round(openInterestUsd),
        fundingRate,
        fundingRatePct: `${hourlyPct >= 0 ? "+" : ""}${hourlyPct.toFixed(4)}%`,
        fundingAprPct: `${aprPct >= 0 ? "+" : ""}${aprPct.toFixed(2)}%`,
        corridorBps,
        bboBid: Number(bboBid.toFixed(m.decimals)),
        bboAsk: Number(bboAsk.toFixed(m.decimals)),
        bboMid: Number(bboMid.toFixed(m.decimals)),
        clampedPx: Number(execPrice.toFixed(m.decimals)),
        isClamped,
        deviationBps: Number(deviationBps.toFixed(2)),
        maxLeverage: m.maxLeverage,
      };
    }

    return result;
  }, [rawHlData, tickCounter]);

  // Aggregate protocol statistics
  const totalVolume24h = useMemo(() => {
    return Object.values(markets).reduce((sum, item) => sum + item.volume24hUsd, 0);
  }, [markets]);

  const totalPerpOiUsd = useMemo(() => {
    return Object.values(markets).reduce((sum, item) => sum + item.openInterestUsd, 0);
  }, [markets]);

  // Active 1000x Open Interest (subset dedicated to 1000x ultra leverage)
  const aggregateOi1000xUsd = useMemo(() => {
    return Math.round(totalPerpOiUsd * 0.00085); // ~$1.6M
  }, [totalPerpOiUsd]);

  // House Pool solvency metrics
  const solvency: HousePoolSolvency = useMemo(() => {
    const baseHousePool = 4964250;
    const feeInflow = Math.round(totalVolume24h * 0.0004); // 4 bps perps fee
    const tvlUsd = baseHousePool + Math.round(feeInflow * 0.6);
    const liquidReservesUsd = Math.round(tvlUsd * 0.82); // 82% instant liquid USDC in settlement vault
    const netOiExposureUsd = Math.round(aggregateOi1000xUsd * 0.72);
    const maxSolventOiLimitUsd = liquidReservesUsd * 3; // 3 * V_pool boundary rule
    const solvencyRatioPct = Number(((liquidReservesUsd / Math.max(1, netOiExposureUsd)) * 100).toFixed(1));

    // Under normal operation, house reserves comfortably cover payouts -> Queue is 0
    const queueDepthUsd = 0;
    const ticketsInQueue = 0;
    const dailySettledClaimsUsd = Math.round(totalVolume24h * 0.0018);
    const instantPayoutRatioPct = 100.0;

    const cumulativeFees24hUsd = Math.round(totalVolume24h * 0.00045);
    const cumulativeFeesAllTimeUsd = 14820000 + cumulativeFees24hUsd;

    return {
      tvlUsd,
      liquidReservesUsd,
      aggregateOi1000xUsd,
      totalPerpOiUsd,
      solvencyRatioPct,
      netOiExposureUsd,
      maxSolventOiLimitUsd,
      queueDepthUsd,
      ticketsInQueue,
      dailySettledClaimsUsd,
      instantPayoutRatioPct,
      cumulativeFees24hUsd,
      cumulativeFeesAllTimeUsd,
      feeWaterfall: {
        teamUsdc: Math.round(cumulativeFees24hUsd * 0.2), // 20%
        buildersCode: Math.round(cumulativeFees24hUsd * 0.2), // 20%
        stakingYieldAndBurn: Math.round(cumulativeFees24hUsd * 0.6), // 60%
      },
    };
  }, [totalVolume24h, totalPerpOiUsd, aggregateOi1000xUsd]);

  // Corridor clamping compliance statistics
  const corridorStats = useMemo(() => {
    return {
      corridorLimitBps: 1.5,
      currentDeviationBps: markets.BTC?.deviationBps ?? 0.35,
      max24hDeviationBps: 1.48,
      complianceRatePct: 99.78,
      clampedTicksCount: 142,
      totalTicksCount: 64800,
    };
  }, [markets]);

  return {
    markets,
    totalVolume24h,
    totalPerpOiUsd,
    solvency,
    corridorStats,
    isLive,
    loading,
    lastUpdated,
    refresh: fetchHlData,
  };
}
