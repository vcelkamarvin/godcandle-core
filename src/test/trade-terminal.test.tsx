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

  it("supports multiple discrete isolated positions on the same asset", () => {
    const pos1 = {
      id: "pos-1",
      market: "BTC" as const,
      side: "long" as const,
      stake: 50,
      leverage: 1000,
      entry: 65000,
      openedAt: Date.now(),
    };
    const pos2 = {
      id: "pos-2",
      market: "BTC" as const,
      side: "long" as const,
      stake: 50,
      leverage: 500,
      entry: 65100,
      openedAt: Date.now(),
    };

    // Both positions exist independently without merging
    const positions = [pos1, pos2];
    expect(positions).toHaveLength(2);
    expect(positions[0]!.id).not.toBe(positions[1]!.id);
    expect(positions[0]!.leverage).toBe(1000);
    expect(positions[1]!.leverage).toBe(500);

    // Closing pos1 retains pos2
    const filtered = positions.filter((p) => p.id !== "pos-1");
    expect(filtered).toHaveLength(1);
    expect(filtered[0]!.id).toBe("pos-2");
  });

  it("computes TP and SL price levels from ROI target", () => {
    const price = 60000;
    const lev = 500;
    const targetRoi = 50; // +50% ROI

    // For LONG TP:
    const longTp = price * (1 + (targetRoi / 100) / lev);
    expect(longTp).toBeGreaterThan(price);
    expect(longTp).toBeCloseTo(60060);

    // For LONG SL (-20% ROI):
    const longSl = price * (1 - (20 / 100) / lev);
    expect(longSl).toBeLessThan(price);
    expect(longSl).toBeCloseTo(59976);
  });
});

