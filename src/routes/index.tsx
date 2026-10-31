import { createFileRoute } from "@tanstack/react-router";
import { TradeTerminal } from "@/components/trade/TradeTerminal";

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
  return (
    <div className="py-6 px-4 md:px-6">
      <TradeTerminal />
    </div>
  );
}
