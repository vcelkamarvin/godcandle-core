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
        if (t.mode !== "perps") t.setMode("perps");
      } else {
        if (t.mode !== "paper1000x") t.setMode("paper1000x");
      }
    }
  }, [t]);

  return (
    <div className="py-6 px-4 md:px-6">
      <TradeTerminal />
    </div>
  );
}
