import React, { useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { TradeTerminal } from '@/components/trade/TradeTerminal';
import { useTrading } from '@/components/godcandle/TradingProvider';

export const Route = createFileRoute('/trade')({
  head: () => ({
    meta: [
      { title: 'godcandle — Pro Trading Terminal' },
      { name: 'description', content: 'Zero entry fee, high leverage perpetual trading terminal on Hyperliquid.' },
    ],
  }),
  component: TradePage,
});

function TradePage() {
  const t = useTrading();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const param = new URLSearchParams(window.location.search).get("mode");
      if (param === "perps") {
        t.setMode("perps");
      } else {
        t.setMode("paper1000x");
      }
    }
  }, []);

  return (
    <div className="py-1 sm:py-1.5 px-2.5 sm:px-4 md:px-5 2xl:h-[calc(100vh-66px)] 2xl:overflow-hidden 2xl:flex 2xl:flex-col">
      <TradeTerminal />
    </div>
  );
}
