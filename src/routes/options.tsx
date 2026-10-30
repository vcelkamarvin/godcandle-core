import React, { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { OutcomeMap } from '@/components/trade/OutcomeMap';
import { MARKETS } from '@/components/trade/TradeTerminal';
import { LivePriceHeader } from '@/components/trade/LivePriceHeader';
import { useTrading } from '@/components/godcandle/TradingProvider';

export const Route = createFileRoute('/options')({
  head: () => ({
    meta: [
      { title: 'godcandle — 0DTE Fast Options' },
      { name: 'description', content: 'Outcome-based time barriers from 5 to 60 minutes evaluated by HyperCore Mark Price.' },
    ],
  }),
  component: OptionsPage,
});

function OptionsPage() {
  const [selectedMarket, setSelectedMarket] = useState(MARKETS[0]);
  const t = useTrading();
  const rawSymbol = selectedMarket.symbol.replace('-USD', '') as keyof typeof t.feeds;
  const currentPrice = t?.feeds?.[rawSymbol]?.price || selectedMarket.defaultPrice;
  const open24h = t?.feeds?.[rawSymbol]?.open24 || currentPrice * 0.985;

  return (
    <div className="py-6 px-4 md:px-6 space-y-6 max-w-5xl mx-auto font-mono text-xs">
      <LivePriceHeader
        symbol={selectedMarket.symbol}
        price={currentPrice}
        open24h={open24h}
        corridorBps={selectedMarket.corridorBps}
      />

      {/* Market Selector */}
      <div className="flex space-x-2 bg-white p-2.5 rounded-2xl border border-border shadow-sm overflow-x-auto">
        {MARKETS.map((m) => (
          <button
            key={m.symbol}
            onClick={() => setSelectedMarket(m)}
            className={`pill h-8 px-4 text-xs transition-all ${
              selectedMarket.symbol === m.symbol
                ? 'pill-ink font-bold shadow-sm'
                : 'border border-border bg-[#F6F6F4] text-muted-foreground hover:text-foreground hover:bg-[#F0F0EE]'
            }`}
          >
            {m.symbol}
          </button>
        ))}
      </div>

      <OutcomeMap currentPrice={currentPrice} symbol={selectedMarket.symbol} />
    </div>
  );
}
