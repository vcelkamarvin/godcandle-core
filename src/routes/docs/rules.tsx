import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Shield, Target, Scale, Zap } from 'lucide-react';

export const Route = createFileRoute('/docs/rules')({
  component: DocsRules,
});

function DocsRules() {
  return (
    <div className="space-y-8 text-accent">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Protocol Mechanics & Execution Rules</h1>
        <p className="text-subtle text-sm">
          Deterministic execution anchored directly to Hyperliquid L1 order book telemetry.
        </p>
      </div>

      {/* Section 1: Execution Pricing */}
      <section className="border border-border bg-white rounded-2xl p-5 space-y-4 shadow-2xs">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#06964A]" />
          1. Hyperliquid L1 Real-Time Execution
        </h2>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Execution price uses real-time Hyperliquid L1 order book feeds.
        </p>

        <ol className="list-decimal list-inside space-y-2 text-xs text-muted-foreground pl-2">
          <li>Contract fetches instantaneous Best Bid and Offer (BBO).</li>
          <li>Contract fetches official smoothed Mark Price (markPx).</li>
          <li>
            Pricing rule:
            <ul className="list-disc list-inside pl-4 mt-1 space-y-1">
              <li>Base Price: <code className="text-foreground">P_mid = (P_bid + P_ask) / 2</code></li>
              <li>Allowed Corridor: <code className="text-[#06964A]">Delta_max = 1.5 bps</code> (0.015%) for Tier 1 majors (BTC, ETH, SOL), <code className="text-[#06964A]">3.0 bps</code> for altcoins.</li>
            </ul>
          </li>
        </ol>

        <div className="p-4 bg-[#F6F6F4] rounded-xl border border-border font-mono text-xs text-foreground">
          <span className="text-muted-foreground block mb-1">// Solidity Pricing Guard Condition</span>
          <pre className="overflow-x-auto text-[11px] text-[#06964A]">
{`P_exec = Math.max(
    P_mark * (10000 - Delta_max) / 10000,
    Math.min(P_mid, P_mark * (10000 + Delta_max) / 10000)
);`}
          </pre>
        </div>

        <p className="text-muted-foreground text-xs">
          This guarantees execution at visible screen prices while making it mathematically impossible for single-block order book sweeps or flash-loan attackers to drain the House Pool.
        </p>
      </section>

      {/* Section 2: Bust Distance */}
      <section className="border border-border bg-white rounded-2xl p-5 space-y-4 shadow-2xs">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <Target className="w-4 h-4 text-[#FF3B30]" />
          2. Liquidation Mechanics (Bust Distance)
        </h2>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Liquidations are triggered exclusively when smoothed mark price (<code className="text-foreground bg-[#F6F6F4] px-1 py-0.5 rounded border border-border">markPx</code>) crosses the position bust threshold. Transient spikes in BBO do not trigger liquidations.
        </p>

        <div className="p-4 bg-[#F6F6F4] rounded-xl border border-border text-center font-mono">
          <span className="text-muted-foreground text-[11px] block mb-1">HOUSE MARGIN BUFFER (4.8 bps)</span>
          <div className="text-base font-bold text-foreground">
            BustDistance(bps) = (10000 / Leverage) - 4.8
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-[#F6F6F4] rounded-xl border border-border">
            <span className="text-muted-foreground text-[10px] block">1000× LEVERAGE</span>
            <span className="font-bold text-[#FF3B30] text-sm">-5.2 bps (-0.052%)</span>
          </div>
          <div className="p-3 bg-[#F6F6F4] rounded-xl border border-border">
            <span className="text-muted-foreground text-[10px] block">500× LEVERAGE</span>
            <span className="font-bold text-[#FF3B30] text-sm">-15.2 bps (-0.152%)</span>
          </div>
          <div className="p-3 bg-[#F6F6F4] rounded-xl border border-border">
            <span className="text-muted-foreground text-[10px] block">100× LEVERAGE</span>
            <span className="font-bold text-[#FF3B30] text-sm">-95.2 bps (-0.952%)</span>
          </div>
        </div>

        <p className="text-muted-foreground text-xs">
          When liquidated, 100% of isolated margin transfers atomically to the House Pool reserve.
        </p>
      </section>

      {/* Section 3: Win Fees & Haircut */}
      <section className="border border-border bg-white rounded-2xl p-5 space-y-4 shadow-2xs">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <Scale className="w-4 h-4 text-foreground" />
          3. Asymmetric Profit Haircut & Win Fees
        </h2>
        <ul className="space-y-2 text-xs text-muted-foreground">
          <li>
            <strong className="text-foreground">Losses:</strong> 0% protocol fees. Only actual market loss is subtracted.
          </li>
          <li>
            <strong className="text-foreground">Wins:</strong>
            <ul className="list-disc list-inside pl-4 mt-1 space-y-1">
              <li>Deadband threshold: 0.2 bps (0.002%) subtracted from gross price move: <code className="text-foreground">d_net = max(d - 0.00002, 0)</code></li>
              <li>Account notional scale factor prevents micro-tick whale extraction.</li>
              <li>Protocol settlement fee: 2.0% deducted from adjusted gain.</li>
            </ul>
          </li>
        </ul>

        <div className="p-4 bg-[#F6F6F4] rounded-xl border border-border font-mono text-center">
          <span className="text-muted-foreground text-[11px] block mb-1">FINAL PNL FORMULA</span>
          <div className="text-sm font-bold text-[#06964A]">
            PnL_net = N · d_net · scale(d_net, N) · 0.98
          </div>
        </div>

        <p className="text-muted-foreground text-xs">
          Retail traders holding genuine trend moves retain 88% to 93% of gross gains. High-frequency whale exploits on micro-ticks pay up to 65% in protocol haircuts.
        </p>
      </section>
    </div>
  );
}
