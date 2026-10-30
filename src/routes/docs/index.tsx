import React from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Zap, ShieldCheck, Layers, ArrowRight } from 'lucide-react';

export const Route = createFileRoute('/docs/')({
  component: DocsOverview,
});

function DocsOverview() {
  return (
    <div className="space-y-6 text-accent">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">godcandle Documentation</h1>
        <p className="text-subtle text-sm">
          High-leverage synthetic derivative exchange and gamified trading platform deployed directly on HyperEVM.
        </p>
      </div>

      <div className="border border-border bg-surface p-5 space-y-4">
        <h2 className="text-base font-bold text-bull flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Architecture Highlights
        </h2>
        <ul className="space-y-3 text-xs leading-relaxed text-subtle">
          <li>
            <strong className="text-accent">Synthetic 1000x Engine:</strong> Trades execute against the collective House Pool rather than peer-to-peer order books.
          </li>
          <li>
            <strong className="text-accent">Mark-Clamped BBO Pricing:</strong> Instant fills at mid-price anchored to Hyperliquid L1 precompiles (<code className="text-bull bg-background px-1 py-0.5 border border-border">0x080e</code> and <code className="text-bull bg-background px-1 py-0.5 border border-border">0x0806</code>).
          </li>
          <li>
            <strong className="text-accent">Pure FIFO Settlement:</strong> 100% of trader collateral returned immediately in the block of closing; net winning profits queued deterministically if exceeding available liquid buffer.
          </li>
          <li>
            <strong className="text-accent">No Entry Fee & Zero Slippage:</strong> Upfront fee is 0%. Trading fees are assessed exclusively on net winning PnL.
          </li>
          <li>
            <strong className="text-accent">Self-Decaying Token Emission:</strong> Fixed supply of 1,000,000,000 CANDLE, distributed algorithmically to liquidity contributors and active traders.
          </li>
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/docs/rules"
          className="p-4 bg-surface border border-border hover:border-accent transition-all block group"
        >
          <div className="font-bold text-accent group-hover:text-bull flex items-center justify-between">
            <span>Trading Rules</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
          <p className="mt-2 text-[11px] text-subtle">
            Mark-clamped corridor, bust distance math, and asymmetric haircuts.
          </p>
        </Link>

        <Link
          to="/docs/pool"
          className="p-4 bg-surface border border-border hover:border-accent transition-all block group"
        >
          <div className="font-bold text-accent group-hover:text-bull flex items-center justify-between">
            <span>House Pool</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
          <p className="mt-2 text-[11px] text-subtle">
            Solvency architecture, collateral guarantees, and FIFO queue priority.
          </p>
        </Link>

        <Link
          to="/docs/token"
          className="p-4 bg-surface border border-border hover:border-accent transition-all block group"
        >
          <div className="font-bold text-accent group-hover:text-bull flex items-center justify-between">
            <span>CANDLE Tokenomics</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
          <p className="mt-2 text-[11px] text-subtle">
            Algorithmic decay ratchet, distribution waterfall, and buyback burns.
          </p>
        </Link>
      </div>
    </div>
  );
}
