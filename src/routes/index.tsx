import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TradeTerminal } from "@/components/trade/TradeTerminal";
import { useTrading } from "@/components/godcandle/TradingProvider";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "godcandle — Pro Perpetual Futures Terminal" },
      {
        name: "description",
        content:
          "Professional high-performance perpetual futures trading terminal for Hyperliquid L1 order books with TradingView candlestick charts, deep orderbook, and pro execution.",
      },
      { property: "og:title", content: "godcandle — Pro Perpetual Futures Terminal" },
      {
        property: "og:description",
        content:
          "Professional high-performance perpetual futures trading terminal on Hyperliquid L1 order books.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GodcandleRootDesk,
});

function GodcandleRootDesk() {
  const t = useTrading();
  useEffect(() => {
    t.setMode("perps");
  }, []);

  return <TradeTerminal />;
}


