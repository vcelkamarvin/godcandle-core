import { fetchTraderProfile } from "../src/services/hyperliquidDataProvider";
import { calculateExposure, calculateWinRateAndProfitFactor, calculateMaxDrawdown } from "../src/services/tradingAnalytics";
import { resolveWalletForProfile } from "../src/services/walletResolver";
import assert from "assert";

async function runTests() {
  console.log("=== Testing Godcandle Hyperliquid Extension ===");

  const testWallet = "0xefe4c06b6d310978bead596e1798a4fc1d9d194b";

  // Test 1: Wallet Resolution
  console.log("\n1. Testing Wallet Resolution...");
  const res1 = await resolveWalletForProfile("0xSatoshiLite");
  assert.strictEqual(res1.address, testWallet);
  console.log("✓ Manual mapping resolved successfully:", res1);

  // Test newly added tracked wallets
  const cbb0feWallet = "0x49e96e255ba418d08e66c35b588e2f2f3766e1d0";
  const moneyPrinterWallet = "0xb2f7374b222a930d20e8d556f33228211d1baf9f";

  const resCbbLower = await resolveWalletForProfile("cbb0fe");
  assert.strictEqual(resCbbLower.address, cbb0feWallet);
  const resCbbExact = await resolveWalletForProfile("Cbb0fe");
  assert.strictEqual(resCbbExact.address, cbb0feWallet);
  const resCbbAt = await resolveWalletForProfile("@cbb0fe");
  assert.strictEqual(resCbbAt.address, cbb0feWallet);
  console.log("✓ Cbb0fe resolved successfully across cases:", resCbbExact);

  const resMoneyLower = await resolveWalletForProfile("moneyprinter0x");
  assert.strictEqual(resMoneyLower.address, moneyPrinterWallet);
  const resMoneyExact = await resolveWalletForProfile("MoneyPrinter0x");
  assert.strictEqual(resMoneyExact.address, moneyPrinterWallet);
  const resMoneyAt = await resolveWalletForProfile("@MoneyPrinter0x");
  assert.strictEqual(resMoneyAt.address, moneyPrinterWallet);
  console.log("✓ MoneyPrinter0x resolved successfully across cases:", resMoneyExact);

  const res2 = await resolveWalletForProfile("unknownTrader", "Hey check my HL wallet 0xefe4c06b6d310978bead596e1798a4fc1d9d194b thanks");
  assert.strictEqual(res2.address, testWallet);
  assert.strictEqual(res2.method, "auto-detected");
  console.log("✓ Auto-detected address from profile bio:", res2);

  // Test 2: Analytics Unit Functions
  console.log("\n2. Testing Analytics Functions...");
  const mockPositions = [
    { coin: "BTC", side: "LONG" as const, size: 10, entryPrice: 60000, markPrice: 65000, positionValue: 650000, unrealizedPnl: 50000, leverage: 10, marginUsed: 65000, liquidationPrice: 50000 },
    { coin: "ETH", side: "SHORT" as const, size: 50, entryPrice: 3000, markPrice: 2800, positionValue: 140000, unrealizedPnl: 10000, leverage: 5, marginUsed: 28000, liquidationPrice: 3500 }
  ];
  const exposure = calculateExposure(mockPositions);
  assert.strictEqual(exposure.longExposure, 650000);
  assert.strictEqual(exposure.shortExposure, 140000);
  assert.strictEqual(exposure.longRatio, 82);
  assert.strictEqual(exposure.shortRatio, 18);
  console.log("✓ Long/Short exposure calculated properly:", exposure);

  const mockFills = [
    { coin: "BTC", px: 60000, sz: 1, side: "B", dir: "Open", closedPnl: 0, time: 1000, fee: 1, oid: 1, tid: 1 },
    { coin: "BTC", px: 65000, sz: 1, side: "A", dir: "Close", closedPnl: 5000, time: 2000, fee: 1, oid: 2, tid: 2 },
    { coin: "ETH", px: 3000, sz: 1, side: "B", dir: "Open", closedPnl: 0, time: 3000, fee: 1, oid: 3, tid: 3 },
    { coin: "ETH", px: 2900, sz: 1, side: "A", dir: "Close", closedPnl: -100, time: 4000, fee: 1, oid: 4, tid: 4 }
  ];
  const winLoss = calculateWinRateAndProfitFactor(mockFills);
  assert.strictEqual(winLoss.winRate, 50);
  assert.strictEqual(winLoss.profitFactor, 50);
  console.log("✓ Win rate and profit factor calculated properly:", winLoss);

  // Test 3: Real Hyperliquid Live API Call for Wallet
  console.log(`\n3. Testing Real Hyperliquid API Fetch for ${testWallet}...`);
  const profile = await fetchTraderProfile(testWallet);

  console.log("✓ Fetched profile successfully!");
  console.log("  - Source:", profile.source);
  console.log("  - Address:", profile.address);
  console.log("  - Account Value: $" + Math.round(profile.account.totalAccountValue).toLocaleString());
  console.log("  - Perp Equity: $" + Math.round(profile.account.perpEquity).toLocaleString());
  console.log("  - Positions count:", profile.positions.length);
  if (profile.positions.length > 0) {
    console.log("  - Top position:", profile.positions[0].coin, profile.positions[0].side, "size:", profile.positions[0].size, "PnL: $" + Math.round(profile.positions[0].unrealizedPnl));
  }
  console.log("  - History fills count:", profile.history.length);
  console.log("  - Performance week points:", profile.performance.week.length);
  console.log("  - Win Rate:", profile.stats.winRate !== null ? profile.stats.winRate + "%" : "N/A");
  console.log("  - Long / Short split:", `${profile.stats.longRatio}% / ${profile.stats.shortRatio}%`);

  assert.ok(profile.account.perpEquity > 0, "Account perp equity should be greater than 0");
  assert.ok(profile.positions.length > 0, "Wallet should have open positions");
  assert.ok(profile.performance.month.length > 0, "Wallet should have portfolio performance data");

  console.log("\nALL ACCEPTANCE CHECKS PASSED!");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
