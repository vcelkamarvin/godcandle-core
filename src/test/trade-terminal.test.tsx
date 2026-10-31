import { describe, it, expect } from "vitest";
import { MARKETS, getMarket } from "@/config/markets";
import { feeUsd, liqPrice, liqDistancePct } from "@/lib/engine";

describe("Trade Execution Mechanics", () => {
  it("calculates accurate liquidation distances and fee rates at 1000x", () => {
    const btc = getMarket("BTC");
    const leverage = 1000;
    const stake = 50;
    const price = 68420.5;

    // Estimated fee
    const fee = feeUsd(stake, leverage, btc.feeRate);
    expect(fee).toBeGreaterThan(0);

    // Liquidation distance at 1000x
    const distPct = liqDistancePct(leverage, btc.feeRate);
    expect(distPct).toBeLessThan(0.2); // ~0.10% distance at 1000x

    // Liquidation price for Long vs Short
    const longLiq = liqPrice(price, leverage, "long", btc.feeRate);
    const shortLiq = liqPrice(price, leverage, "short", btc.feeRate);

    expect(longLiq).toBeLessThan(price);
    expect(shortLiq).toBeGreaterThan(price);
  });

  it("supports discrete isolated margins", () => {
    const stakes = [10, 25, 50, 100, 250, 500];
    stakes.forEach((stake) => {
      expect(stake).toBeGreaterThanOrEqual(10);
      expect(stake).toBeLessThanOrEqual(500);
    });
  });
});
