import type {
  HlClearinghouseState,
  HlMetaAndAssetCtxs,
  HlSpotClearinghouseState,
  HlSpotMetaAndAssetCtxs,
  HlPortfolioResponse,
  HlUserFill,
  TraderProfile,
  PerpPosition,
  SpotHolding,
  TradeFill,
  PnlPoint,
} from "./types";

const INFO_ENDPOINT = "https://api.hyperliquid.xyz/info";

export function isValidEvmAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// In-flight request deduplication map
const pendingRequests = new Map<string, Promise<unknown>>();

// Simple in-memory cache
const memoryCache = new Map<string, { data: unknown; expiresAt: number }>();

function getCache<T>(key: string): T | null {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return item.data as T;
}

function setCache<T>(key: string, data: T, ttlMs: number): void {
  memoryCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export async function hlInfo<T>(
  body: Record<string, unknown>,
  retries = 3,
  backoffMs = 500,
): Promise<T> {
  const requestKey = JSON.stringify(body);
  if (pendingRequests.has(requestKey)) {
    return pendingRequests.get(requestKey) as Promise<T>;
  }

  const promise = (async () => {
    let attempt = 0;
    while (attempt <= retries) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const response = await fetch(INFO_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: requestKey,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Hyperliquid API HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data as T;
      } catch (err: unknown) {
        attempt++;
        if (attempt > retries) {
          throw err;
        }
        const delay = backoffMs * Math.pow(2, attempt - 1);
        await new Promise((res) => setTimeout(res, delay));
      }
    }
    throw new Error("Hyperliquid request failed after retries");
  })().finally(() => {
    pendingRequests.delete(requestKey);
  });

  pendingRequests.set(requestKey, promise);
  return promise;
}

export function calculateExposure(positions: PerpPosition[]) {
  let longExposure = 0;
  let shortExposure = 0;

  for (const pos of positions) {
    if (pos.side === "LONG") {
      longExposure += Math.abs(pos.positionValue);
    } else {
      shortExposure += Math.abs(pos.positionValue);
    }
  }

  const total = longExposure + shortExposure;
  const longRatio = total > 0 ? Math.round((longExposure / total) * 100) : 50;
  const shortRatio = total > 0 ? 100 - longRatio : 50;

  return {
    longExposure,
    shortExposure,
    longRatio,
    shortRatio,
  };
}

export function calculateWinRateAndProfitFactor(fills: TradeFill[]) {
  if (!fills || fills.length === 0) {
    return {
      winRate: null,
      profitFactor: null,
      closedTrades: null,
    };
  }

  const closedFills = fills.filter((f) => f.closedPnl !== 0);

  if (closedFills.length === 0) {
    return {
      winRate: null,
      profitFactor: null,
      closedTrades: 0,
    };
  }

  let winningPnl = 0;
  let losingPnl = 0;
  let wins = 0;
  let losses = 0;

  for (const f of closedFills) {
    if (f.closedPnl > 0) {
      wins++;
      winningPnl += f.closedPnl;
    } else if (f.closedPnl < 0) {
      losses++;
      losingPnl += Math.abs(f.closedPnl);
    }
  }

  const totalClosed = wins + losses;
  const winRate = totalClosed > 0 ? Number(((wins / totalClosed) * 100).toFixed(1)) : null;
  const profitFactor =
    losingPnl > 0
      ? Number((winningPnl / losingPnl).toFixed(2))
      : winningPnl > 0
        ? 99.9
        : null;

  return {
    winRate,
    profitFactor,
    closedTrades: totalClosed,
  };
}

export function calculateMaxDrawdown(history: PnlPoint[]): number | null {
  if (!history || history.length < 2) return null;

  let peak = -Infinity;
  let maxDd = 0;

  for (const pt of history) {
    if (pt.value > peak) {
      peak = pt.value;
    }
    if (peak > 0) {
      const dd = ((peak - pt.value) / peak) * 100;
      if (dd > maxDd) {
        maxDd = dd;
      }
    }
  }

  return maxDd > 0 ? Number(maxDd.toFixed(2)) : 0;
}

const CACHE_TTL_STATE = 15 * 1000;
const CACHE_TTL_META = 60 * 1000;
const CACHE_TTL_PORTFOLIO = 3 * 60 * 1000;

export async function fetchTraderProfile(address: string): Promise<TraderProfile> {
  if (!isValidEvmAddress(address)) {
    throw new Error(`Invalid EVM wallet address: ${address}`);
  }

  const normalizedAddress = address.toLowerCase();

  const clearinghousePromise = (async () => {
    const cacheKey = `clearinghouse:${normalizedAddress}`;
    const cached = getCache<HlClearinghouseState>(cacheKey);
    if (cached) return cached;

    const data = await hlInfo<HlClearinghouseState>({
      type: "clearinghouseState",
      user: normalizedAddress,
      dex: "",
    });
    setCache(cacheKey, data, CACHE_TTL_STATE);
    return data;
  })();

  const metaPromise = (async () => {
    const cacheKey = "perps:metaAndAssetCtxs";
    const cached = getCache<HlMetaAndAssetCtxs>(cacheKey);
    if (cached) return cached;

    const data = await hlInfo<HlMetaAndAssetCtxs>({
      type: "metaAndAssetCtxs",
      dex: "",
    });
    setCache(cacheKey, data, CACHE_TTL_META);
    return data;
  })();

  const spotClearingPromise = (async () => {
    const cacheKey = `spotClearinghouse:${normalizedAddress}`;
    const cached = getCache<HlSpotClearinghouseState>(cacheKey);
    if (cached) return cached;

    try {
      const data = await hlInfo<HlSpotClearinghouseState>({
        type: "spotClearinghouseState",
        user: normalizedAddress,
      });
      setCache(cacheKey, data, CACHE_TTL_STATE);
      return data;
    } catch {
      return { balances: [] };
    }
  })();

  const spotMetaPromise = (async () => {
    const cacheKey = "spot:metaAndAssetCtxs";
    const cached = getCache<HlSpotMetaAndAssetCtxs>(cacheKey);
    if (cached) return cached;

    try {
      const data = await hlInfo<HlSpotMetaAndAssetCtxs>({
        type: "spotMetaAndAssetCtxs",
      });
      setCache(cacheKey, data, CACHE_TTL_META);
      return data;
    } catch {
      return { tokens: [], universe: [] };
    }
  })();

  const portfolioPromise = (async () => {
    const cacheKey = `portfolio:${normalizedAddress}`;
    const cached = getCache<HlPortfolioResponse>(cacheKey);
    if (cached) return cached;

    try {
      const data = await hlInfo<HlPortfolioResponse>({
        type: "portfolio",
        user: normalizedAddress,
      });
      setCache(cacheKey, data, CACHE_TTL_PORTFOLIO);
      return data;
    } catch {
      return [];
    }
  })();

  const userFillsPromise = (async () => {
    const cacheKey = `userFills:${normalizedAddress}`;
    const cached = getCache<HlUserFill[]>(cacheKey);
    if (cached) return cached;

    try {
      const data = await hlInfo<HlUserFill[]>({
        type: "userFills",
        user: normalizedAddress,
      });
      setCache(cacheKey, data, CACHE_TTL_STATE);
      return data;
    } catch {
      return [];
    }
  })();

  const [
    clearinghouse,
    perpsMeta,
    spotClearinghouse,
    _spotMeta,
    portfolio,
    rawFills,
  ] = await Promise.all([
    clearinghousePromise,
    metaPromise,
    spotClearingPromise,
    spotMetaPromise,
    portfolioPromise,
    userFillsPromise,
  ]);

  const perpsPriceMap = new Map<string, number>();
  if (perpsMeta && perpsMeta[0]?.universe && perpsMeta[1]) {
    const universe = perpsMeta[0].universe;
    const ctxs = perpsMeta[1];
    for (let i = 0; i < universe.length; i++) {
      const item = universe[i];
      const coinName = item?.name;
      const markPx = parseFloat(ctxs[i]?.markPx || "0");
      if (coinName && !isNaN(markPx)) {
        perpsPriceMap.set(coinName, markPx);
      }
    }
  }

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
        liquidationPrice,
      });
    }
  }

  positions.sort((a, b) => b.positionValue - a.positionValue);

  const spot: SpotHolding[] = [];
  let totalSpotUsd = 0;

  if (spotClearinghouse?.balances) {
    for (const b of spotClearinghouse.balances) {
      const total = parseFloat(b.total) || 0;
      const hold = parseFloat(b.hold) || 0;
      if (total <= 0) continue;

      let currentPrice: number | null = null;
      let value: number | null = null;

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
        unrealizedPnl: null,
      });
    }
  }

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
        tid: f.tid,
      });
    }
  }
  history.sort((a, b) => b.time - a.time);

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
      value: parseFloat(val) || 0,
    }));
  };

  const dayPoints = parseHistoryPoints(portfolioMap.get("perpDay")?.accountValueHistory || portfolioMap.get("day")?.accountValueHistory);
  const weekPoints = parseHistoryPoints(portfolioMap.get("perpWeek")?.accountValueHistory || portfolioMap.get("week")?.accountValueHistory);
  const monthPoints = parseHistoryPoints(portfolioMap.get("perpMonth")?.accountValueHistory || portfolioMap.get("month")?.accountValueHistory);
  const allTimePoints = parseHistoryPoints(portfolioMap.get("perpAllTime")?.accountValueHistory || portfolioMap.get("allTime")?.accountValueHistory);

  const latestPortfolioPerp =
    portfolioMap.get("perpDay")?.accountValueHistory?.slice(-1)[0]?.[1] ||
    portfolioMap.get("perpMonth")?.accountValueHistory?.slice(-1)[0]?.[1];
  const latestPortfolioTotal =
    portfolioMap.get("day")?.accountValueHistory?.slice(-1)[0]?.[1] ||
    portfolioMap.get("month")?.accountValueHistory?.slice(-1)[0]?.[1];

  const marginSummaryValue = parseFloat(clearinghouse?.marginSummary?.accountValue || "0");
  const perpEquity = latestPortfolioPerp ? parseFloat(latestPortfolioPerp) : marginSummaryValue;
  const marginUsed = parseFloat(clearinghouse?.marginSummary?.totalMarginUsed || "0");
  const withdrawable = parseFloat(clearinghouse?.withdrawable || "0");
  const calculatedSpotUsd =
    latestPortfolioTotal && latestPortfolioPerp
      ? Math.max(0, parseFloat(latestPortfolioTotal) - parseFloat(latestPortfolioPerp))
      : totalSpotUsd;
  const spotValue = calculatedSpotUsd > 0 ? calculatedSpotUsd : totalSpotUsd > 0 ? totalSpotUsd : null;
  const totalAccountValue = latestPortfolioTotal ? parseFloat(latestPortfolioTotal) : perpEquity + (spotValue || 0);

  const exposure = calculateExposure(positions);
  const winLoss = calculateWinRateAndProfitFactor(history);
  const maxDrawdown = calculateMaxDrawdown(monthPoints.length > 0 ? monthPoints : allTimePoints);

  const rawVlm =
    portfolioMap.get("perpMonth")?.vlm ||
    portfolioMap.get("month")?.vlm ||
    portfolioMap.get("perpAllTime")?.vlm;
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
      withdrawable,
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
      shortRatio: exposure.shortRatio,
    },
    positions,
    spot,
    history: history.slice(0, 50),
    performance: {
      day: dayPoints,
      week: weekPoints,
      month: monthPoints,
      allTime: allTimePoints,
    },
  };
}
