export interface HlMarginSummary {
  accountValue: string;
  totalNtlPos: string;
  totalRawUsd: string;
  totalMarginUsed: string;
}

export interface HlPositionDetails {
  coin: string;
  szi: string;
  entryPx: string;
  positionValue: string;
  unrealizedPnl: string;
  returnOnEquity?: string;
  liquidationPx: string | null;
  marginUsed: string;
  maxLeverage?: number;
  leverage: {
    type: "cross" | "isolated";
    value: number;
    rawUsd?: string;
  };
}

export interface HlAssetPosition {
  type: string;
  position: HlPositionDetails;
}

export interface HlClearinghouseState {
  marginSummary: HlMarginSummary;
  crossMarginSummary: HlMarginSummary;
  crossMaintenanceMarginUsed: string;
  withdrawable: string;
  assetPositions: HlAssetPosition[];
  time?: number;
}

export interface HlSpotBalance {
  coin: string;
  token: number;
  total: string;
  hold: string;
  entryNtl: string;
}

export interface HlSpotClearinghouseState {
  balances: HlSpotBalance[];
}

export interface HlAssetCtx {
  funding: string;
  openInterest: string;
  prevDayPx: string;
  dayNtlVlm: string;
  premium: string;
  oraclePx: string;
  markPx: string;
  midPx: string;
  impactPxs?: string[];
}

export interface HlUniverseItem {
  name: string;
  szDecimals: number;
  maxLeverage: number;
  onlyIsolated?: boolean;
}

export type HlMetaAndAssetCtxs = [
  { universe: HlUniverseItem[] },
  HlAssetCtx[]
];

export interface HlSpotTokenMeta {
  name: string;
  szDecimals: number;
  weiDecimals: number;
  index: number;
  tokenId: string;
  isCanonical: boolean;
}

export interface HlSpotUniverseItem {
  tokens: [number, number]; // base, quote
  name: string;
  index: number;
  isCanonical: boolean;
}

export interface HlSpotMetaAndAssetCtxs {
  tokens: HlSpotTokenMeta[];
  universe: HlSpotUniverseItem[];
  ctxs?: HlAssetCtx[];
}

export type HlPortfolioPeriodData = {
  accountValueHistory: [number, string][];
  pnlHistory: [number, string][];
  vlm: string;
};

export type HlPortfolioResponse = [
  string, // e.g. "perpDay", "day", "week", "month", "allTime"
  HlPortfolioPeriodData
][];

export interface HlUserFill {
  closedPnl: string;
  coin: string;
  crossed: boolean;
  dir: string;
  hash: string;
  oid: number;
  px: string;
  side: string;
  startPosition: string;
  sz: string;
  time: number;
  fee: string;
  tid: number;
}

export interface PerpPosition {
  coin: string;
  side: "LONG" | "SHORT";
  size: number;
  entryPrice: number;
  markPrice: number | null;
  positionValue: number;
  unrealizedPnl: number;
  leverage: number;
  marginUsed: number;
  liquidationPrice: number | null;
}

export interface SpotHolding {
  coin: string;
  total: number;
  hold: number;
  token: number;
  entryPrice?: number | null;
  currentPrice: number | null;
  value: number | null;
  unrealizedPnl?: number | null;
}

export interface TradeFill {
  coin: string;
  px: number;
  sz: number;
  side: string;
  dir: string;
  startPosition?: string;
  closedPnl: number;
  time: number;
  fee: number;
  oid: number;
  tid: number;
}

export interface PnlPoint {
  timestamp: number;
  value: number;
  pnl?: number;
}

export interface TraderProfile {
  address: string;
  source: "hyperliquid";
  lastUpdated: number;
  account: {
    perpEquity: number;
    spotValue: number | null;
    totalAccountValue: number;
    marginUsed: number;
    withdrawable: number;
  };
  stats: {
    volume: number | null;
    closedTrades: number | null;
    winRate: number | null;
    profitFactor: number | null;
    maxDrawdown: number | null;
    longExposure: number;
    shortExposure: number;
    longRatio: number;
    shortRatio: number;
  };
  positions: PerpPosition[];
  spot: SpotHolding[];
  history: TradeFill[];
  performance: {
    day: PnlPoint[];
    week: PnlPoint[];
    month: PnlPoint[];
    allTime: PnlPoint[];
  };
}
