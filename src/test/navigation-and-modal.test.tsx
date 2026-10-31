import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Header Layout & Navigation Structure", () => {
  const headerPath = path.resolve(__dirname, "../components/layout/Header.tsx");
  const headerContent = fs.readFileSync(headerPath, "utf-8");

  it("removes the top micro-ticker row", () => {
    expect(headerContent).not.toContain("Candle Cup W12:");
    expect(headerContent).not.toContain("#1 0x9c97…4fa2");
    expect(headerContent).not.toContain("+482.5% ROI");
    expect(headerContent).not.toContain("L1Read: 0x0806");
  });

  it("places Trade, Analysis, and Leaderboard on the left menu", () => {
    expect(headerContent).toContain('to="/"');
    expect(headerContent).toContain('to="/analytics"');
    expect(headerContent).toContain('to="/leaderboard"');
  });

  it("places Portfolio and CANDLE dropdown on the right menu with ONLY Platform Analysis and Staking", () => {
    expect(headerContent).toContain('to="/portfolio"');
    expect(headerContent).toContain("CANDLE");
    expect(headerContent).toContain('to="/candle"');
    expect(headerContent).toContain("Platform Analysis");
    expect(headerContent).toContain('to="/staking"');
    expect(headerContent).toContain("Staking");
    expect(headerContent).toContain("Deposit");
    expect(headerContent).toContain("<ConnectModal />");

    // The rest (Cup, Docs) MUST NOT be in the CANDLE dropdown menu
    expect(headerContent).not.toContain('role="menuitem"\n                    onClick={() => setCandleOpen(false)}\n                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-secondary transition-colors text-left"\n                  >\n                    <div className="flex size-7 items-center justify-center rounded-lg bg-[#FFFBEA]');
    expect(headerContent).not.toContain('to="/cup"');
    expect(headerContent).not.toContain('to="/docs"');
  });

  it("integrates Candle Cup into Leaderboard and Footer instead of main header menu", () => {
    const leaderboardContent = fs.readFileSync(path.resolve(__dirname, "../routes/leaderboard.tsx"), "utf-8");
    const footerContent = fs.readFileSync(path.resolve(__dirname, "../components/layout/Footer.tsx"), "utf-8");

    expect(leaderboardContent).toContain('to="/cup"');
    expect(leaderboardContent).toContain("The Candle Cup");
    expect(footerContent).toContain('to="/cup"');
    expect(footerContent).toContain('to="/docs"');
  });

  it("features product switch [Perps | 1000x] in the navigation bar", () => {
    expect(headerContent).toContain("Perps");
    expect(headerContent).toContain("1000x");
    expect(headerContent).toContain('to="/"');
    expect(headerContent).toContain('to="/trade"');
  });
});

describe("ConnectModal Light Mode & Web3 Wallets", () => {
  const modalPath = path.resolve(__dirname, "../components/wallet/ConnectModal.tsx");
  const modalContent = fs.readFileSync(modalPath, "utf-8");

  it("uses createPortal for perfect centering and escaping ancestor stacking contexts", () => {
    expect(modalContent).toContain("createPortal");
    expect(modalContent).toContain("fixed inset-0 z-[100] flex items-center justify-center");
  });

  it("positions close button cleanly in the top right corner", () => {
    expect(modalContent).toContain("absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-30");
  });

  it("displays prominent Web3 EVM wallets directly with authentic vector SVGs", () => {
    expect(modalContent).toContain("MetaMask");
    expect(modalContent).toContain("Rabby Wallet");
    expect(modalContent).toContain("Rainbow");
    expect(modalContent).toContain("Coinbase Wallet");
    expect(modalContent).toContain("WalletConnect");
    expect(modalContent).toContain("Phantom");
  });

  it("removes technical clutter text from modal and header", () => {
    expect(modalContent).not.toContain("HyperEVM (Chain 999)");
    expect(modalContent).not.toContain("HyperEVM Chain 999");
    expect(modalContent).not.toContain("Performing HyperEVM (999)");

    const footerPath = path.resolve(__dirname, "../components/layout/Footer.tsx");
    const footerContent = fs.readFileSync(footerPath, "utf-8");
    expect(footerContent).not.toContain("HyperEVM Chain ID 999");
    expect(footerContent).not.toContain("Precompile Sync: 48ms");
  });

  it("features Claude Monet's The Cliffs at Étretat art on the right half with subtle rainbow sheen and light mode styling", () => {
    expect(modalContent).toContain("/images/monet-etretat.jpg");
    expect(modalContent).toContain("Claude Monet, 1885");
    expect(modalContent).toContain("The Cliffs at Étretat");
    expect(modalContent).toContain("bg-gradient-to-tr from-[#CDC3F0]/25 via-[#FFDAC8]/20 to-[#A0D4CA]/25");
  });

  it("includes subtle rainbow gradient border and light mode surfaces", () => {
    expect(modalContent).toContain("bg-gradient-to-tr from-[#CDC3F0] via-[#FFDAC8] to-[#A0D4CA]");
    expect(modalContent).toContain("bg-white");
    expect(modalContent).toContain("text-[#0A0A0A]");
  });

  it("removes Demo Trader Account and social continue with options, simplifying subtitle", () => {
    expect(modalContent).toContain("Connect Web3 wallet.");
    expect(modalContent).not.toContain("Demo Trader Account");
    expect(modalContent).not.toContain("or continue with");
    expect(modalContent).not.toContain("Email Passcode");
    expect(modalContent).not.toContain("Log in with Google");
    expect(modalContent).not.toContain("Log in with Apple");
  });
});

describe("MarketBar Rich Detail Preview and Centering", () => {
  const marketBarPath = path.resolve(__dirname, "../components/godcandle/MarketBar.tsx");
  const marketBarContent = fs.readFileSync(marketBarPath, "utf-8");

  it("strictly centers the ticker picking dialog horizontally and vertically with fixed coordinates", () => {
    expect(marketBarContent).toContain("fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2");
    expect(marketBarContent).not.toMatch(/DialogContent[^>]*\brelative\b/);
  });

  it("includes rich detail preview with 24h range, volume, funding rate, and execution metrics", () => {
    expect(marketBarContent).toContain("24h Low");
    expect(marketBarContent).toContain("24h High");
    expect(marketBarContent).toContain("24h Volume");
    expect(marketBarContent).toContain("Funding Rate");
    expect(marketBarContent).toContain("Index Price");
    expect(marketBarContent).toContain("Switch to");
  });

  it("supports keyboard navigation (ArrowUp, ArrowDown, Enter) and mouse hover", () => {
    expect(marketBarContent).toContain("ArrowDown");
    expect(marketBarContent).toContain("ArrowUp");
    expect(marketBarContent).toContain("onMouseEnter");
  });
});

describe("Authentic Crypto Vector Logos", () => {
  const logoPath = path.resolve(__dirname, "../components/godcandle/MarketLogo.tsx");
  const logoContent = fs.readFileSync(logoPath, "utf-8");

  it("exports authentic vector SVG paths for all key crypto assets", () => {
    expect(logoContent).toContain("BTC");
    expect(logoContent).toContain("ETH");
    expect(logoContent).toContain("SOL");
    expect(logoContent).toContain("HYPE");
    expect(logoContent).toContain("SPX");
    expect(logoContent).toContain("DOGE");
    expect(logoContent).toContain("AVAX");
    expect(logoContent).toContain("BNB");
  });
});
