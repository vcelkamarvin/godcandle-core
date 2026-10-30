import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { TradeTerminal } from '@/components/trade/TradeTerminal';

export const Route = createFileRoute('/trade')({
  head: () => ({
    meta: [
      { title: 'godcandle — 1000x Synthetic Perps' },
      { name: 'description', content: 'Mark-clamped BBO execution, zero entry fee, discrete 1000x leverage on HyperEVM.' },
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
