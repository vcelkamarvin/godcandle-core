import { describe, it, expect } from 'vitest';
import {
  calcLiquidationPrice,
  calcLiquidationDistancePct,
  calcLiquidationDistanceAtr,
  calcBreakEvenPrice,
  calcImpactPrice,
  clampLeverage,
  roundSize,
  formatPrice,
  type L2Book,
} from './index';

describe('Trading Calculations & Risk Engine', () => {
  it('correctly calculates liquidation price for LONG and SHORT positions', () => {
    const entry = 100;
    const lev = 10;
    const mmr = 0.005; // 0.5% MMR

    // Long: 100 * (1 - 0.10 + 0.005) = 100 * 0.905 = 90.5
    const longLiq = calcLiquidationPrice(entry, lev, 'long', mmr);
    expect(longLiq).toBeCloseTo(90.5);

    // Short: 100 * (1 + 0.10 - 0.005) = 100 * 1.095 = 109.5
    const shortLiq = calcLiquidationPrice(entry, lev, 'short', mmr);
    expect(shortLiq).toBeCloseTo(109.5);
  });

  it('handles extreme leverage and bounds', () => {
    const entry = 68000;
    const lev = 50;
    const mmr = 0.005;

    // Long at 50x: 68000 * (1 - 0.02 + 0.005) = 68000 * 0.985 = 66980
    const longLiq = calcLiquidationPrice(entry, lev, 'long', mmr);
    expect(longLiq).toBeCloseTo(66980);

    const dist = calcLiquidationDistancePct(entry, longLiq, 'long');
    expect(dist).toBeCloseTo(1.5);

    // Liquidation distance in ATR volatility multiples
    const atr1h = 1020; // 1.5% ATR
    const distAtr = calcLiquidationDistanceAtr(entry, longLiq, atr1h);
    expect(distAtr).toBe(1.0);
  });

  it('correctly calculates break-even price including taker fees and funding', () => {
    const entry = 100;
    const takerFee = 0.00035; // 3.5 bps
    const builderFee = 0.0001; // 1.0 bps
    const fundingRate = 0.00005; // 0.5 bps

    // Total friction = 2 * (0.00035 + 0.0001) + 0.00005 = 0.00095
    const beLong = calcBreakEvenPrice(entry, 'long', takerFee, builderFee, fundingRate);
    expect(beLong).toBeCloseTo(100.095);

    const beShort = calcBreakEvenPrice(entry, 'short', takerFee, builderFee, fundingRate);
    expect(beShort).toBeCloseTo(99.905);
  });

  it('calculates order book impact price and slippage correctly', () => {
    const mockBook: L2Book = {
      asks: [
        { px: 100, sz: 1 }, // $100 notional
        { px: 101, sz: 2 }, // $202 notional
        { px: 102, sz: 5 }, // $510 notional
      ],
      bids: [
        { px: 99, sz: 1 },
        { px: 98, sz: 2 },
        { px: 97, sz: 5 },
      ],
    };

    // Buy $50 order: completely filled by first ask at 100
    const res1 = calcImpactPrice(mockBook, 'buy', 50, 100);
    expect(res1.impactPrice).toBe(100);
    expect(res1.slippageBps).toBe(0);
    expect(res1.filledNotional).toBe(50);
    expect(res1.unfilledNotional).toBe(0);

    // Buy $201 order: $100 at 100 (1 coin), $101 at 101 (1 coin). Total 2 coins for $201 -> avg = 100.5
    const res2 = calcImpactPrice(mockBook, 'buy', 201, 100);
    expect(res2.impactPrice).toBeCloseTo(100.5);
    expect(res2.slippageBps).toBeGreaterThan(0);
  });

  it('correctly clamps leverage to asset maximum', () => {
    expect(clampLeverage(0, 50)).toBe(1);
    expect(clampLeverage(-5, 50)).toBe(1);
    expect(clampLeverage(10, 50)).toBe(10);
    expect(clampLeverage(60, 50)).toBe(50);
    expect(clampLeverage(15.7, 20)).toBe(15);
    expect(clampLeverage(25, 20)).toBe(20);
  });

  it('rounds size according to asset szDecimals', () => {
    expect(roundSize(1.234567, 2)).toBe(1.23);
    expect(roundSize(1.234567, 4)).toBe(1.2345);
    expect(roundSize(1.234567, 0)).toBe(1);
  });

  it('formats prices cleanly', () => {
    expect(formatPrice(68420.5, 2)).toBe('68420.5');
    expect(formatPrice(2540.25, 2)).toBe('2540.25');
    expect(formatPrice(182.4, 2)).toBe('182.40');
    expect(formatPrice(0.164, 4)).toBe('0.16400');
  });
});
