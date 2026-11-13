import { createFileRoute } from "@tanstack/react-router";
import { FiveHundredXPage } from "@/components/trade/TickTradingDesk";
import { TradeTerminal } from "@/components/trade/TradeTerminal";

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
    <div className="py-1 sm:py-1.5 px-2.5 sm:px-4 md:px-5 min-[1440px]:h-[calc(100vh-66px)] min-[1440px]:overflow-hidden min-[1440px]:flex min-[1440px]:flex-col">
      <div className="hidden" aria-hidden="true">
        <TradeTerminal />
      </div>
      <FiveHundredXPage />
    </div>
  );
}
