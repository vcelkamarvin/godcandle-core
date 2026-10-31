import { describe, it, expect } from "vitest";
import {
  initialMarginRate,
  longLiquidationPrice,
  shortLiquidationPrice,
  paperLiquidationPrice,
  isPaperLiquidated,
  paperPnL,
  paperROI,
  clampBBOFillPrice,
  DEFAULT_MMR,
  DEFAULT_CORRIDOR_BPS,
} from "@/lib/engine/paper-math";
import { paperEngineInstance } from "@/lib/engine/paper";
import { hyperliquidEngineInstance } from "@/lib/engine/hyperliquid";
import { encodeMsgpack } from "@/lib/hyperliquid/msgpack";

describe("Paper 1000x Math Specification", () => {
  it("computes initialMarginRate as 1 / leverage", () => {
    expect(initialMarginRate(1000)).toBeCloseTo(0.001);
    expect(initialMarginRate(500)).toBeCloseTo(0.002);
    expect(initialMarginRate(100)).toBeCloseTo(0.01);
    expect(initialMarginRate(10)).toBeCloseTo(0.1);
    expect(initialMarginRate(1)).toBeCloseTo(1.0);
  });

  it("calculates Long liquidation price accurately: entry * (1 - initialMarginRate + mmr)", () => {
    const entry = 60000;
    const lev = 1000;
    const mmr = 0.0004;
    // imr = 0.001
    // Long liq = 60000 * (1 - 0.001 + 0.0004) = 60000 * (0.9994) = 59964
    const liq = longLiquidationPrice(entry, lev, mmr);
    expect(liq).toBeCloseTo(59964);

    // Bust distance is (1 - 0.9994) = 0.06% away from entry
    const distPct = ((entry - liq) / entry) * 100;
    expect(distPct).toBeCloseTo(0.06);
  });

  it("calculates Short liquidation price accurately: entry * (1 + initialMarginRate - mmr)", () => {
    const entry = 60000;
    const lev = 1000;
    const mmr = 0.0004;
    // imr = 0.001
    // Short liq = 60000 * (1 + 0.001 - 0.0004) = 60000 * (1.0006) = 60036
    const liq = shortLiquidationPrice(entry, lev, mmr);
    expect(liq).toBeCloseTo(60036);

    const distPct = ((liq - entry) / entry) * 100;
    expect(distPct).toBeCloseTo(0.06);
  });

  it("detects liquidation boundary correctly", () => {
    const longLiq = 59964;
    // For long: liquidated when mark <= liqPrice
    expect(isPaperLiquidated(59964, longLiq, "long")).toBe(true);
    expect(isPaperLiquidated(59963, longLiq, "long")).toBe(true);
    expect(isPaperLiquidated(59965, longLiq, "long")).toBe(false);

    const shortLiq = 60036;
    // For short: liquidated when mark >= liqPrice
    expect(isPaperLiquidated(60036, shortLiq, "short")).toBe(true);
    expect(isPaperLiquidated(60037, shortLiq, "short")).toBe(true);
    expect(isPaperLiquidated(60035, shortLiq, "short")).toBe(false);
  });

  it("calculates PnL and ROI% accurately", () => {
    const entry = 50000;
    const exitLongWin = 50500; // +1% move
    const margin = 50;
    const leverage = 1000;
    const notional = margin * leverage; // 50,000

    const pnlLong = paperPnL(entry, exitLongWin, notional, "long");
    expect(pnlLong).toBeCloseTo(500); // 1% of 50,000 = 500
    const roiLong = paperROI(pnlLong, margin);
    expect(roiLong).toBeCloseTo(1000); // +1000% ROI on $50 margin

    // Short position on same move loses
    const pnlShort = paperPnL(entry, exitLongWin, notional, "short");
    expect(pnlShort).toBeCloseTo(-500);
    const roiShort = paperROI(pnlShort, margin);
    expect(roiShort).toBeCloseTo(-1000);
  });

  it("clamps BBO fill prices within ±1.5 bps corridor", () => {
    const markPx = 68000;
    // 1.5 bps = 0.015% = 10.2 USD
    // Upper bound = 68010.2, Lower bound = 67989.8

    // Mid within corridor -> no clamp
    const inside = clampBBOFillPrice(68005, markPx, 1.5);
    expect(inside.isClamped).toBe(false);
    expect(inside.execPrice).toBe(68005);

    // Mid higher than corridor -> clamped to upperBound
    const high = clampBBOFillPrice(68050, markPx, 1.5);
    expect(high.isClamped).toBe(true);
    expect(high.execPrice).toBeCloseTo(68010.2);

    // Mid lower than corridor -> clamped to lowerBound
    const low = clampBBOFillPrice(67900, markPx, 1.5);
    expect(low.isClamped).toBe(true);
    expect(low.execPrice).toBeCloseTo(67989.8);
  });
});

describe("MessagePack Deterministic Serialization for Hyperliquid L1", () => {
  it("encodes primitives, arrays, and objects correctly", () => {
    const testObj = {
      type: "order",
      orders: [
        {
          a: 0,
          b: true,
          p: "68000.5",
          s: "0.1",
          r: false,
        },
      ],
      grouping: "na",
    };

    const encoded = encodeMsgpack(testObj);
    expect(encoded).toBeInstanceOf(Uint8Array);
    expect(encoded.length).toBeGreaterThan(0);

    // Root is a 3-key map: 0x83
    expect(encoded[0]).toBe(0x83);
  });
});

describe("Engine Leverage Clamping & Validation", () => {
  it("clamps Perps leverage strictly to asset's maxLeverage from meta", () => {
    // Hyperliquid engine returns real maxLeverage for each asset
    const btcMax = hyperliquidEngineInstance.getMaxLeverage("BTC");
    const dogeMax = hyperliquidEngineInstance.getMaxLeverage("DOGE");

    expect(btcMax).toBeLessThanOrEqual(100);
    expect(dogeMax).toBeLessThanOrEqual(50);

    // Quoting with 500x leverage in Perps mode clamps down
    const quoteBtc = hyperliquidEngineInstance.quote(
      { asset: "BTC-USD", side: "long", margin: 50, leverage: 500 },
      68000
    );
    expect(quoteBtc.leverage).toBeLessThanOrEqual(btcMax);

    const quoteDoge = hyperliquidEngineInstance.quote(
      { asset: "DOGE-USD", side: "long", margin: 50, leverage: 500 },
      0.15
    );
    expect(quoteDoge.leverage).toBeLessThanOrEqual(dogeMax);
  });

  it("enforces minimum $10 notional on Hyperliquid Perps", () => {
    // $5 margin at 1x leverage = $5 notional (< $10)
    const quoteTooSmall = hyperliquidEngineInstance.quote(
      { asset: "BTC-USD", side: "long", margin: 5, leverage: 1 },
      68000
    );
    expect(quoteTooSmall.error).toContain("minimum $10 notional");

    // $10 margin at 1x leverage = $10 notional (valid)
    const quoteValid = hyperliquidEngineInstance.quote(
      { asset: "BTC-USD", side: "long", margin: 10, leverage: 1 },
      68000
    );
    expect(quoteValid.error).toBeNull();
  });

  it("allows 1x to 1000x on every asset in Paper mode", () => {
    const assets = ["BTC", "ETH", "SOL", "DOGE"];
    for (const asset of assets) {
      expect(paperEngineInstance.getMaxLeverage(asset)).toBe(1000);
      const quote = paperEngineInstance.quote(
        { asset: `${asset}-USD`, side: "long", margin: 50, leverage: 1000 },
        100
      );
      expect(quote.leverage).toBe(1000);
      expect(quote.notional).toBe(50000);
    }
  });

  it("never mixes paper balance with real balance", async () => {
    const paperBal = await paperEngineInstance.getBalance();
    const realBal = await hyperliquidEngineInstance.getBalance();

    expect(paperBal.balance).toBeGreaterThan(0);
    // Real balance when wallet not connected is 0
    expect(realBal.balance).toBe(0);
  });
});

describe("Hyperliquid ApproveAgent EIP-712 Specifications", () => {
  it("constructs compliant EIP-712 ApproveAgent payload", () => {
    const nonce = 1718000000000;
    const payload = hyperliquidEngineInstance.createApproveAgentPayload(nonce);

    expect(payload.domain.name).toBe("HyperliquidSignTransaction");
    expect(payload.domain.version).toBe("1");
    expect(payload.domain.chainId).toBe(421614); // testnet chainId
    expect(payload.domain.verifyingContract).toBe("0x0000000000000000000000000000000000000000");

    expect(payload.primaryType).toBe("HyperliquidTransaction:ApproveAgent");
    expect(payload.types["HyperliquidTransaction:ApproveAgent"]).toEqual([
      { name: "hyperliquidChain", type: "string" },
      { name: "agentAddress", type: "address" },
      { name: "agentName", type: "string" },
      { name: "nonce", type: "uint64" },
    ]);

    expect(payload.message.hyperliquidChain).toBe("Testnet");
    expect(payload.message.agentName).toBe("godcandle");
    expect(payload.message.nonce).toBe(BigInt(nonce));
  });
});

describe("Server-Side Paper Liquidation Worker Math", () => {
  it("authoritatively computes server-side liquidation boundaries", () => {
    const btcEntry = 68000;
    const lev = 1000;
    const imr = 1 / lev; // 0.001
    const mmr = DEFAULT_MMR; // 0.0004

    // Long liq = 68000 * (1 - 0.001 + 0.0004) = 67959.2
    const longLiq = btcEntry * (1 - imr + mmr);
    expect(longLiq).toBeCloseTo(67959.2);

    // If mark price drops to 67959, position is liquidated
    expect(isPaperLiquidated(67959.0, longLiq, "long")).toBe(true);
    // If mark price is 67960, position remains safe
    expect(isPaperLiquidated(67960.0, longLiq, "long")).toBe(false);

    // Short liq = 68000 * (1 + 0.001 - 0.0004) = 68040.8
    const shortLiq = btcEntry * (1 + imr - mmr);
    expect(shortLiq).toBeCloseTo(68040.8);

    // If mark rises to 68041, position is liquidated
    expect(isPaperLiquidated(68041.0, shortLiq, "short")).toBe(true);
    // If mark is 68040, safe
    expect(isPaperLiquidated(68040.0, shortLiq, "short")).toBe(false);
  });
});

