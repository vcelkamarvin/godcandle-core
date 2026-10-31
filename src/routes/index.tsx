import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TradeTerminal } from "@/components/trade/TradeTerminal";
import { useTrading } from "@/components/godcandle/TradingProvider";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "godcandle — Pro Perpetual Terminal" },
      {
        name: "description",
        content:
          "Pro trading terminal for Hyperliquid L1 order books with zero added latency. Powered by native Builder Code GODCANDLE and 1000x synthetic roadmap.",
      },
      { property: "og:title", content: "godcandle — Pro Perpetual Terminal" },
      {
        property: "og:description",
        content:
          "Trade directly on Hyperliquid L1 with zero added latency. Standard 1x-50x perps & the 1000x Masterplan.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IndexPage,
});

function IndexPage() {
  const t = useTrading();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const param = new URLSearchParams(window.location.search).get("mode");
      if (param === "paper1000x") {
        if (t.mode !== "paper1000x") t.setMode("paper1000x");
      } else {
        if (t.mode !== "perps") t.setMode("perps");
      }
    }
  }, [t]);

  return (
    <div className="py-1.5 sm:py-2 px-2.5 sm:px-4 md:px-5">
      <TradeTerminal />
    </div>
  );
}
