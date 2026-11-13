import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { createRoot } from "react-dom/client";
import { act } from "react";

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-router")>("@tanstack/react-router");
  return {
    ...actual,
    Link: ({ children, to, className, ...props }: any) => (
      <a href={typeof to === "string" ? to : "/"} className={className} {...props}>
        {children}
      </a>
    ),
  };
});

vi.mock("@/components/godcandle/TradingProvider", () => ({
  useTrading: () => ({
    mode: "paper1000x",
    feeds: {
      BTC: { price: 68420.5 },
      ETH: { price: 2540.2 },
      SOL: { price: 182.4 },
    },
    open: vi.fn(),
    close: vi.fn(),
    balance: 10000,
    available: 10000,
    marginUsed: 0,
    positions: [],
    history: [],
  }),
}));

describe("Goal and Boost Purge & Redirects", () => {
  const goalPath = path.resolve(__dirname, "../routes/goal.tsx");
  const boostPath = path.resolve(__dirname, "../routes/boost.tsx");
  const canvasPath = path.resolve(__dirname, "../components/godcandle/ChartCanvas.tsx");

  const goalContent = fs.readFileSync(goalPath, "utf-8");
  const boostContent = fs.readFileSync(boostPath, "utf-8");
  const canvasContent = fs.readFileSync(canvasPath, "utf-8");

  it("redirects /goal route cleanly to the unified perpetual terminal", () => {
    expect(goalContent).toContain('redirect({ to: "/" })');
    expect(goalContent).toContain('createFileRoute("/goal")');
    expect(goalContent).not.toContain("Target Goal Studio");
    expect(goalContent).not.toContain("0DTE &amp; Swing Convexity");
  });

  it("redirects /boost route cleanly to the unified perpetual terminal", () => {
    expect(boostContent).toContain('redirect({ to: "/" })');
    expect(boostContent).toContain('createFileRoute("/boost")');
    expect(boostContent).not.toContain("Asymmetric Convexity Multiplier");
    expect(boostContent).not.toContain("Convexity Boost Active!");
  });

  it("does not render unstyled raw range sliders in either studio file", () => {
    expect(goalContent).not.toContain('<input\n                type="range"');
    expect(boostContent).not.toContain('<input\n                type="range"');
  });

  it("renders forward progression marks in ChartCanvas for kind='curve'", () => {
    expect(canvasContent).toContain('kind === "curve"');
    expect(canvasContent).toContain('["NOW", "+25%", "+50%", "+75%", "TARGET"]');
  });
});

describe("ChartCanvas Edge Cases & Rendering", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    );
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => null);
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it("ChartCanvas safely handles 1-element arrays and zero client dimensions", async () => {
    const { ChartCanvas } = await import("@/components/godcandle/ChartCanvas");
    const root = createRoot(container);
    await act(async () => {
      root.render(<ChartCanvas kind="curve" values={[100]} height={130} />);
    });

    const canvas = container.querySelector("canvas");
    expect(canvas).not.toBeNull();
  });

  it("GoalRedirect component mounts cleanly without error", async () => {
    const { GoalRedirect } = await import("@/routes/goal");
    const root = createRoot(container);
    await act(async () => {
      root.render(<GoalRedirect />);
    });
    expect(container.textContent).toBe("");
  });

  it("BoostRedirect component mounts cleanly without error", async () => {
    const { BoostRedirect } = await import("@/routes/boost");
    const root = createRoot(container);
    await act(async () => {
      root.render(<BoostRedirect />);
    });
    expect(container.textContent).toBe("");
  });
});
