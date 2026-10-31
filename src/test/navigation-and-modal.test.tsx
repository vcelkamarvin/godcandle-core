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

  it("places Portfolio and CANDLE dropdown on the right menu", () => {
    expect(headerContent).toContain('to="/portfolio"');
    expect(headerContent).toContain("CANDLE");
    expect(headerContent).toContain('to="/candle"');
    expect(headerContent).toContain("Platform Analysis");
    expect(headerContent).toContain('to="/staking"');
    expect(headerContent).toContain("Staking");
    expect(headerContent).toContain("Deposit");
    expect(headerContent).toContain("<ConnectModal />");
  });
});

describe("ConnectModal Light Mode & Web3 Wallets", () => {
  const modalPath = path.resolve(__dirname, "../components/wallet/ConnectModal.tsx");
  const modalContent = fs.readFileSync(modalPath, "utf-8");

  it("uses createPortal for perfect centering and escaping ancestor stacking contexts", () => {
    expect(modalContent).toContain("createPortal");
    expect(modalContent).toContain("fixed inset-0 z-[100] flex items-center justify-center");
  });

  it("displays prominent Web3 EVM wallets directly", () => {
    expect(modalContent).toContain("MetaMask");
    expect(modalContent).toContain("Rabby Wallet");
    expect(modalContent).toContain("Rainbow");
    expect(modalContent).toContain("Coinbase Wallet");
    expect(modalContent).toContain("WalletConnect");
    expect(modalContent).toContain("Phantom");
  });

  it("features Claude Monet's Impression Sunrise art on the right half", () => {
    expect(modalContent).toContain("/images/monet-sunrise.jpg");
    expect(modalContent).toContain("Claude Monet, 1872");
    expect(modalContent).toContain("Impression, Sunrise");
  });

  it("includes subtle rainbow gradient border and light mode surfaces", () => {
    expect(modalContent).toContain("bg-gradient-to-tr from-[#CDC3F0] via-[#FFDAC8] to-[#A0D4CA]");
    expect(modalContent).toContain("bg-white");
    expect(modalContent).toContain("text-[#0A0A0A]");
  });
});
