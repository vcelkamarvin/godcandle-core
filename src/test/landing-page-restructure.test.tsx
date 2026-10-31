import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Landing Page Restructure Specification", () => {
  const landingPath = path.resolve(__dirname, "../components/landing/LandingPage.tsx");
  const landingContent = fs.readFileSync(landingPath, "utf-8");

  const headerPath = path.resolve(__dirname, "../components/layout/Header.tsx");
  const headerContent = fs.readFileSync(headerPath, "utf-8");

  const footerPath = path.resolve(__dirname, "../components/layout/Footer.tsx");
  const footerContent = fs.readFileSync(footerPath, "utf-8");

  const modalPath = path.resolve(__dirname, "../components/wallet/ConnectModal.tsx");
  const modalContent = fs.readFileSync(modalPath, "utf-8");

  it("1. Top Header matches exact requirements", () => {
    // Status bar text
    expect(headerContent).toContain("● HYPERLIQUID L1 CONNECTED · BUILDER CODE ACTIVE");
    expect(headerContent).toContain("GODCANDLE");

    // Navigation links
    expect(headerContent).toContain("Trade (Live)");
    expect(headerContent).toContain("Roadmap");
    expect(headerContent).toContain("Docs");

    // Web3 Connect Wallet Button in top right
    expect(headerContent).toContain("<ConnectModal />");
  });

  it("2. Hero Section (Current Live Client) matches exact copy and live order form", () => {
    // Value Prop
    expect(landingContent).toContain("Pro Trading Terminal for Hyperliquid.");
    expect(landingContent).toContain(
      "Trade directly on Hyperliquid L1 order books with zero added latency. Support the godcandle ecosystem by executing through our native Builder Code."
    );

    // Live Order Form Preview with standard Hyperliquid limits (1x to 50x)
    expect(landingContent).toContain("LIVE ORDER FORM");
    expect(landingContent).toContain("1x–50x");
    expect(landingContent).toContain("maxLeverage");
    expect(landingContent).toContain("Position Notional");
    expect(landingContent).toContain("Liquidation Price");
    expect(landingContent).toContain("Est. Fee");
    expect(landingContent).toContain("LONG / BUY");
    expect(landingContent).toContain("SHORT / SELL");
  });

  it("3. Detailed Roadmap Section contains all four masterplan phases with technical specifications", () => {
    expect(landingContent).toContain("The godcandle Masterplan");

    // Phase 0: Live Now
    expect(landingContent).toContain("[PHASE_00 // STATUS: LIVE_NOW]");
    expect(landingContent).toContain("Native Hyperliquid Client");
    expect(landingContent).toContain("Direct order book routing, UI/UX optimized for power users, generating protocol cashflow via Builder Codes.");

    // Phase 1: In Development (The Synthetic Engine)
    expect(landingContent).toContain("[PHASE_01 // THE SYNTHETIC ENGINE]");
    expect(landingContent).toContain("1000x Synthetic Perps & The House Pool");
    expect(landingContent).toContain("Initial $10k-$25k Bootstrap Pool");
    expect(landingContent).toContain("Mark-Clamped BBO Execution");
    expect(landingContent).toContain("0x080e");
    expect(landingContent).toContain("0x0806");
    expect(landingContent).toContain("markPx");
    expect(landingContent).toContain("±1.5 bps");
    expect(landingContent).toContain("Pure FIFO Settlement");

    // Phase 2: Upcoming
    expect(landingContent).toContain("[PHASE_02 // TOURNAMENTS]");
    expect(landingContent).toContain("The Candle Cup");
    expect(landingContent).toContain("Weekly automated ROI leaderboards");
    expect(landingContent).toContain("Every real trade automatically qualifies");
    expect(landingContent).toContain("Prize pools paid out entirely in native USDC from House Pool revenues.");

    // Phase 3: Future Expansion
    expect(landingContent).toContain("[PHASE_03 // HARDWARE & OPTIONS]");
    expect(landingContent).toContain("0DTE Options & Godcandle Hardware");
    expect(landingContent).toContain("Outcome-map time barriers (5m - 60m)");
    expect(landingContent).toContain("physical milled-aluminum Godcandle Terminal");
    expect(landingContent).toContain("Direct WebSocket RPC execution");
  });

  it("4. Dense technical Footer contains required external links and risk disclaimers", () => {
    expect(footerContent).toContain("github.com/vcelkamarvin/godcandle-core");
    expect(footerContent).toContain("x.com/godcandle_app");
    expect(footerContent).toContain('to="/docs"');
    expect(footerContent).toContain("RISK DISCLAIMER:");
    expect(footerContent).toContain("perpetual futures and leveraged financial instruments");
  });

  it("5. ConnectModal renders Claude Monet artwork and Web3 wallet providers cleanly", () => {
    expect(modalContent).toContain("/images/monet-etretat.jpg");
    expect(modalContent).toContain("Claude Monet, 1885");
    expect(modalContent).toContain("The Cliffs at Étretat");
    expect(modalContent).toContain("MetaMask");
    expect(modalContent).toContain("Rabby Wallet");
    expect(modalContent).toContain("Rainbow");
    expect(modalContent).toContain("Coinbase Wallet");
    expect(modalContent).toContain("WalletConnect");
    expect(modalContent).toContain("Phantom");
  });
});
