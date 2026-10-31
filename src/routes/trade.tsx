import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { TradeTerminal } from '@/components/trade/TradeTerminal';

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
  return (
    <div className="py-6 px-4 md:px-6">
      <TradeTerminal />
    </div>
  );
}
