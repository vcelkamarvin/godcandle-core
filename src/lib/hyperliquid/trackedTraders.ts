export interface TrackedTrader {
  address: string;
  name: string;
  handle: string;
  xUrl: string;
  badge?: string;
  initials: string;
  exchange: "hyperliquid";
}

export const TRACKED_TRADERS: TrackedTrader[] = [
  {
    address: "0xefe4c06b6d310978bead596e1798a4fc1d9d194b",
    name: "Loracle #3",
    handle: "0xSatoshilite",
    xUrl: "https://x.com/0xSatoshilite",
    badge: "Apex Whale",
    initials: "LO",
    exchange: "hyperliquid",
  },
  {
    address: "0x49e96e255ba418d08e66c35b588e2f2f3766e1d0",
    name: "Cbb0fe",
    handle: "Cbb0fe",
    xUrl: "https://x.com/Cbb0fe",
    badge: "Tracked Alpha",
    initials: "CB",
    exchange: "hyperliquid",
  },
  {
    address: "0xb2f7374b222a930d20e8d556f33228211d1baf9f",
    name: "MoneyPrinter0x",
    handle: "MoneyPrinter0x",
    xUrl: "https://x.com/MoneyPrinter0x",
    badge: "Hyperliquid High-Roller",
    initials: "MP",
    exchange: "hyperliquid",
  },
];
