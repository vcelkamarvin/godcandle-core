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

  it("removes noisy editing sub-bars, preset chips, and bloat from the modal", () => {
    expect(modalContent).not.toContain("Target Goal Price:");
    expect(modalContent).not.toContain("Convex Boost Multiplier:");
    expect(modalContent).toContain("Perps. Options. Up to 1000x.");
    expect(modalContent).toContain("One terminal. Institutional-grade liquidity.");
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
    expect(container.textContent).toContain("The Cliffs at Étretat");
    expect(container.textContent).toContain("Perps. Options. Up to 1000x.");
    expect(container.textContent).toContain("One terminal. Institutional-grade liquidity.");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("renders programmatic /goal mode with calculated target goal ROI", async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<ShareModal trade={sampleTrade} onOpenChange={onOpenChangeMock} initialMode="goal" />);
    });

    expect(container.textContent).toContain("TARGET GOAL ROI");
    expect(container.textContent).toContain("TARGET GOAL");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("renders programmatic /boost mode with calculated convex boosted ROI", async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<ShareModal trade={sampleTrade} onOpenChange={onOpenChangeMock} initialMode="boost" />);
    });

    expect(container.textContent).toContain("CONVEX BOOST ROI");
    expect(container.textContent).toContain("BOOSTED LEV");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("renders programmatic /teamwork mode with syndicate pool ROI", async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<ShareModal trade={sampleTrade} onOpenChange={onOpenChangeMock} initialMode="teamwork" />);
    });

    expect(container.textContent).toContain("SYNDICATE DESK POOL ROI");
    expect(container.textContent).toContain("SYNDICATE DESK");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("toggles Hide Dollar amount via initialHideDollar prop", async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<ShareModal trade={sampleTrade} onOpenChange={onOpenChangeMock} initialHideDollar={true} />);
    });

    expect(container.textContent).not.toContain("USDC");
    expect(container.textContent).toContain("ENTRY PRICE");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("renders clean action buttons under the PnL card", async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<ShareModal trade={sampleTrade} onOpenChange={onOpenChangeMock} />);
    });

    const buttons = Array.from(container.querySelectorAll("button"));
    const copyBtn = buttons.find((b) => b.textContent?.includes("Copy Image"));
    const xBtn = buttons.find((b) => b.textContent?.includes("Share to X"));
    const dlBtn = buttons.find((b) => b.textContent?.includes("Download PNG"));

    expect(copyBtn).toBeDefined();
    expect(xBtn).toBeDefined();
    expect(dlBtn).toBeDefined();

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
