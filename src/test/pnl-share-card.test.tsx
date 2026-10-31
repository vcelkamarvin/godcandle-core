import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { encodeQr, generateQrSvgPath } from "@/lib/qr";
import { ShareModal } from "@/components/godcandle/ShareModal";
import type { ClosedTrade } from "@/lib/trade";

describe("QR Code Generator (ISO/IEC 18004 Standard)", () => {
  it("encodes valid QR matrix for referral URL", () => {
    const url = "https://godcandle.trade?ref=GOD-8K2F";
    const matrix = encodeQr(url);
    expect(matrix).toBeDefined();
    expect(matrix.length).toBeGreaterThan(20);
    expect(matrix[0]?.length).toBe(matrix.length);
  });

  it("generates valid vector SVG path from QR matrix", () => {
    const matrix = encodeQr("https://godcandle.trade");
    const svg = generateQrSvgPath(matrix, 2);
    expect(svg.path).toContain("M");
    expect(svg.viewBoxSize).toBe(matrix.length + 4);
  });
});

describe("PnL Share Card Structure & Specification", () => {
  const modalPath = path.resolve(__dirname, "../components/godcandle/ShareModal.tsx");
  const modalContent = fs.readFileSync(modalPath, "utf-8");

  it("features Apple 16:10 aspect ratio and refined Quantyn aesthetic", () => {
    expect(modalContent).toContain("aspect-[16/10]");
    expect(modalContent).toContain("1600 × 1000 px");
    expect(modalContent).toContain("Editorial 16:10 Apple-inspired outcome card");
  });

  it("incorporates Claude Monet artwork panel with impressionist styling", () => {
    expect(modalContent).toContain("/images/monet-etretat.jpg");
    expect(modalContent).toContain("/images/monet-sunrise.jpg");
    expect(modalContent).toContain("The Cliffs at Étretat");
    expect(modalContent).toContain("Claude Monet, 1885");
  });

  it("features delicate signature iridescent rainbow gradient styling", () => {
    expect(modalContent).toContain("#CDC3F0");
    expect(modalContent).toContain("#FFDAC8");
    expect(modalContent).toContain("#A0D4CA");
    expect(modalContent).toContain("bg-gradient-to-tr from-[#CDC3F0] via-[#FFDAC8] to-[#A0D4CA]");
    expect(modalContent).toContain("from-[#CDC3F0]/25 via-[#FFDAC8]/20 to-[#A0D4CA]/25");
  });

  it("supports /goal, /boost, and /teamwork modes", () => {
    expect(modalContent).toContain('setMode("pnl")');
    expect(modalContent).toContain('setMode("goal")');
    expect(modalContent).toContain('setMode("boost")');
    expect(modalContent).toContain('setMode("teamwork")');
    expect(modalContent).toContain("Target Goal Price:");
    expect(modalContent).toContain("TARGET GOAL ROI");
    expect(modalContent).toContain("Convex Boost Multiplier:");
    expect(modalContent).toContain("CONVEX BOOST ROI");
    expect(modalContent).toContain("Syndicate Desk:");
    expect(modalContent).toContain("Alpha Syndicate");
    expect(modalContent).toContain("SYNDICATE DESK POOL ROI");
  });

  it("provides export parity with high-resolution 1600x1000 canvas generator", () => {
    expect(modalContent).toContain("width = 1600");
    expect(modalContent).toContain("height = 1000");
    expect(modalContent).toContain("handleDownload");
    expect(modalContent).toContain("handleCopyImage");
    expect(modalContent).toContain("handleCopyText");
    expect(modalContent).toContain("shareToX");
    expect(modalContent).toContain("drawQrMatrixToCanvas");
  });
});

describe("PnL Share Card Interactive Component (DOM & State)", () => {
  const sampleTrade: ClosedTrade = {
    id: "trade-1",
    market: "BTC",
    side: "long",
    stake: 100,
    leverage: 100,
    entry: 64000,
    exit: 70400,
    openedAt: Date.now() - 300000,
    closedAt: Date.now(),
    durationMs: 300000,
    pnl: 1000,
    liquidated: false,
  };

  const onOpenChangeMock = vi.fn();
  let container: HTMLDivElement;

  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => null);
    onOpenChangeMock.mockClear();
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  it("renders PnL share modal with trade data, pair symbol, and ROI", async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<ShareModal trade={sampleTrade} onOpenChange={onOpenChangeMock} />);
    });

    expect(container.textContent).toContain("godcandle PnL Share Card");
    expect(container.textContent).toContain("BTC-USD");
    expect(container.textContent).toContain("LONG");
    expect(container.textContent).toContain("100×");
    expect(container.textContent).toContain("REALIZED ROI");
    expect(container.textContent).toContain("TRADE SMARTER TOGETHER · ZERO FEES");
    expect(container.textContent).toContain("Claude Monet, 1885");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("switches to /goal mode and updates target prices with presets", async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<ShareModal trade={sampleTrade} onOpenChange={onOpenChangeMock} />);
    });

    const buttons = Array.from(container.querySelectorAll("button"));
    const goalBtn = buttons.find((b) => b.textContent?.includes("Goal Hit"))!;
    expect(goalBtn).toBeDefined();

    await act(async () => {
      goalBtn.click();
    });

    expect(container.textContent).toContain("TARGET GOAL ROI");
    expect(container.textContent).toContain("Target Goal Price:");

    const updatedButtons = Array.from(container.querySelectorAll("button"));
    const preset25Btn = updatedButtons.find((b) => b.textContent?.trim() === "+25%")!;
    expect(preset25Btn).toBeDefined();

    await act(async () => {
      preset25Btn.click();
    });

    const input = container.querySelector("input[placeholder='Target Price']") as HTMLInputElement;
    expect(Number(input.value)).toBe(Math.round(64000 * 1.25));

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("switches to /boost mode and scales ROI with multipliers", async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<ShareModal trade={sampleTrade} onOpenChange={onOpenChangeMock} />);
    });

    const buttons = Array.from(container.querySelectorAll("button"));
    const boostBtn = buttons.find((b) => b.textContent?.includes("Convex Boost"))!;
    expect(boostBtn).toBeDefined();

    await act(async () => {
      boostBtn.click();
    });

    expect(container.textContent).toContain("CONVEX BOOST ROI");
    expect(container.textContent).toContain("Convex Boost Multiplier:");

    const updatedButtons = Array.from(container.querySelectorAll("button"));
    const mult10Btn = updatedButtons.find((b) => b.textContent?.trim() === "10x")!;
    expect(mult10Btn).toBeDefined();

    await act(async () => {
      mult10Btn.click();
    });

    const input = container.querySelector("input[placeholder='5.0']") as HTMLInputElement;
    expect(Number(input.value)).toBe(10);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("switches to /teamwork mode and updates syndicate desk pool", async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<ShareModal trade={sampleTrade} onOpenChange={onOpenChangeMock} />);
    });

    const buttons = Array.from(container.querySelectorAll("button"));
    const teamworkBtn = buttons.find((b) => b.textContent?.includes("Syndicate Desk"))!;
    expect(teamworkBtn).toBeDefined();

    await act(async () => {
      teamworkBtn.click();
    });

    expect(container.textContent).toContain("SYNDICATE DESK POOL ROI");
    expect(container.textContent).toContain("Syndicate Desk:");

    const updatedButtons = Array.from(container.querySelectorAll("button"));
    const cupDeskBtn = updatedButtons.find((b) => b.textContent?.includes("Candle Cup Desk"))!;
    expect(cupDeskBtn).toBeDefined();

    await act(async () => {
      cupDeskBtn.click();
    });

    expect(container.textContent).toContain("Candle Cup Desk");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("toggles Hide Dollar amount and Metrics display", async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<ShareModal trade={sampleTrade} onOpenChange={onOpenChangeMock} />);
    });

    const checkboxes = Array.from(container.querySelectorAll("input[type='checkbox']")) as HTMLInputElement[];
    const hideDollarCheck = checkboxes[0]!;
    const metricsCheck = checkboxes[1]!;

    expect(container.textContent).toContain("USDC");
    expect(container.textContent).toContain("ENTRY PRICE");

    await act(async () => {
      hideDollarCheck.click();
    });
    expect(container.textContent).not.toContain("USDC");

    await act(async () => {
      metricsCheck.click();
    });
    expect(container.textContent).not.toContain("ENTRY PRICE");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("switches theme and Monet artwork cleanly", async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<ShareModal trade={sampleTrade} onOpenChange={onOpenChangeMock} />);
    });

    const buttons = Array.from(container.querySelectorAll("button"));
    const obsidianBtn = buttons.find((b) => b.textContent?.trim() === "Obsidian")!;
    const auroraBtn = buttons.find((b) => b.textContent?.trim() === "Aurora")!;
    const sunriseBtn = buttons.find((b) => b.textContent?.includes("Sunrise"))!;

    await act(async () => {
      obsidianBtn.click();
    });
    await act(async () => {
      auroraBtn.click();
    });
    await act(async () => {
      sunriseBtn.click();
    });

    expect(container.textContent).toContain("Claude Monet, 1872");
    expect(container.textContent).toContain("Impression, Sunrise");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("dismisses modal on Escape key press", async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<ShareModal trade={sampleTrade} onOpenChange={onOpenChangeMock} />);
    });

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(onOpenChangeMock).toHaveBeenCalledWith(false);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("dismisses modal when close button is clicked", async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<ShareModal trade={sampleTrade} onOpenChange={onOpenChangeMock} />);
    });

    const dialog = container.querySelector("[role='dialog']")!;
    const closeBtn = dialog.querySelector("button")!;

    await act(async () => {
      closeBtn.click();
    });
    expect(onOpenChangeMock).toHaveBeenCalledWith(false);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("dismisses modal when backdrop is clicked", async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<ShareModal trade={sampleTrade} onOpenChange={onOpenChangeMock} />);
    });

    const backdrop = container.querySelector("[role='dialog']") as HTMLElement;

    await act(async () => {
      backdrop.click();
    });
    expect(onOpenChangeMock).toHaveBeenCalledWith(false);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
