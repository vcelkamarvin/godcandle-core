import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Coins, TrendingDown, Flame, PieChart, Layers } from 'lucide-react';

export const Route = createFileRoute('/docs/token')({
  component: DocsToken,
});

function DocsToken() {
  return (
    <div className="space-y-8 text-accent">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">CANDLE Tokenomics & Distribution</h1>
        <p className="text-subtle text-sm">
          Fixed hard cap, algorithmic quadratic decay ratchet, and real-time USDC revenue waterfall.
        </p>
      </div>

      {/* Section 1: Supply Allocation */}
      <section className="border border-border bg-white rounded-2xl p-5 space-y-4 shadow-2xs">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <PieChart className="w-4 h-4 text-[#06964A]" />
          1. Supply Allocation
        </h2>
        <div className="text-xs text-muted-foreground mb-3">
          <strong className="text-foreground">Total Fixed Hard Cap:</strong> 1,000,000,000 CANDLE (Minting irrevocably disabled).
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-[#F6F6F4] rounded-xl border border-border">
            <span className="text-muted-foreground text-[10px] block">COMMUNITY MINING (60%)</span>
            <span className="font-bold text-foreground text-sm">600,000,000 CANDLE</span>
            <p className="text-[10px] text-muted-foreground mt-1">Distributed via volume, haircuts, and liquidation mining.</p>
          </div>

          <div className="p-3 bg-[#F6F6F4] rounded-xl border border-border">
            <span className="text-muted-foreground text-[10px] block">CORE TEAM (15%)</span>
            <span className="font-bold text-foreground text-sm">150,000,000 CANDLE</span>
            <p className="text-[10px] text-muted-foreground mt-1">6-month cliff followed by 18-month linear on-chain vesting.</p>
          </div>

          <div className="p-3 bg-[#F6F6F4] rounded-xl border border-border">
            <span className="text-muted-foreground text-[10px] block">ECOSYSTEM & CANDLE CUP (15%)</span>
            <span className="font-bold text-foreground text-sm">150,000,000 CANDLE</span>
            <p className="text-[10px] text-muted-foreground mt-1">Weekly competition rewards, hardware trophies, and builder grants.</p>
          </div>

          <div className="p-3 bg-[#F6F6F4] rounded-xl border border-border">
            <span className="text-muted-foreground text-[10px] block">HYPERCORE PROTOCOL LIQUIDITY (10%)</span>
            <span className="font-bold text-foreground text-sm">100,000,000 CANDLE</span>
            <p className="text-[10px] text-muted-foreground mt-1">Paired against native USDC in official HyperCore order books.</p>
          </div>
        </div>
      </section>

      {/* Section 2: Algorithmic Emission Ratchet */}
      <section className="border border-border bg-white rounded-2xl p-5 space-y-4 shadow-2xs">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-foreground" />
          2. Algorithmic Emission Ratchet
        </h2>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Mining allocation decays based on the remaining unmined balance (S_rem):
        </p>

        <div className="p-4 bg-[#F6F6F4] rounded-xl border border-border text-center font-mono">
          <div className="text-base font-bold text-[#06964A]">
            R(S_rem) = 100 · ( S_rem / 600,000,000 )²
          </div>
          <span className="text-muted-foreground text-[10px] block mt-1">
            Quadratic decay guarantees issuance can never exceed hard cap.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 bg-[#F6F6F4] rounded-xl border border-border">
            <span className="text-muted-foreground text-[10px] block">DAY 1 (600M LEFT)</span>
            <span className="font-bold text-[#06964A]">100.00 CANDLE / $1</span>
          </div>
          <div className="p-3 bg-[#F6F6F4] rounded-xl border border-border">
            <span className="text-muted-foreground text-[10px] block">300M REMAINING</span>
            <span className="font-bold text-foreground">25.00 CANDLE / $1</span>
          </div>
          <div className="p-3 bg-[#F6F6F4] rounded-xl border border-border">
            <span className="text-muted-foreground text-[10px] block">120M REMAINING</span>
            <span className="font-bold text-muted-foreground">4.00 CANDLE / $1</span>
          </div>
        </div>
      </section>

      {/* Section 3: Mining Base Calculation */}
      <section className="border border-border bg-white rounded-2xl p-5 space-y-4 shadow-2xs">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <Coins className="w-4 h-4 text-[#06964A]" />
          3. Mining Base Calculation
        </h2>
        <p className="text-muted-foreground text-xs leading-relaxed">
          The USD base for token emission credits active traders and liquidated participants:
        </p>

        <div className="p-4 bg-[#F6F6F4] rounded-xl border border-border font-mono text-xs text-foreground">
          <div className="flex justify-between py-1 border-b border-border">
            <span>On Liquidations:</span>
            <span className="text-[#06964A] font-bold">Base = Loss · ( Leverage / 1000 )</span>
          </div>
          <div className="flex justify-between py-1 pt-2">
            <span>On Profitable Trades:</span>
            <span className="text-[#06964A] font-bold">Base = Haircut Paid · 2.0</span>
          </div>
        </div>
      </section>

      {/* Section 4: Waterfall */}
      <section className="border border-border bg-white rounded-2xl p-5 space-y-4 shadow-2xs">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <Layers className="w-4 h-4 text-foreground" />
          4. Net Fee Distribution Waterfall
        </h2>
        <p className="text-muted-foreground text-xs leading-relaxed">
          All net settlement and win fees generated across the platform are allocated deterministically:
        </p>

        <div className="space-y-2 text-xs">
          <div className="p-3 bg-[#F6F6F4] rounded-xl border border-border flex justify-between items-center">
            <div>
              <strong className="text-foreground block">20% Core Team</strong>
              <span className="text-muted-foreground text-[11px]">Transferred immediately in raw USDC.</span>
            </div>
            <span className="text-foreground font-bold tabular">20%</span>
          </div>

          <div className="p-3 bg-[#F6F6F4] rounded-xl border border-border flex justify-between items-center">
            <div>
              <strong className="text-foreground block">20% Builders & Referrals</strong>
              <span className="text-muted-foreground text-[11px]">Disbursed directly via Hyperliquid Builder Codes.</span>
            </div>
            <span className="text-foreground font-bold tabular">20%</span>
          </div>

          <div className="p-3 bg-[#F6F6F4] rounded-xl border border-border flex justify-between items-center">
            <div>
              <strong className="text-foreground block">60% Community Staking & Buyback Burn</strong>
              <span className="text-muted-foreground text-[11px]">
                30% real-time USDC yield to stakers + 30% hourly TWAP market buybacks & token burn.
              </span>
            </div>
            <span className="text-[#06964A] font-bold tabular">60%</span>
          </div>
        </div>
      </section>
    </div>
  );
}
