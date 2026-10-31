import { describe, expect, it } from "vitest";
import { MARKETS, getMarket } from "@/config/markets";

describe("MarketBar & Market Picker Architecture", () => {
  it("exports all 6 supported markets with valid specs", () => {
    expect(MARKETS.length).toBe(6);
    const symbols = MARKETS.map((m) => m.symbol);
    expect(symbols).toEqual(["BTC", "ETH", "SPX", "SOL", "HYPE", "DOGE"]);

    // Verify 1000x markets
    const kMarkets = MARKETS.filter((m) => m.maxLeverage === 1000);
    expect(kMarkets.map((m) => m.symbol)).toEqual(["BTC", "ETH"]);

    // Verify 500x markets
    const spx = getMarket("SPX");
    expect(spx.maxLeverage).toBe(500);

    // Verify other leverages
    expect(getMarket("SOL").maxLeverage).toBe(100);
    expect(getMarket("HYPE").maxLeverage).toBe(100);
    expect(getMarket("DOGE").maxLeverage).toBe(50);
  });

  it("filters correctly by category (Favorites, All, 1000x, Gainers, Losers)", () => {
    const favorites = ["BTC", "ETH", "HYPE"];
    const mockFeeds: Record<string, { price: number; open24: number }> = {
      BTC: { price: 65000, open24: 64000 }, // +1.56%
      ETH: { price: 3400, open24: 3500 }, // -2.85%
      SPX: { price: 6150, open24: 6100 }, // +0.82%
      SOL: { price: 140, open24: 145 }, // -3.45%
      HYPE: { price: 19, open24: 18 }, // +5.55%
      DOGE: { price: 0.14, open24: 0.15 }, // -6.67%
    };

    const change = (s: string) => (mockFeeds[s]!.price / mockFeeds[s]!.open24 - 1) * 100;

    // Filter 1000x
    const thousandX = MARKETS.filter((m) => m.maxLeverage === 1000);
    expect(thousandX.length).toBe(2);

    // Filter Favorites
    const favRows = MARKETS.filter((m) => favorites.includes(m.symbol));
    expect(favRows.length).toBe(3);

    // Filter Gainers
    const gainers = MARKETS.filter((m) => change(m.symbol) >= 0);
    expect(gainers.map((m) => m.symbol)).toEqual(["BTC", "SPX", "HYPE"]);

    // Filter Losers
    const losers = MARKETS.filter((m) => change(m.symbol) < 0);
    expect(losers.map((m) => m.symbol)).toEqual(["ETH", "SOL", "DOGE"]);
  });

  it("filters correctly by query text (name or symbol)", () => {
    const q1 = "bit";
    const r1 = MARKETS.filter((m) => `${m.symbol} ${m.name}`.toLowerCase().includes(q1.toLowerCase()));
    expect(r1.length).toBe(1);
    expect(r1[0]?.symbol).toBe("BTC");

    const q2 = "dog";
    const r2 = MARKETS.filter((m) => `${m.symbol} ${m.name}`.toLowerCase().includes(q2.toLowerCase()));
    expect(r2.length).toBe(1);
    expect(r2[0]?.symbol).toBe("DOGE");

    const qEmpty = "xyz";
    const rEmpty = MARKETS.filter((m) => `${m.symbol} ${m.name}`.toLowerCase().includes(qEmpty.toLowerCase()));
    expect(rEmpty.length).toBe(0);
  });

  it("provides valid leverage badge values for all markets matching SVG specifications", () => {
    for (const m of MARKETS) {
      expect(m.maxLeverage).toBeGreaterThanOrEqual(50);
      expect(m.maxLeverage).toBeLessThanOrEqual(1000);
      // All leverage values are cleanly formatted as integer multiples
      expect(m.maxLeverage % 10).toBe(0);
    }
  });
});
