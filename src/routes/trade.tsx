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
    ],
  }),
  component: FiveHundredXPage,
});
