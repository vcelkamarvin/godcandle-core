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

export type HlPortfolioResponse = [string, HlPortfolioPeriodData][];

export interface HlUserFill {
  closedPnl: string;
  coin: string;
  crossed: boolean;
  dir: string;
  fee: string;
  hash: string;
  oid: number;
  px: string;
  side: string;
  startPosition: string;
  sz: string;
  time: number;
  feeToken: string;
  builderFee?: string;
  tid: number;
}
