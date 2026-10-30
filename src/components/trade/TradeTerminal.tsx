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
    <div className="space-y-4 max-w-5xl mx-auto font-mono text-xs text-foreground">
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
          <div className="relative overflow-hidden rounded-2xl border border-border bg-white p-6 shadow-sm space-y-5">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#CDC3F0] via-[#FFDAC8] to-[#A0D4CA] opacity-80" />

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
                    className={`pill h-8 px-3 text-xs transition-all ${
                      selectedMarket.symbol === m.symbol
                        ? 'pill-ink font-semibold'
                        : 'border border-border bg-[#F6F6F4] text-muted-foreground hover:text-foreground hover:bg-[#F0F0EE]'
                    }`}
                  >
                    {m.symbol}
                  </button>
                ))}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
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
          <div className="relative overflow-hidden rounded-2xl border border-border bg-white p-5 shadow-sm space-y-4">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#CBCBE8] to-[#EBD0C6] opacity-70" />

            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="font-bold tracking-wider flex items-center gap-1.5 text-foreground">
                <Database className="w-3.5 h-3.5 text-[#06964A]" />
                HOUSE POOL SOLVENCY
              </span>
              <span className="px-2 py-0.5 text-[9px] bg-[#E3F8EC] border border-[#06964A]/30 text-[#06964A] rounded-full font-bold">
                100% SOLVENT
              </span>
            </div>

            <div className="space-y-3 text-[11px]">
              <div className="flex justify-between text-muted-foreground">
                <span>TOTAL LIQUID RESERVES</span>
                <span className="text-foreground font-bold tabular">$14,850,240 USDC</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>FIFO PAYOUT QUEUE DEPTH</span>
                <span className="text-[#06964A] font-bold tabular">$0.00 (Zero Backlog)</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>NET OPEN INTEREST</span>
                <span className="text-foreground tabular">$3,240,100 (Bound: $44.5M)</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>MAX NOTIONAL PER POSITION</span>
                <span className="text-foreground tabular">$10,000,000</span>
              </div>
            </div>

            <div className="p-3 bg-[#F6F6F4] border border-border rounded-xl text-[10px] text-muted-foreground space-y-1.5">
              <div className="flex items-center gap-1.5 text-foreground font-semibold">
                <Shield className="w-3.5 h-3.5 text-[#06964A]" />
                Pure FIFO Guarantee
              </div>
              <p className="leading-relaxed">
                100% of collateral is returned immediately in the execution block. Winning profits are paid atomically from liquid reserves. Outlier profits are prioritized ahead of all protocol fees.
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-border bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="font-bold tracking-wider flex items-center gap-1.5 text-foreground">
                <Layers className="w-3.5 h-3.5 text-[#06964A]" />
                CASHFLOW WATERFALL
              </span>
              <span className="text-[10px] text-muted-foreground">DETERMINISTIC</span>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Staking USDC Yield (Real-Time)</span>
                <span className="text-foreground font-semibold">30%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">TWAP Buyback & Burn (Hourly)</span>
                <span className="text-foreground font-semibold">30%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hyperliquid Builder Codes</span>
                <span className="text-foreground font-semibold">20%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Core Engineering Team</span>
                <span className="text-foreground font-semibold">20%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
