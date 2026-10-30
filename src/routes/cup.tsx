import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { LeaderboardTable } from '@/components/cup/LeaderboardTable';

export const Route = createFileRoute('/cup')({
  head: () => ({
    meta: [
      { title: 'godcandle — The Candle Cup' },
      { name: 'description', content: 'Weekly ROI competition with real USDC payouts and custom hardware trophies.' },
    ],
  }),
  component: CandleCupPage,
});

function CandleCupPage() {
  return (
    <div className="py-6 px-4 md:px-6 max-w-6xl mx-auto">
      <LeaderboardTable />
    </div>
  );
}
