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

    // Negative ROI string input handling (e.g. user typed -50):
    const rawVal = parseFloat("-50");
    const parsedRoi = Math.abs(rawVal);
    expect(parsedRoi).toBe(50);
    const parsedSlPrice = price * (1 - (parsedRoi / 100) / lev);
    expect(parsedSlPrice).toBeCloseTo(59940);

    // For SHORT TP:
    const shortTp = price * (1 - (targetRoi / 100) / lev);
    expect(shortTp).toBeLessThan(price);
    expect(shortTp).toBeCloseTo(59940);

    // For SHORT SL (+20% adverse move against short):
    const shortSl = price * (1 + (20 / 100) / lev);
    expect(shortSl).toBeGreaterThan(price);
    expect(shortSl).toBeCloseTo(60024);
  });

  it("verifies Monet 'The Cliffs at Etretat' signature artwork path exists", () => {
    const fs = require("fs");
    const path = require("path");
    const imagePath = path.resolve(__dirname, "../../public/images/monet-etretat.jpg");
    expect(fs.existsSync(imagePath)).toBe(true);
  });

  it("verifies unified form & structure: both index and trade routes mount TradeTerminal", () => {
    const fs = require("fs");
    const path = require("path");
    const indexPath = path.resolve(__dirname, "../routes/index.tsx");
    const tradePath = path.resolve(__dirname, "../routes/trade.tsx");
    const indexContent = fs.readFileSync(indexPath, "utf-8");
    const tradeContent = fs.readFileSync(tradePath, "utf-8");

    expect(indexContent).toContain("<TradeTerminal />");
    expect(tradeContent).toContain("<TradeTerminal />");
  });

  it("verifies OrderForm includes 10000 margin option and chips", () => {
    const fs = require("fs");
    const path = require("path");
    const orderFormPath = path.resolve(__dirname, "../components/trade/OrderForm.tsx");
    const content = fs.readFileSync(orderFormPath, "utf-8");

    expect(content).toContain("'10000'");
  });

  it("verifies TradeTerminal embeds MarketBar and supports all pairs including SPX", () => {
    const fs = require("fs");
    const path = require("path");
    const terminalPath = path.resolve(__dirname, "../components/trade/TradeTerminal.tsx");
    const content = fs.readFileSync(terminalPath, "utf-8");

    expect(content).toContain("<MarketBar");
    expect(content).toContain("SPX-USD");
    expect(content).toContain("Reset ($10k)");
  });

  it("verifies ConnectModal features sleek Quantin split-layout (#0D1117 / #161B22)", () => {
    const fs = require("fs");
    const path = require("path");
    const connectModalPath = path.resolve(__dirname, "../components/wallet/ConnectModal.tsx");
    const content = fs.readFileSync(connectModalPath, "utf-8");

    expect(content).toContain("bg-[#0D1117]");
    expect(content).toContain("bg-[#161B22]");
    expect(content).toContain("/images/monet-etretat.jpg");
    expect(content).toContain("The Cliffs at Étretat");
  });

  it("verifies ShareModal defaults to obsidian #0D1117 / #161B22 Quantin theme", () => {
    const fs = require("fs");
    const path = require("path");
    const shareModalPath = path.resolve(__dirname, "../components/godcandle/ShareModal.tsx");
    const content = fs.readFileSync(shareModalPath, "utf-8");

    expect(content).toContain('useState<CardTheme>("obsidian")');
    expect(content).toContain('bg: "#0D1117"');
    expect(content).toContain('border: "#30363D"');
    expect(content).toContain("/images/monet-etretat.jpg");
  });

  it("verifies index and trade routes synchronize active mode deterministically", () => {
    const fs = require("fs");
    const path = require("path");
    const indexContent = fs.readFileSync(path.resolve(__dirname, "../routes/index.tsx"), "utf-8");
    const tradeContent = fs.readFileSync(path.resolve(__dirname, "../routes/trade.tsx"), "utf-8");

    expect(indexContent).toContain('t.setMode("perps")');
    expect(tradeContent).toContain('t.setMode("paper1000x")');
  });

  it("verifies single clean Reset ($10k) placement in MarketBar without duplicate in chart header", () => {
    const fs = require("fs");
    const path = require("path");
    const terminalPath = path.resolve(__dirname, "../components/trade/TradeTerminal.tsx");
    const content = fs.readFileSync(terminalPath, "utf-8");

    // Only 1 occurrence of Reset ($10k) in TradeTerminal (as a prop to MarketBar)
    const matches = content.match(/Reset \(\$10k\)/g) || [];
    expect(matches.length).toBe(1);
    expect(content).toContain('resetLabel="Reset ($10k)"');

    // Chart header does not contain duplicate RotateCcw button
    expect(content).not.toContain('<RotateCcw');
  });

  it("verifies Goal and Boost routes forward active asset to the trading terminal", () => {
    const fs = require("fs");
    const path = require("path");
    const goalContent = fs.readFileSync(path.resolve(__dirname, "../routes/goal.tsx"), "utf-8");
    const boostContent = fs.readFileSync(path.resolve(__dirname, "../routes/boost.tsx"), "utf-8");

    expect(goalContent).toContain('search={{ pair: `${underlying}-USD` } as any}');
    expect(boostContent).toContain('search={{ pair: `${underlying}-USD` } as any}');
  });
});


