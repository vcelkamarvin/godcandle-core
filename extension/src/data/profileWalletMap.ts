export interface ProfileMapping {
  address: string;
  exchange: "hyperliquid";
  enabled: boolean;
  name?: string;
  avatarUrl?: string;
}

export const profileWalletMap: Record<string, ProfileMapping> = {
  // Real test account mapping
  "0xSatoshilite": {
    address: "0xefe4c06b6d310978bead596e1798a4fc1d9d194b",
    exchange: "hyperliquid",
    enabled: true,
    name: "Loracle #3"
  },
  "loracle": {
    address: "0xefe4c06b6d310978bead596e1798a4fc1d9d194b",
    exchange: "hyperliquid",
    enabled: true,
    name: "Loracle #3"
  },
  "loraclexyz": {
    address: "0xefe4c06b6d310978bead596e1798a4fc1d9d194b",
    exchange: "hyperliquid",
    enabled: true,
    name: "Loracle #3"
  },
  "hyperdash": {
    address: "0xefe4c06b6d310978bead596e1798a4fc1d9d194b",
    exchange: "hyperliquid",
    enabled: true
  },
  "TEST_X_HANDLE": {
    address: "0xefe4c06b6d310978bead596e1798a4fc1d9d194b",
    exchange: "hyperliquid",
    enabled: true
  },
  "cbb0fe": {
    address: "0x49e96e255ba418d08e66c35b588e2f2f3766e1d0",
    exchange: "hyperliquid",
    enabled: true,
    name: "Cbb0fe"
  },
  "Cbb0fe": {
    address: "0x49e96e255ba418d08e66c35b588e2f2f3766e1d0",
    exchange: "hyperliquid",
    enabled: true,
    name: "Cbb0fe"
  },
  "moneyprinter0x": {
    address: "0xb2f7374b222a930d20e8d556f33228211d1baf9f",
    exchange: "hyperliquid",
    enabled: true,
    name: "MoneyPrinter0x"
  },
  "MoneyPrinter0x": {
    address: "0xb2f7374b222a930d20e8d556f33228211d1baf9f",
    exchange: "hyperliquid",
    enabled: true,
    name: "MoneyPrinter0x"
  }
};
