import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Database, ShieldCheck, RefreshCw, AlertTriangle } from 'lucide-react';

export const Route = createFileRoute('/docs/pool')({
  component: DocsPool,
});

function DocsPool() {
  return (
    <div className="space-y-8 text-accent">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">House Pool & Settlement Architecture</h1>
        <p className="text-subtle text-sm">
          Guaranteed atomic collateral return, deterministic liquid payouts, and priority FIFO queues.
        </p>
      </div>

      {/* Section 1: Capital Isolation */}
      <section className="border border-border bg-white rounded-2xl p-5 space-y-4 shadow-2xs">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#06964A]" />
          1. Capital Isolation & Collateral Guarantees
        </h2>
        <ul className="space-y-2 text-xs text-muted-foreground leading-relaxed">
          <li>
            <strong className="text-foreground">Isolated Balances:</strong> Collateral is kept in segregated storage balances inside the execution contract.
          </li>
          <li>
            <strong className="text-foreground">Atomic Return:</strong> When an open position is closed, the initial margin is returned atomically within the same block. Collateral is strictly never held in debt queues.
          </li>
        </ul>
      </section>

      {/* Section 2: Priority Flow */}
      <section className="border border-border bg-white rounded-2xl p-5 space-y-4 shadow-2xs">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-foreground" />
          2. Settlement Priority Flow
        </h2>
        <div className="space-y-3 text-xs text-muted-foreground">
          <div className="p-3 bg-[#F6F6F4] rounded-xl border border-border">
            <span className="text-[#06964A] font-bold block mb-1">SCENARIO A: LIQUID RESERVES &gt; WINNING PAYOUT</span>
            Full profit is transferred immediately in native USDC to the trader in the execution block.
          </div>
          <div className="p-3 bg-[#F6F6F4] rounded-xl border border-border">
            <span className="text-foreground font-bold block mb-1">SCENARIO B: WINNING PAYOUT &gt; LIQUID RESERVES</span>
            Available liquid reserves are paid out immediately. The remaining unbacked profit is converted into an on-chain deterministic FIFO claim ticket in the <strong className="text-foreground">Payout Queue</strong>.
          </div>
        </div>
      </section>

      {/* Section 3: 100% Debt Repayment Priority */}
      <section className="border border-border bg-white rounded-2xl p-5 space-y-4 shadow-2xs">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <Database className="w-4 h-4 text-[#06964A]" />
          3. 100% Debt Repayment Priority
        </h2>
        <p className="text-muted-foreground text-xs leading-relaxed">
          While any ticket exists in the Payout Queue:
        </p>
        <ul className="list-disc list-inside space-y-2 text-xs text-muted-foreground pl-2">
          <li>
            <strong className="text-foreground">100% of all incoming liquidation losses</strong> bypass dividends and flow directly toward clearing the queue in sequence.
          </li>
          <li>
            <strong className="text-foreground">Buybacks and regular dividend driplets pause automatically</strong> until queue depth returns to 0 USD.
          </li>
          <li>
            Queue positions earn a continuous share of protocol settlement fees until fully cleared.
          </li>
        </ul>
      </section>

      {/* Section 4: Net Open Interest Limits */}
      <section className="border border-border bg-white rounded-2xl p-5 space-y-4 shadow-2xs">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-foreground" />
          4. Net Open Interest Limits
        </h2>
        <p className="text-muted-foreground text-xs leading-relaxed">
          To maintain solvency and guard against single-direction black swans, aggregate open interest is bounded on-chain:
        </p>

        <div className="p-4 bg-[#F6F6F4] rounded-xl border border-border text-center font-mono">
          <div className="text-sm font-bold text-foreground">
            | OI_long - OI_short | ≤ 3 · V_pool
          </div>
          <span className="text-muted-foreground text-[11px] block mt-1">
            Where V_pool is the current total liquid reserve of the House Pool.
          </span>
        </div>

        <p className="text-muted-foreground text-xs">
          When net open interest exceeds this boundary, new orders in the heavy direction are locked until counter-positions open or the pool accumulates additional margin.
        </p>
      </section>
    </div>
  );
}
