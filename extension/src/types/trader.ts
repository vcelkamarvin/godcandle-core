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
