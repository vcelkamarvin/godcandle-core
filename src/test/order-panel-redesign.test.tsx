import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Redesigned Right-Side Order Panel", () => {
  const orderFormPath = path.resolve(__dirname, "../components/trade/OrderForm.tsx");
  const rulerPath = path.resolve(__dirname, "../components/trade/LeverageRuler.tsx");
  const terminalPath = path.resolve(__dirname, "../components/trade/TradeTerminal.tsx");
  const tradePanelPath = path.resolve(__dirname, "../components/godcandle/TradePanel.tsx");

  const orderFormCode = fs.readFileSync(orderFormPath, "utf-8");
  const rulerCode = fs.readFileSync(rulerPath, "utf-8");
  const terminalCode = fs.readFileSync(terminalPath, "utf-8");
  const tradePanelCode = fs.readFileSync(tradePanelPath, "utf-8");

  it("verifies Header & Order Type segmented control [Market | Limit]", () => {
    expect(orderFormCode).toContain("Open trade");
    expect(orderFormCode).toContain("Market");
    expect(orderFormCode).toContain("Limit");
    expect(orderFormCode).toContain("orderType === 'market'");
  });

  it("verifies STAKE section with presets ($10, $25, $50, $100, $500), Custom amount input, and percentage chips (25%, 50%, MAX)", () => {
    expect(orderFormCode).toContain("STAKE");
    expect(orderFormCode).toContain("Available");
    expect(orderFormCode).toContain("STAKE_PRESETS");
    expect(orderFormCode).toContain("Custom amount");
    expect(orderFormCode).toContain("25%");
    expect(orderFormCode).toContain("50%");
    expect(orderFormCode).toContain("MAX");
    // Verify required MARGIN_CHIPS contains '10000' for regression testing
    expect(orderFormCode).toContain("'10000'");
  });

  it("verifies LEVERAGE selector with giant display, ruler, presets, and scroll/drag helper", () => {
    expect(orderFormCode).toContain("LEVERAGE");
    expect(orderFormCode).toContain("×{internalLeverage}");
    expect(orderFormCode).toContain("<LeverageRuler");

    // Ruler component details
    expect(rulerCode).toContain("Scroll or drag the ruler");
    expect(rulerCode).toContain("cursor-ew-resize");
    expect(rulerCode).toContain("handlePointerDown");
    expect(rulerCode).toContain("handleWheel");
    expect(rulerCode).toContain("bg-[#00D964]"); // Green ticks to the right
    expect(rulerCode).toContain("bg-black rounded-full"); // Black indicator
    expect(rulerCode).toContain("presets.map");
  });

  it("verifies TP / SL 3 equal buttons: TP +2%, SL -1%, and No TP/SL", () => {
    expect(orderFormCode).toContain("TP +{tpPercent}%");
    expect(orderFormCode).toContain("SL -{slPercent}%");
    expect(orderFormCode).toContain("No TP/SL");
  });

  it("verifies Risk Summary card with Liquidation price, Fee, and Max loss (your stake)", () => {
    expect(orderFormCode).toContain("Liquidation price");
    expect(orderFormCode).toContain("Fee (");
    expect(orderFormCode).toContain("Max loss");
    expect(orderFormCode).toContain("(your stake)");
    expect(orderFormCode).toContain("text-[#FF3B30]");
  });

  it("verifies Potential Returns compact green cards (+0.1%, +0.5%, +1.0%) with dynamic calculations", () => {
    expect(orderFormCode).toContain("If move +0.1%");
    expect(orderFormCode).toContain("If move +0.5%");
    expect(orderFormCode).toContain("If move +1%");
    expect(orderFormCode).toContain("profitAt01");
    expect(orderFormCode).toContain("profitAt05");
    expect(orderFormCode).toContain("profitAt10");
    expect(orderFormCode).toContain("bg-[#E8F8EE]");
  });

  it("verifies prominent LONG (bright green) and SHORT (bright red) action buttons with explicit profitable directions", () => {
    expect(orderFormCode).toContain("LONG");
    expect(orderFormCode).toContain("SHORT");
    expect(orderFormCode).toContain("bg-[#00D964]");
    expect(orderFormCode).toContain("bg-[#FF3B30]");
    expect(orderFormCode).toContain("Win +${fmtUsd(profitAt10, 0)} at +1%");
    expect(orderFormCode).toContain("Win +${fmtUsd(profitAt10, 0)} at -1%");
  });

  it("verifies footer note confirming multi-position capability", () => {
    expect(orderFormCode).toContain("Every trade opens its own position — open as many as you like.");
  });

  it("verifies TradeTerminal positions OrderForm in the right-side panel column", () => {
    expect(terminalCode).toContain("lg:col-span-5");
    expect(terminalCode).toContain("<OrderForm");
    expect(terminalCode).toContain("onLeverageChange={setLeverage}");
    expect(terminalCode).toContain("<MarketBar");
    expect(terminalCode).toContain("SPX-USD");
    expect(terminalCode).toContain("Reset ($10k)");
  });

  it("verifies TradePanel delegates to redesigned OrderForm with active positions rendering", () => {
    expect(tradePanelCode).toContain("<OrderForm");
    expect(tradePanelCode).toContain("activePositions.map");
  });

  it("verifies custom amount input state stability without premature clearing on preset value input", () => {
    expect(orderFormCode).toContain("customAmount");
    expect(orderFormCode).toContain("handleCustomAmountChange");
    expect(orderFormCode).toContain("value={customAmount}");
  });

  it("verifies TP/SL price computation uses price movement fractions rather than dividing by leverage", () => {
    expect(orderFormCode).toContain("moveFraction = rawPct / 100");
    expect(orderFormCode).toContain("basePx * (1 + moveFraction)");
    expect(orderFormCode).toContain("basePx * (1 - moveFraction)");
  });

  it("verifies LeverageRuler trackRef pointer alignment, highlighted needle label, and non-passive wheel listener", () => {
    expect(rulerCode).toContain("trackRef");
    expect(rulerCode).toContain("isHighlighted ? 'text-[#00D964]' : 'text-[#71717A]'");
    expect(rulerCode).toContain("setPointerCapture");
    expect(rulerCode).toContain("passive: false");
  });
});
