import { describe, it, expect } from 'vitest';
import { computeClampedPrice, computeBustDistance, computeWinHaircut } from './hyperliquid';

describe('Hyperliquid L1 Engine Math', () => {
  describe('computeClampedPrice', () => {
    it('does not clamp within the 1.5 bps corridor', () => {
      const markPx = 68000;
      // 1.0 bps deviation
      const mid = markPx * (1 + 0.0001);
      const res = computeClampedPrice(mid, markPx, 1.5);
      expect(res.isClamped).toBe(false);
      expect(res.execPrice).toBeCloseTo(mid, 4);
    });

    it('clamps upper price exceeding the 1.5 bps corridor', () => {
      const markPx = 68000;
      // 5.0 bps spike
      const mid = markPx * (1 + 0.0005);
      const res = computeClampedPrice(mid, markPx, 1.5);
      expect(res.isClamped).toBe(true);
      expect(res.execPrice).toBeCloseTo(markPx * 1.00015, 4);
    });

    it('clamps lower price falling below the 1.5 bps corridor', () => {
      const markPx = 68000;
      // -5.0 bps spike
      const mid = markPx * (1 - 0.0005);
      const res = computeClampedPrice(mid, markPx, 1.5);
      expect(res.isClamped).toBe(true);
      expect(res.execPrice).toBeCloseTo(markPx * 0.99985, 4);
    });
  });

  describe('computeBustDistance', () => {
    it('calculates 1000x bust distance accurately (-5.2 bps)', () => {
      const { bustDistanceBps, bustDistancePct } = computeBustDistance(1000);
      expect(bustDistanceBps).toBeCloseTo(5.2, 1);
      expect(bustDistancePct).toBeCloseTo(0.052, 3);
    });

    it('calculates 500x bust distance accurately (-15.2 bps)', () => {
      const { bustDistanceBps, bustDistancePct } = computeBustDistance(500);
      expect(bustDistanceBps).toBeCloseTo(15.2, 1);
      expect(bustDistancePct).toBeCloseTo(0.152, 3);
    });

    it('calculates 100x bust distance accurately (-95.2 bps)', () => {
      const { bustDistanceBps, bustDistancePct } = computeBustDistance(100);
      expect(bustDistanceBps).toBeCloseTo(95.2, 1);
      expect(bustDistancePct).toBeCloseTo(0.952, 3);
    });
  });

  describe('computeWinHaircut', () => {
    it('applies 0.2 bps deadband and 2% win fee', () => {
      const notional = 50000;
      // 1.0% price move
      const res = computeWinHaircut(1.0, notional);
      expect(res.netGainPct).toBeCloseTo(0.998, 3);
      expect(res.scaleFactor).toBeGreaterThan(0.94);
      expect(res.pnlNet).toBeGreaterThan(450);
    });

    it('returns zero net gain when move is below deadband', () => {
      const notional = 50000;
      // 0.001% (0.1 bps) move, below 0.2 bps deadband
      const res = computeWinHaircut(0.001, notional);
      expect(res.netGainPct).toBe(0);
      expect(res.pnlNet).toBe(0);
    });
  });

  describe('Corridor Telemetry & Analytics Generators', () => {
    it('generates corridor telemetry ticks with ±1.5 bps bounds for BTC and ±3.0 bps for DOGE/HYPE', async () => {
      const { generateCorridorTicks } = await import('./hyperliquid');
      const btcTicks = generateCorridorTicks('BTC', 68000, 30);
      expect(btcTicks).toHaveLength(30);
      expect(btcTicks[0].upperLimitBps).toBe(1.5);
      expect(btcTicks[0].lowerLimitBps).toBe(-1.5);

      const dogeTicks = generateCorridorTicks('DOGE', 0.16, 30);
      expect(dogeTicks[0].upperLimitBps).toBe(3.0);
      expect(dogeTicks[0].lowerLimitBps).toBe(-3.0);
    });

    it('generates multi-metric time series data for all supported timeframes', async () => {
      const { generateTimeSeriesData } = await import('./hyperliquid');
      const timeframes = ['24H', '7D', '30D', '1Y', 'ALL'] as const;
      for (const tf of timeframes) {
        const data = generateTimeSeriesData(tf, 5000000, 1000000000);
        expect(data.length).toBeGreaterThan(15);
        expect(data[0].tvl).toBeGreaterThan(0);
        expect(data[0].liquidReserves).toBeGreaterThan(0);
        expect(data[0].solvencyRatio).toBeGreaterThan(100);
      }
    });

    it('ensures S&P 500 equities index is not confused with memecoin SPX6900', async () => {
      const { getMarket } = await import('@/config/markets');
      const spx = getMarket('SPX');
      expect(spx.basePrice).toBeGreaterThan(5000);
      expect(spx.name).toContain('S&P 500');
    });
  });
});

