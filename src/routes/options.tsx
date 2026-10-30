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
      <div className="flex space-x-2 bg-surface p-2 border border-border">
        {MARKETS.map((m) => (
          <button
            key={m.symbol}
            onClick={() => setSelectedMarket(m)}
            className={`px-3 py-1.5 border transition-all ${
              selectedMarket.symbol === m.symbol
                ? 'border-accent bg-surface-elevated text-accent font-bold'
                : 'border-border text-subtle hover:text-accent'
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
