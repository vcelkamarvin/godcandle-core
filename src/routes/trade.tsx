import { createFileRoute } from "@tanstack/react-router";
import { FiveHundredXPage } from "@/components/trade/TickTradingDesk";

export const Route = createFileRoute("/trade")({
  head: () => ({
    meta: [
      { title: "godcandle — 1000x Live Tick Trading Desk" },
      {
        name: "description",
        content:
          "Ultra-high leverage crypto tick trading up to 1000x on BTC, ETH, and SPX with instant liquidation boundary calculation and Hyperliquid real-time price feeds.",
      },
      { property: "og:title", content: "godcandle — 1000x Live Tick Trading Desk" },
      {
        property: "og:description",
        content:
          "Ultra-high leverage crypto tick trading up to 1000x with clear liquidation boundary and live outcome dock.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GodcandleTradeDesk,
});

function GodcandleTradeDesk() {
  // Compatibility: t.setMode("paper1000x")
  return (
    <>
      <div className="hidden" aria-hidden="true">
        {/* <TradeTerminal /> */}
      </div>
      <FiveHundredXPage />
    </>
  );
}
