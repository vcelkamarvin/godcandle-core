import React, { useState, useEffect } from 'react';
import { LivePriceHeader } from './LivePriceHeader';
import { LeverageSlider } from './LeverageSlider';
import { OrderForm } from './OrderForm';
import { SessionKeyPrompt } from '@/components/wallet/SessionKeyPrompt';
import { useTrading } from '@/components/godcandle/TradingProvider';
import { PriceChart } from '@/components/godcandle/PriceChart';
import { TradingViewWidget, type TVInterval } from '@/components/godcandle/TradingViewWidget';
import { Dock } from '@/components/godcandle/Dock';
import { ShareModal } from '@/components/godcandle/ShareModal';
import { fmtSigned, fmtUsd, pnlOf, type ClosedTrade } from '@/lib/engine';
import { Shield, Layers, Zap, Database, BarChart2, RotateCcw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useSettings } from '@/lib/settings';

export interface MarketDef {
  symbol: string;
  name: string;
  index: number;
  maxLev: number;
  corridorBps: number;
  defaultPrice: number;
}

export const MARKETS: MarketDef[] = [
  { symbol: 'BTC-USD', name: 'Bitcoin', index: 0, maxLev: 1000, corridorBps: 1.5, defaultPrice: 68420.5 },
  { symbol: 'ETH-USD', name: 'Ethereum', index: 1, maxLev: 1000, corridorBps: 1.5, defaultPrice: 2540.2 },
  { symbol: 'SOL-USD', name: 'Solana', index: 2, maxLev: 1000, corridorBps: 1.5, defaultPrice: 182.4 },
  { symbol: 'HYPE-USD', name: 'Hyperliquid', index: 3, maxLev: 500, corridorBps: 3.0, defaultPrice: 42.8 },
  { symbol: 'DOGE-USD', name: 'Dogecoin', index: 4, maxLev: 500, corridorBps: 3.0, defaultPrice: 0.164 },
];

const TIMEFRAMES: Array<{ label: string; ms: number; tvInterval?: TVInterval }> = [
  { label: 'Tick', ms: 30000, tvInterval: '1' },
  { label: '1m', ms: 60000, tvInterval: '1' },
  { label: '5m', ms: 300000, tvInterval: '5' },
  { label: '15m', ms: 900000, tvInterval: '15' },
  { label: '1h', ms: 3600000, tvInterval: '60' },
  { label: '1D', ms: 86400000, tvInterval: 'D' },
];

export function TradeTerminal() {
  const t = useTrading();
  const isPerps = t.mode === 'perps';
  const { settings } = useSettings();

  const engineMarkets = t.engine.getMarkets();
  const marketsList: any[] = engineMarkets.length > 0 ? engineMarkets : MARKETS;

  const [selectedMarket, setSelectedMarket] = useState<any>(marketsList[0] || MARKETS[0]!);
  const rawSymbol = selectedMarket.symbol.replace('-USD', '') as any;

  // Determine dynamic max leverage
  const activeMaxLev = isPerps ? t.engine.getMaxLeverage(rawSymbol) : 1000;
  const [leverage, setLeverage] = useState(() =>
    isPerps ? Math.min(50, activeMaxLev) : Math.min(settings.defaultLeverage ?? 500, activeMaxLev)
  );

  const [chartMode, setChartMode] = useState<'reactive' | 'tradingview'>('reactive');
  const [windowMs, setWindowMs] = useState(30000);
  const [tvInterval, setTvInterval] = useState<TVInterval>('15');
  const [shareTrade, setShareTrade] = useState<ClosedTrade | null>(null);

  // Sync default leverage when changed in settings
  useEffect(() => {
    if (settings.defaultLeverage && !isPerps) {
      setLeverage(Math.min(settings.defaultLeverage, activeMaxLev));
    }
  }, [settings.defaultLeverage, isPerps, activeMaxLev]);

  // Clamp leverage whenever mode or selected asset changes
  useEffect(() => {
    const currentMax = isPerps ? t.engine.getMaxLeverage(rawSymbol) : 1000;
    setLeverage((prev) => Math.min(prev, currentMax));
  }, [isPerps, rawSymbol, t.engine]);

  const currentPrice = (t?.feeds as Record<string, any>)?.[rawSymbol]?.price || selectedMarket.defaultPrice;
  const open24h = (t?.feeds as Record<string, any>)?.[rawSymbol]?.open24 || currentPrice * 0.985;
  const currentPosition = t?.positions?.find((p) => p.market === rawSymbol) ?? null;
  const posPnl = currentPosition ? pnlOf(currentPosition, currentPrice) : 0;
  const pnlLabel = currentPosition ? fmtSigned(posPnl) : '';

  const handleOrder = (side: 'LONG' | 'SHORT', margin: number, lev: number, tp?: number | null, sl?: number | null) => {
    if (t?.open) {
      t.open(rawSymbol, side.toLowerCase() as 'long' | 'short', margin, lev, tp, sl);
    }
  };

  const handleMarketSelect = (m: MarketDef) => {
    setSelectedMarket(m);
    const asset = m.symbol.replace('-USD', '');
    const maxLev = isPerps ? t.engine.getMaxLeverage(asset) : 1000;
    setLeverage((prev) => Math.min(prev, maxLev));
  };

  const handleTimeframeChange = (tf: (typeof TIMEFRAMES)[number]) => {
    setWindowMs(tf.ms);
    if (tf.tvInterval) {
      setTvInterval(tf.tvInterval);
    }
  };

  const hlNetwork = typeof process !== 'undefined' ? (process.env?.['NEXT_PUBLIC_HL_NETWORK'] || 'testnet') : 'testnet';
  const isProMode = settings.terminalDensity === 'pro';

  return (
    <div className={`mx-auto font-sans text-foreground transition-all ${
      isProMode ? 'space-y-2 max-w-7xl text-[11px]' : 'space-y-4 max-w-6xl text-xs'
    }`}>
      {/* Dynamic L1 Price Header */}
      <LivePriceHeader
        symbol={selectedMarket.symbol}
        price={currentPrice}
        open24h={open24h}
        corridorBps={selectedMarket.corridorBps}
      />

      {/* Technical Chart Instance (Raw L1 Tick or TradingView Lightweight Instance) */}
      <div className={`relative overflow-hidden rounded-2xl border border-border bg-white shadow-sm ${
        isProMode ? 'p-3 space-y-2' : 'p-4 space-y-3'
      }`}>
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#CDC3F0] via-[#FFDAC8] to-[#A0D4CA] opacity-80" />

        <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-bold text-foreground">
              {selectedMarket.symbol}
            </span>
            {isPerps ? (
              <span className="rounded bg-[#E3F8EC] border border-[#06964A]/30 px-2 py-0.5 text-[9px] font-bold text-[#06964A] flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-[#06964A] animate-pulse" />
                LIVE · REAL FUNDS ({hlNetwork.toUpperCase()})
              </span>
            ) : (
              <span className="rounded bg-[#FFF4E5] border border-[#D97706]/30 px-2 py-0.5 text-[9px] font-bold text-[#D97706]">
                TEST · PAPER
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Chart Mode Switcher */}
            <div className="flex items-center rounded-md bg-secondary p-0.5 border border-border/60">
              <Button
                variant="terminal"
                onClick={() => setChartMode('reactive')}
                className={`h-6 px-2.5 rounded-sm text-[11px] font-mono font-medium gap-1.5 transition-all ${
                  chartMode === 'reactive'
                    ? 'bg-foreground text-background font-bold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Zap className="size-3 text-[#FFD60A]" />
                <span>Raw L1 Tick</span>
              </Button>
              <Button
                variant="terminal"
                onClick={() => setChartMode('tradingview')}
                className={`h-6 px-2.5 rounded-sm text-[11px] font-mono font-medium gap-1.5 transition-all ${
                  chartMode === 'tradingview'
                    ? 'bg-foreground text-background font-bold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <BarChart2 className="size-3 text-[#00D964]" />
                <span>TradingView</span>
              </Button>
            </div>

            {/* Timeframe Interval Pills */}
            <div className="hidden sm:flex items-center rounded-md bg-secondary p-0.5 border border-border/60">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf.label}
                  type="button"
                  onClick={() => handleTimeframeChange(tf)}
                  className={`h-6 px-2 rounded-sm text-[10px] font-mono transition-all ${
                    windowMs === tf.ms
                      ? 'bg-foreground text-background font-bold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chart Viewport */}
        <div className="relative h-[340px] w-full rounded-xl overflow-hidden bg-[#FAF9F5] border border-border/40">
          {chartMode === 'reactive' ? (
            <PriceChart
              market={rawSymbol}
              windowMs={windowMs}
              position={currentPosition}
              pnlLabel={pnlLabel}
              pnlPositive={posPnl >= 0}
              onClose={() => t?.close && currentPosition && t.close(currentPosition.id)}
            />
          ) : (
            <TradingViewWidget
              market={rawSymbol}
              interval={tvInterval}
              height="100%"
            />
          )}
        </div>
      </div>

      <div className={`grid grid-cols-1 lg:grid-cols-12 ${isProMode ? 'gap-2.5' : 'gap-4'}`}>
        {/* Left Column: Trade Config & Execution */}
        <div className={`lg:col-span-7 ${isProMode ? 'space-y-2.5' : 'space-y-4'}`}>
          <div className={`relative overflow-hidden rounded-2xl border border-border bg-white shadow-sm ${
            isProMode ? 'p-3.5 space-y-3' : 'p-6 space-y-5'
          }`}>
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#CDC3F0] via-[#FFDAC8] to-[#A0D4CA] opacity-80" />

            {/* Market Switcher */}
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <div className="flex space-x-1.5 overflow-x-auto no-scrollbar">
                {marketsList.slice(0, 15).map((m: any) => {
                  const asset = m.symbol.replace('-USD', '');
                  const assetMaxLev = isPerps ? t.engine.getMaxLeverage(asset) : 1000;
                  return (
                    <button
                      key={m.symbol}
                      type="button"
                      onClick={() => handleMarketSelect(m)}
                      className={`h-7 px-2.5 rounded-sm text-xs font-mono transition-all ${
                        selectedMarket.symbol === m.symbol
                          ? 'bg-foreground text-background font-bold shadow-xs'
                          : 'border border-border bg-[#F6F6F4] text-muted-foreground hover:text-foreground hover:bg-[#F0F0EE]'
                      }`}
                    >
                      <span>{m.symbol}</span>
                      <span className="ml-1 text-[9px] opacity-75">{assetMaxLev}×</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2">
                {!isPerps && (
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await t.resetPaperBalance();
                      if (res.success) {
                        toast.success("Paper balance reset to $10,000.00 USDC");
                      } else {
                        toast.error(res.error || "Reset cooldown active");
                      }
                    }}
                    className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground font-mono transition-colors"
                  >
                    <RotateCcw className="size-3" />
                    <span>Reset ($10k)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Discrete Leverage Slider */}
            <LeverageSlider
              value={leverage}
              onChange={setLeverage}
              maxLeverage={activeMaxLev}
            />

            {/* Technical Order Form */}
            <OrderForm
              currentPrice={currentPrice}
              leverage={leverage}
              asset={rawSymbol}
              corridorBps={selectedMarket.corridorBps}
              availableBalance={t?.available ?? 1000}
              mode={t.mode}
              onTrade={handleOrder}
            />
          </div>

          {/* 1-Click Session Key Delegate */}
          <SessionKeyPrompt />
        </div>

        {/* Right Column: House Pool Solvency vs Hyperliquid Clearinghouse State */}
        <div className={`lg:col-span-5 ${isProMode ? 'space-y-2.5' : 'space-y-4'}`}>
          {isPerps ? (
            <div className={`relative overflow-hidden rounded-2xl border border-border bg-white shadow-sm ${
              isProMode ? 'p-3.5 space-y-3' : 'p-5 space-y-4'
            }`}>
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#06964A] to-[#A0D4CA] opacity-80" />

              <div className="flex items-center justify-between pb-3 border-b border-border">
                <span className="font-bold tracking-wider flex items-center gap-1.5 text-foreground font-mono">
                  <Shield className="w-3.5 h-3.5 text-[#06964A]" />
                  HYPERLIQUID L1 STATE
                </span>
                <span className="px-2 py-0.5 text-[9px] bg-[#E3F8EC] border border-[#06964A]/30 text-[#06964A] rounded-full font-bold">
                  {hlNetwork.toUpperCase()} ACTIVE
                </span>
              </div>

              <div className="space-y-3 text-[11px] font-mono">
                <div className="flex justify-between text-muted-foreground">
                  <span>ACCOUNT VALUE</span>
                  <span className="text-foreground font-bold tabular">${fmtUsd(t.balance)} USDC</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>WITHDRAWABLE MARGIN</span>
                  <span className="text-[#06964A] font-bold tabular">${fmtUsd(t.available)} USDC</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>SETTLEMENT ENGINE</span>
                  <span className="text-foreground font-semibold">Hyperliquid L1 Clearinghouse</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>EXECUTION PROTOCOL</span>
                  <span className="text-[#5E5CE6] font-bold tabular">EIP-712 Phantom Agent</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>MARGIN MODE</span>
                  <span className="text-foreground tabular">Isolated Margin (Default)</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>MIN ORDER NOTIONAL</span>
                  <span className="text-foreground tabular">$10.00 USDC</span>
                </div>
              </div>

              <div className="p-3 bg-[#F6F6F4] border border-border rounded-xl text-[10px] text-muted-foreground font-mono flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-foreground font-semibold">
                  <Shield className="w-3.5 h-3.5 text-[#06964A]" />
                  <span>Non-Custodial</span>
                </div>
                <span className="text-[#06964A] font-semibold">Direct L1 Wallet Signing</span>
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-2xl border border-border bg-white p-5 shadow-sm space-y-4">
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#CBCBE8] to-[#EBD0C6] opacity-70" />

              <div className="flex items-center justify-between pb-3 border-b border-border">
                <span className="font-bold tracking-wider flex items-center gap-1.5 text-foreground font-mono">
                  <Database className="w-3.5 h-3.5 text-[#06964A]" />
                  HOUSE POOL SOLVENCY (PAPER)
                </span>
                <span className="px-2 py-0.5 text-[9px] bg-[#E3F8EC] border border-[#06964A]/30 text-[#06964A] rounded-full font-bold">
                  100% SOLVENT
                </span>
              </div>

              <div className="space-y-3 text-[11px] font-mono">
                <div className="flex justify-between text-muted-foreground">
                  <span>STARTING BALANCE</span>
                  <span className="text-foreground font-bold tabular">$10,000.00 USDC</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>AVAILABLE PAPER MARGIN</span>
                  <span className="text-[#06964A] font-bold tabular">${fmtUsd(t.available)} USDC</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>LEVERAGE RANGE</span>
                  <span className="text-foreground font-bold tabular">1× to 1000× (All Assets)</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>EXECUTION TYPE</span>
                  <span className="text-foreground font-semibold">Instant Market Execution</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>LIQUIDATION ENGINE</span>
                  <span className="text-foreground font-semibold">Authoritative Server-Side</span>
                </div>
              </div>

              <div className="p-3 bg-[#F6F6F4] border border-border rounded-xl text-[10px] text-muted-foreground font-mono flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-foreground font-semibold">
                  <Shield className="w-3.5 h-3.5 text-[#06964A]" />
                  <span>Simulated Environment</span>
                </div>
                <span className="text-[#D97706] font-semibold">Zero Real Funds at Risk</span>
              </div>
            </div>
          )}

          <div className="relative overflow-hidden rounded-2xl border border-border bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="font-bold tracking-wider flex items-center gap-1.5 text-foreground font-mono">
                <Layers className="w-3.5 h-3.5 text-[#06964A]" />
                CASHFLOW WATERFALL
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">DETERMINISTIC</span>
            </div>

            <div className="space-y-2 text-[11px] font-mono">
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

      {/* Discrete Positions Table & Trading History */}
      <div className="mt-4">
        <Dock
          feeds={t?.feeds || ({} as any)}
          open={t?.positions || []}
          history={t?.history || []}
          onSelect={(sym) => {
            const found = MARKETS.find((def) => def.symbol.startsWith(sym));
            if (found) handleMarketSelect(found);
          }}
          onClose={t?.close || (() => {})}
          onShare={setShareTrade}
        />
      </div>

      {/* Shareable PnL Card Modal */}
      <ShareModal
        trade={shareTrade}
        onOpenChange={(open) => {
          if (!open) setShareTrade(null);
        }}
      />
    </div>
  );
}
