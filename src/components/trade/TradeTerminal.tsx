import React, { useState } from 'react';
import { LivePriceHeader } from './LivePriceHeader';
import { LeverageSlider } from './LeverageSlider';
import { OrderForm } from './OrderForm';
import { SessionKeyPrompt } from '@/components/wallet/SessionKeyPrompt';
import { useTrading } from '@/components/godcandle/TradingProvider';
import { Shield, Layers, Zap, Database } from 'lucide-react';
import { toast } from 'sonner';

export const MARKETS = [
  { symbol: 'BTC-USD', name: 'Bitcoin', index: 0, maxLev: 1000, corridorBps: 1.5, defaultPrice: 68420.5 },
  { symbol: 'ETH-USD', name: 'Ethereum', index: 1, maxLev: 1000, corridorBps: 1.5, defaultPrice: 2540.2 },
  { symbol: 'SOL-USD', name: 'Solana', index: 2, maxLev: 1000, corridorBps: 1.5, defaultPrice: 182.4 },
  { symbol: 'HYPE-USD', name: 'Hyperliquid', index: 3, maxLev: 500, corridorBps: 3.0, defaultPrice: 42.8 },
];

export function TradeTerminal() {
  const [selectedMarket, setSelectedMarket] = useState(MARKETS[0]);
  const [leverage, setLeverage] = useState(500);

  // Read simulated prices from trading context if available
  const t = useTrading();
  const rawSymbol = selectedMarket.symbol.replace('-USD', '') as keyof typeof t.feeds;
  const currentPrice = t?.feeds?.[rawSymbol]?.price || selectedMarket.defaultPrice;
  const open24h = t?.feeds?.[rawSymbol]?.open24 || currentPrice * 0.985;

  const handleOrder = (side: 'LONG' | 'SHORT', margin: number, lev: number) => {
    if (t?.open) {
      t.open(rawSymbol as any, side, margin, lev);
      toast.success(`${side} 1000x Perp Placed!`, {
        description: `$${margin} margin at ${lev}× leverage on ${selectedMarket.symbol}. Instant FIFO block settlement.`,
      });
    } else {
      toast.success(`${side} order executed`, {
        description: `$${margin} @ ${lev}× on ${selectedMarket.symbol} against House Pool`,
      });
    }
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto font-mono text-xs text-accent">
      {/* Dynamic L1 Price Header */}
      <LivePriceHeader
        symbol={selectedMarket.symbol}
        price={currentPrice}
        open24h={open24h}
        corridorBps={selectedMarket.corridorBps}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Trade Config & Execution */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-surface border border-border p-6 rounded-none space-y-5">
            {/* Market Switcher */}
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <div className="flex space-x-1.5 overflow-x-auto">
                {MARKETS.map((m) => (
                  <button
                    key={m.symbol}
                    type="button"
                    onClick={() => {
                      setSelectedMarket(m);
                      if (leverage > m.maxLev) setLeverage(m.maxLev);
                    }}
                    className={`px-3 py-1.5 border text-xs transition-all ${
                      selectedMarket.symbol === m.symbol
                        ? 'border-accent bg-surface-elevated text-accent font-semibold'
                        : 'border-border text-subtle hover:text-accent'
                    }`}
                  >
                    {m.symbol}
                  </button>
                ))}
              </div>
              <div className="text-[10px] text-subtle uppercase tracking-wider">
                Corridor: {selectedMarket.corridorBps} bps
              </div>
            </div>

            {/* Discrete Leverage Slider */}
            <LeverageSlider
              value={leverage}
              onChange={setLeverage}
              maxLeverage={selectedMarket.maxLev}
            />

            {/* Order Form */}
            <OrderForm
              currentPrice={currentPrice}
              leverage={leverage}
              onTrade={handleOrder}
            />
          </div>

          {/* 1-Click Session Key Delegate */}
          <SessionKeyPrompt />
        </div>

        {/* Right Column: House Pool Solvency & Settlement State */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-surface border border-border p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="font-bold tracking-wider flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-bull" />
                HOUSE POOL SOLVENCY
              </span>
              <span className="px-1.5 py-0.5 text-[9px] bg-bull/10 border border-bull text-bull rounded font-bold">
                100% SOLVENT
              </span>
            </div>

            <div className="space-y-3 text-[11px]">
              <div className="flex justify-between text-subtle">
                <span>TOTAL LIQUID RESERVES</span>
                <span className="text-accent font-bold tabular">$14,850,240 USDC</span>
              </div>
              <div className="flex justify-between text-subtle">
                <span>FIFO PAYOUT QUEUE DEPTH</span>
                <span className="text-bull font-bold tabular">$0.00 (Zero Backlog)</span>
              </div>
              <div className="flex justify-between text-subtle">
                <span>NET OPEN INTEREST</span>
                <span className="text-accent tabular">$3,240,100 (Bound: $44.5M)</span>
              </div>
              <div className="flex justify-between text-subtle">
                <span>MAX NOTIONAL PER POSITION</span>
                <span className="text-accent tabular">$10,000,000</span>
              </div>
            </div>

            <div className="p-3 bg-background border border-border text-[10px] text-subtle space-y-1.5">
              <div className="flex items-center gap-1.5 text-accent font-semibold">
                <Shield className="w-3.5 h-3.5 text-bull" />
                Pure FIFO Guarantee
              </div>
              <p>
                100% of collateral is returned immediately in the execution block. Winning profits are paid atomically from liquid reserves. Outlier profits are prioritized ahead of all protocol fees.
              </p>
            </div>
          </div>

          <div className="bg-surface border border-border p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="font-bold tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-bull" />
                CASHFLOW WATERFALL
              </span>
              <span className="text-[10px] text-subtle">DETERMINISTIC</span>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-subtle">Staking USDC Yield (Real-Time)</span>
                <span className="text-accent font-semibold">30%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-subtle">TWAP Buyback & Burn (Hourly)</span>
                <span className="text-accent font-semibold">30%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-subtle">Hyperliquid Builder Codes</span>
                <span className="text-accent font-semibold">20%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-subtle">Core Engineering Team</span>
                <span className="text-accent font-semibold">20%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
