import { hlInfo, isValidEvmAddress } from "./hyperliquidClient";
import { cacheService } from "./cacheService";
import {
  HlClearinghouseState,
  HlMetaAndAssetCtxs,
  HlSpotClearinghouseState,
  HlSpotMetaAndAssetCtxs,
  HlPortfolioResponse,
  HlUserFill
} from "../types/hyperliquid";
import { TraderProfile, PerpPosition, SpotHolding, TradeFill, PnlPoint } from "../types/trader";
import {
  calculateExposure,
  calculateWinRateAndProfitFactor,
  calculateMaxDrawdown
} from "./tradingAnalytics";

const CACHE_TTL_STATE = 15 * 1000; // 15 seconds
const CACHE_TTL_META = 60 * 1000; // 1 minute
const CACHE_TTL_PORTFOLIO = 3 * 60 * 1000; // 3 minutes

export async function fetchTraderProfile(address: string): Promise<TraderProfile> {
  if (!isValidEvmAddress(address)) {
    throw new Error(`Invalid EVM wallet address: ${address}`);
  }

  const normalizedAddress = address.toLowerCase();

  // 1. Fetch Clearinghouse State (Perps)
  const clearinghousePromise = (async () => {
    const cacheKey = `clearinghouse:${normalizedAddress}`;
    const cached = cacheService.get<HlClearinghouseState>(cacheKey);
    if (cached) return cached;

    const data = await hlInfo<HlClearinghouseState>({
      type: "clearinghouseState",
      user: normalizedAddress,
      dex: ""
    });
    cacheService.set(cacheKey, data, CACHE_TTL_STATE);
    return data;
  })();

  // 2. Fetch Perps Market Meta & Prices
  const metaPromise = (async () => {
    const cacheKey = "perps:metaAndAssetCtxs";
    const cached = cacheService.get<HlMetaAndAssetCtxs>(cacheKey);
    if (cached) return cached;

    const data = await hlInfo<HlMetaAndAssetCtxs>({
      type: "metaAndAssetCtxs",
      dex: ""
    });
    cacheService.set(cacheKey, data, CACHE_TTL_META);
    return data;
  })();

  // 3. Fetch Spot State
  const spotClearingPromise = (async () => {
    const cacheKey = `spotClearinghouse:${normalizedAddress}`;
    const cached = cacheService.get<HlSpotClearinghouseState>(cacheKey);
    if (cached) return cached;

    try {
      const data = await hlInfo<HlSpotClearinghouseState>({
        type: "spotClearinghouseState",
        user: normalizedAddress
      });
      cacheService.set(cacheKey, data, CACHE_TTL_STATE);
      return data;
    } catch {
      return { balances: [] };
    }
  })();

  // 4. Fetch Spot Meta
  const spotMetaPromise = (async () => {
    const cacheKey = "spot:metaAndAssetCtxs";
    const cached = cacheService.get<HlSpotMetaAndAssetCtxs>(cacheKey);
    if (cached) return cached;

    try {
      const data = await hlInfo<HlSpotMetaAndAssetCtxs>({
        type: "spotMetaAndAssetCtxs"
      });
      cacheService.set(cacheKey, data, CACHE_TTL_META);
      return data;
    } catch {
      return { tokens: [], universe: [] };
    }
  })();

  // 5. Fetch Portfolio History
  const portfolioPromise = (async () => {
    const cacheKey = `portfolio:${normalizedAddress}`;
    const cached = cacheService.get<HlPortfolioResponse>(cacheKey);
    if (cached) return cached;

    try {
      const data = await hlInfo<HlPortfolioResponse>({
        type: "portfolio",
        user: normalizedAddress
      });
      cacheService.set(cacheKey, data, CACHE_TTL_PORTFOLIO);
      return data;
    } catch {
      return [] as HlPortfolioResponse;
    }
  })();

  // 6. Fetch User Fills (Trade History)
  const fillsPromise = (async () => {
    const cacheKey = `fills:${normalizedAddress}`;
    const cached = cacheService.get<HlUserFill[]>(cacheKey);
    if (cached) return cached;

    try {
      const data = await hlInfo<HlUserFill[]>({
        type: "userFills",
        user: normalizedAddress,
        aggregateByTime: false
      });
      cacheService.set(cacheKey, data, CACHE_TTL_STATE * 2);
      return data;
    } catch {
      return [] as HlUserFill[];
    }
  })();

  const [
    clearinghouse,
    perpsMeta,
    spotClearinghouse,
    spotMeta,
    portfolio,
    rawFills
  ] = await Promise.all([
    clearinghousePromise,
    metaPromise,
    spotClearingPromise,
    spotMetaPromise,
    portfolioPromise,
    fillsPromise
  ]);

  // Build price map for perps
  const perpsPriceMap = new Map<string, number>();
  if (perpsMeta && perpsMeta[0]?.universe && perpsMeta[1]) {
    const universe = perpsMeta[0].universe;
    const ctxs = perpsMeta[1];
    for (let i = 0; i < universe.length; i++) {
      const coinName = universe[i].name;
      const markPx = parseFloat(ctxs[i]?.markPx || "0");
      if (coinName && !isNaN(markPx)) {
        perpsPriceMap.set(coinName, markPx);
      }
    }
  }

  // Parse Perps Positions
  const positions: PerpPosition[] = [];
  if (clearinghouse?.assetPositions) {
    for (const ap of clearinghouse.assetPositions) {
      const p = ap.position;
      const szi = parseFloat(p.szi);
      if (isNaN(szi) || Math.abs(szi) === 0) continue;

      const side: "LONG" | "SHORT" = szi > 0 ? "LONG" : "SHORT";
      const size = Math.abs(szi);
      const entryPrice = parseFloat(p.entryPx) || 0;
      const positionValue = Math.abs(parseFloat(p.positionValue) || size * entryPrice);
      const unrealizedPnl = parseFloat(p.unrealizedPnl) || 0;
      const leverage = p.leverage?.value || 1;
      const marginUsed = parseFloat(p.marginUsed) || 0;
      const liquidationPrice = p.liquidationPx ? parseFloat(p.liquidationPx) : null;
      const markPrice = perpsPriceMap.get(p.coin) ?? (positionValue && size ? positionValue / size : null);

      positions.push({
        coin: p.coin,
        side,
        size,
        entryPrice,
        markPrice,
        positionValue,
        unrealizedPnl,
        leverage,
        marginUsed,
        liquidationPrice
      });
    }
  }

  // Sort positions by position value descending
  positions.sort((a, b) => b.positionValue - a.positionValue);

  // Parse Spot Holdings
  const spot: SpotHolding[] = [];
  let totalSpotUsd = 0;

  if (spotClearinghouse?.balances) {
    for (const b of spotClearinghouse.balances) {
      const total = parseFloat(b.total) || 0;
      const hold = parseFloat(b.hold) || 0;
      if (total <= 0) continue;

      let currentPrice: number | null = null;
      let value: number | null = null;

      // Check stablecoins or common tokens
      if (b.coin === "USDC" || b.coin === "USDT") {
        currentPrice = 1.0;
        value = total;
      } else if (perpsPriceMap.has(b.coin)) {
        currentPrice = perpsPriceMap.get(b.coin)!;
        value = total * currentPrice;
      }

      if (value !== null) {
        totalSpotUsd += value;
      }

      spot.push({
        coin: b.coin,
        total,
        hold,
        token: b.token,
        currentPrice,
        value,
        unrealizedPnl: null
      });
    }
  }

  // Parse Trade History (Fills)
  const history: TradeFill[] = [];
  if (Array.isArray(rawFills)) {
    for (const f of rawFills) {
      history.push({
        coin: f.coin,
        px: parseFloat(f.px) || 0,
        sz: parseFloat(f.sz) || 0,
        side: f.side,
        dir: f.dir,
        startPosition: f.startPosition,
        closedPnl: parseFloat(f.closedPnl) || 0,
        time: f.time,
        fee: parseFloat(f.fee) || 0,
        oid: f.oid,
        tid: f.tid
      });
    }
  }
  history.sort((a, b) => b.time - a.time);

  // Parse Portfolio History
  const portfolioMap = new Map<string, { accountValueHistory: [number, string][]; pnlHistory: [number, string][]; vlm: string }>();
  if (Array.isArray(portfolio)) {
    for (const [period, data] of portfolio) {
      portfolioMap.set(period, data);
    }
  }

  const parseHistoryPoints = (points?: [number, string][]): PnlPoint[] => {
    if (!points) return [];
    return points.map(([ts, val]) => ({
      timestamp: ts,
      value: parseFloat(val) || 0
    }));
  };

  const dayPoints = parseHistoryPoints(portfolioMap.get("perpDay")?.accountValueHistory || portfolioMap.get("day")?.accountValueHistory);
  const weekPoints = parseHistoryPoints(portfolioMap.get("perpWeek")?.accountValueHistory || portfolioMap.get("week")?.accountValueHistory);
  const monthPoints = parseHistoryPoints(portfolioMap.get("perpMonth")?.accountValueHistory || portfolioMap.get("month")?.accountValueHistory);
  const allTimePoints = parseHistoryPoints(portfolioMap.get("perpAllTime")?.accountValueHistory || portfolioMap.get("allTime")?.accountValueHistory);

  // Analytics
  // Hyperdash and Hyperliquid portfolio display total account equity from the portfolio accountValueHistory
  const latestPortfolioPerp = portfolioMap.get("perpDay")?.accountValueHistory?.slice(-1)[0]?.[1] ||
    portfolioMap.get("perpMonth")?.accountValueHistory?.slice(-1)[0]?.[1];
  const latestPortfolioTotal = portfolioMap.get("day")?.accountValueHistory?.slice(-1)[0]?.[1] ||
    portfolioMap.get("month")?.accountValueHistory?.slice(-1)[0]?.[1];

  const marginSummaryValue = parseFloat(clearinghouse?.marginSummary?.accountValue || "0");
  const perpEquity = latestPortfolioPerp ? parseFloat(latestPortfolioPerp) : marginSummaryValue;
  const marginUsed = parseFloat(clearinghouse?.marginSummary?.totalMarginUsed || "0");
  const withdrawable = parseFloat(clearinghouse?.withdrawable || "0");
  const calculatedSpotUsd = latestPortfolioTotal && latestPortfolioPerp
    ? Math.max(0, parseFloat(latestPortfolioTotal) - parseFloat(latestPortfolioPerp))
    : totalSpotUsd;
  const spotValue = calculatedSpotUsd > 0 ? calculatedSpotUsd : (totalSpotUsd > 0 ? totalSpotUsd : null);
  const totalAccountValue = latestPortfolioTotal ? parseFloat(latestPortfolioTotal) : (perpEquity + (spotValue || 0));

  const exposure = calculateExposure(positions);
  const winLoss = calculateWinRateAndProfitFactor(history);
  const maxDrawdown = calculateMaxDrawdown(monthPoints.length > 0 ? monthPoints : allTimePoints);

  // Volume from portfolio month or allTime
  const rawVlm = portfolioMap.get("perpMonth")?.vlm || portfolioMap.get("month")?.vlm || portfolioMap.get("perpAllTime")?.vlm;
  const volume = rawVlm ? parseFloat(rawVlm) : null;

  return {
    address: normalizedAddress,
    source: "hyperliquid",
    lastUpdated: Date.now(),
    account: {
      perpEquity,
      spotValue,
      totalAccountValue,
      marginUsed,
      withdrawable
    },
    stats: {
      volume,
      closedTrades: winLoss.closedTrades,
      winRate: winLoss.winRate,
      profitFactor: winLoss.profitFactor,
      maxDrawdown,
      longExposure: exposure.longExposure,
      shortExposure: exposure.shortExposure,
      longRatio: exposure.longRatio,
      shortRatio: exposure.shortRatio
    },
    positions,
    spot,
    history: history.slice(0, 50),
    performance: {
      day: dayPoints,
      week: weekPoints,
      month: monthPoints,
      allTime: allTimePoints
    }
  };
}
