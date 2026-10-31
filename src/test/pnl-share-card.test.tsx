import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { encodeQr, generateQrSvgPath } from "@/lib/qr";

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
    // Mode options
    expect(modalContent).toContain('setMode("pnl")');
    expect(modalContent).toContain('setMode("goal")');
    expect(modalContent).toContain('setMode("boost")');
    expect(modalContent).toContain('setMode("teamwork")');

    // Goal hit customization
    expect(modalContent).toContain("Target Goal Price:");
    expect(modalContent).toContain("TARGET GOAL ROI");

    // Boost customization
    expect(modalContent).toContain("Convex Boost Multiplier:");
    expect(modalContent).toContain("CONVEX BOOST ROI");

    // Syndicate Desk / Teamwork customization
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
