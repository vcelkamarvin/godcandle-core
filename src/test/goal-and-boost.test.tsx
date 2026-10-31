import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Target Goal Studio & Convexity Boost Multiplier", () => {
  const goalPath = path.resolve(__dirname, "../routes/goal.tsx");
  const boostPath = path.resolve(__dirname, "../routes/boost.tsx");
  const canvasPath = path.resolve(__dirname, "../components/godcandle/ChartCanvas.tsx");

  const goalContent = fs.readFileSync(goalPath, "utf-8");
  const boostContent = fs.readFileSync(boostPath, "utf-8");
  const canvasContent = fs.readFileSync(canvasPath, "utf-8");

  it("uses Radix UI Slider instead of raw unstyled range input in both studios", () => {
    expect(goalContent).toContain('import { Slider } from "@/components/ui/slider"');
    expect(goalContent).toContain("<Slider");
    expect(goalContent).not.toContain('<input\n                type="range"');

    expect(boostContent).toContain('import { Slider } from "@/components/ui/slider"');
    expect(boostContent).toContain("<Slider");
    expect(boostContent).not.toContain('<input\n                type="range"');
  });

  it("supports bidirectional market direction (LONG & SHORT) in Target Goal Studio", () => {
    expect(goalContent).toContain('type Direction = "LONG" | "SHORT"');
    expect(goalContent).toContain('direction === "LONG"');
    expect(goalContent).toContain("Long ↗ (Upside)");
    expect(goalContent).toContain("Short ↘ (Downside)");
    expect(goalContent).toContain('direction === "LONG" ? 1.15 : 0.85');
  });

  it("supports bidirectional market direction (LONG & SHORT) in Convexity Boost", () => {
    expect(boostContent).toContain('type Direction = "LONG" | "SHORT"');
    expect(boostContent).toContain('direction === "LONG"');
    expect(boostContent).toContain("Long ↗ (Upside)");
    expect(boostContent).toContain("Short ↘ (Downside)");
    expect(boostContent).toContain('direction === "LONG" ? 1.15 : 0.85');
  });

  it("does NOT wipe out user target price when live spot price ticks arrive", () => {
    // Verified that prevUnderlyingRef and prevDirectionRef prevent overwriting user input
    expect(goalContent).toContain("prevUnderlyingRef");
    expect(goalContent).toContain("prevDirectionRef");
    expect(goalContent).not.toContain("}, [underlying, spot]);");

    expect(boostContent).toContain("prevUnderlyingRef");
    expect(boostContent).toContain("prevDirectionRef");
    expect(boostContent).not.toContain("}, [underlying, spot]);");
  });

  it("calculates positive gains for both upside and downside targets", () => {
    // Goal move calculation
    expect(goalContent).toContain("((targetPrice - spot) / spot) * 100");
    expect(goalContent).toContain("((spot - targetPrice) / spot) * 100");

    // Boost move calculation
    expect(boostContent).toContain("((targetPrice - spot) / spot) * 100");
    expect(boostContent).toContain("((spot - targetPrice) / spot) * 100");
  });

  it("provides tactile +/- stepper buttons for micro adjustments", () => {
    expect(goalContent).toContain("Plus");
    expect(goalContent).toContain("Minus");
    expect(boostContent).toContain("Plus");
    expect(boostContent).toContain("Minus");
  });

  it("integrates ShareModal in both Goal and Boost studios", () => {
    expect(goalContent).toContain("<ShareModal");
    expect(goalContent).toContain('initialMode="goal"');

    expect(boostContent).toContain("<ShareModal");
    expect(boostContent).toContain('initialMode="boost"');
  });

  it("renders forward progression marks in ChartCanvas for kind='curve'", () => {
    expect(canvasContent).toContain('kind === "curve"');
    expect(canvasContent).toContain('["NOW", "+25%", "+50%", "+75%", "TARGET"]');
  });

  it("uses clear, intuitive terminology instead of obscure jargon", () => {
    expect(goalContent).toContain("Price Target Goal");
    expect(goalContent).toContain("Price Target Tool");
    expect(goalContent).not.toContain("0DTE &amp; Swing Convexity");
    expect(goalContent).not.toContain("Target Goal Studio");
    expect(goalContent).not.toContain("Expansion");
    expect(goalContent).not.toContain("Pullback");
    expect(goalContent).not.toContain("Near Pivot");

    expect(boostContent).toContain("Boost Multiplier");
    expect(boostContent).toContain("Multiplier Tool");
    expect(boostContent).not.toContain("Asymmetric Convexity Multiplier");
    expect(boostContent).not.toContain("Convexity Boost Active!");
    expect(boostContent).not.toContain("Convexity Stats");
  });
});
