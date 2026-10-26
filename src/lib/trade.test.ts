import { describe, expect, it } from "vitest";
import { isLiquidated, liqDistancePct, liqPrice, notional, pnlOf } from "./trade";

describe("trade formulas", () => {
  it("notional is stake x leverage", () => {
    expect(notional(100, 500)).toBe(50000);
  });
  it("liquidation distance is 100 / leverage", () => {
    expect(liqDistancePct(500)).toBeCloseTo(0.2);
    expect(liqDistancePct(1000)).toBeCloseTo(0.1);
  });
  it("liquidation price sits that distance from entry", () => {
    expect(liqPrice(64000, 1000, "long")).toBeCloseTo(63936);
    expect(liqPrice(64000, 500, "short")).toBeCloseTo(64128);
  });
  it("max loss equals the stake", () => {
    const p = { id: "a", side: "long" as const, stake: 50, leverage: 1000, entry: 64000, openedAt: 0 };
    expect(pnlOf(p, 60000)).toBe(-50);
    expect(isLiquidated(p, 63936)).toBe(true);
  });
});
