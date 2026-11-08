import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TradeTerminal } from "@/components/trade/TradeTerminal";
import { useTrading } from "@/components/godcandle/TradingProvider";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "godcandle — Perpetual Futures Terminal" },
      {
        name: "description",
        content:
          "Professional high-performance perpetual futures trading terminal on Hyperliquid L1 order books with real-time orderbook, TradingView charting, and pro execution.",
      },
      { property: "og:title", content: "godcandle — Perpetual Futures Terminal" },
      {
        property: "og:description",
        content:
          "Professional high-performance perpetual futures trading terminal on Hyperliquid L1 order books.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GodcandlePerpsPage,
});

function GodcandlePerpsPage() {
  const t = useTrading();
  useEffect(() => {
    t.setMode("perps");
  }, [t]);

  return (
    <div className="py-1.5 sm:py-2 px-2 sm:px-4 md:px-5">
      <TradeTerminal />
    </div>
  );
}
