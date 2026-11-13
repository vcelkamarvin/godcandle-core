import React, { useState, useEffect, Suspense, lazy } from 'react';
import { OrderForm } from './OrderForm';
import { useTrading } from '@/components/godcandle/TradingProvider';
import { PriceChart } from '@/components/godcandle/PriceChart';
import { Dock } from '@/components/godcandle/Dock';
import { ShareModal } from '@/components/godcandle/ShareModal';
import { fmtSigned, fmtUsd, pnlOf, type ClosedTrade } from '@/lib/engine';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/lib/settings';
import { MarketBar } from '@/components/godcandle/MarketBar';
import { WatchlistStrip } from './WatchlistStrip';
import { MarketBookTradesInfo } from './MarketBookTradesInfo';
import { LightweightCandleChart } from './LightweightCandleChart';
import { calcLiquidationPrice, type L2Book } from '@/lib/trading';
import { marketStore, fetchL2BookSnapshot } from '@/lib/hyperliquid/market-data';
import { useAccount } from 'wagmi';
import { Link } from '@tanstack/react-router';
import { BarChart2, CandlestickChart, ExternalLink, Zap, Maximize2, SlidersHorizontal } from 'lucide-react';

// Lazy-load TradingView widget for performance
const TradingViewWidget = lazy(() =>
  import('@/components/godcandle/TradingViewWidget').then((mod) => ({
    default: mod.TradingViewWidget,
  }))
);

export interface MarketDef {
  symbol: string;
  name: string;
  index: number;
  maxLev: number;
  corridorBps: number;
  defaultPrice: number;
}

export const MARKETS: MarketDef[] = [
  { symbol: 'BTC-USD', name: 'Bitcoin', index: 0, maxLev: 50, corridorBps: 1.5, defaultPrice: 68420.5 },
  { symbol: 'ETH-USD', name: 'Ethereum', index: 1, maxLev: 50, corridorBps: 1.5, defaultPrice: 2540.2 },
  { symbol: 'SOL-USD', name: 'Solana', index: 2, maxLev: 20, corridorBps: 1.5, defaultPrice: 182.4 },
  { symbol: 'HYPE-USD', name: 'Hyperliquid', index: 3, maxLev: 10, corridorBps: 3.0, defaultPrice: 42.8 },
  { symbol: 'SPX-USD', name: 'S&P 500', index: 4, maxLev: 20, corridorBps: 1.5, defaultPrice: 6120.0 },
  { symbol: 'DOGE-USD', name: 'Dogecoin', index: 5, maxLev: 10, corridorBps: 3.0, defaultPrice: 0.164 },
  { symbol: 'SUI-USD', name: 'Sui', index: 6, maxLev: 20, corridorBps: 1.5, defaultPrice: 2.15 },
  { symbol: 'AVAX-USD', name: 'Avalanche', index: 7, maxLev: 20, corridorBps: 1.5, defaultPrice: 28.6 },
  { symbol: 'BNB-USD', name: 'BNB', index: 8, maxLev: 20, corridorBps: 1.5, defaultPrice: 620.5 },
  { symbol: 'LINK-USD', name: 'Chainlink', index: 9, maxLev: 20, corridorBps: 1.5, defaultPrice: 14.8 },
  { symbol: 'ARB-USD', name: 'Arbitrum', index: 10, maxLev: 20, corridorBps: 1.5, defaultPrice: 0.62 },
  { symbol: 'OP-USD', name: 'Optimism', index: 11, maxLev: 20, corridorBps: 1.5, defaultPrice: 1.75 },
  { symbol: 'TIA-USD', name: 'Celestia', index: 12, maxLev: 20, corridorBps: 1.5, defaultPrice: 5.4 },
  { symbol: 'APT-USD', name: 'Aptos', index: 13, maxLev: 20, corridorBps: 1.5, defaultPrice: 9.8 },
];

const TIMEFRAMES = [
  { label: '1m', interval: '1m' },
  { label: '5m', interval: '5m' },
  { label: '15m', interval: '15m' },
  { label: '1h', interval: '1h' },
  { label: '4h', interval: '4h' },
  { label: '1D', interval: '1D' },
  { label: 'Tick', interval: 'Tick' },
] as const;

export function TradeTerminal() {
  const t = useTrading();
  const { settings } = useSettings();
  const { address } = useAccount();

  const engineMarkets = t.engine.getMarkets();
  const marketsList: any[] = engineMarkets.length > 0 ? engineMarkets : MARKETS;

  const [selectedMarket, setSelectedMarket] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const symbolParam = (p.get('pair') || p.get('market') || p.get('symbol') || '')
        .toUpperCase()
        .replace('-USD', '');
      if (symbolParam) {
        const found = marketsList.find((m: any) => m.symbol.replace('-USD', '') === symbolParam);
        if (found) return found;
      }
    }
    return marketsList[0] || MARKETS[0]!;
  });
  const rawSymbol = selectedMarket.symbol.replace('-USD', '');

  // Determine dynamic max leverage (1000x when in paper1000x mode)
  const activeMaxLev = t?.mode === 'paper1000x' ? 1000 : t.engine.getMaxLeverage(rawSymbol);
  const [leverage, setLeverage] = useState(() =>
    Math.min(settings.defaultLeverage ?? 10, activeMaxLev)
  );

  // Timeframe and chart modes
  const [chartMode, setChartMode] = useState<'chart' | 'tradingview'>('chart');
  const [selectedTf, setSelectedTf] = useState<string>('15m');
  const [shareTrade, setShareTrade] = useState<ClosedTrade | null>(null);
  const [selectedBookPrice, setSelectedBookPrice] = useState<number | null>(null);
  const [l2Book, setL2Book] = useState<L2Book>({ bids: [], asks: [] });
  const [showIndicators, setShowIndicators] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Subscribe to live L2 book
  useEffect(() => {
    let mounted = true;
    fetchL2BookSnapshot(rawSymbol).then((book) => {
      if (mounted && (book.bids.length > 0 || book.asks.length > 0)) {
        setL2Book(book);
      }
    });
    const unsub = marketStore.subscribeL2Book(rawSymbol, (book) => {
      if (mounted) setL2Book(book);
    });
    return () => {
      mounted = false;
      unsub();
    };
  }, [rawSymbol]);

  // Watchlist favorites
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('godcandle_favorite_markets');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return ['BTC', 'ETH', 'SOL', 'HYPE'];
  });

  const [mobileTab, setMobileTab] = useState<'chart' | 'trade'>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('tab') === 'trade') return 'trade';
      if (p.get('tab') === 'chart') return 'chart';
    }
    return 'chart';
  });

  // Clamp leverage when activeMaxLev, mode, or selected asset changes
  useEffect(() => {
    const currentMax = t?.mode === 'paper1000x' ? 1000 : t.engine.getMaxLeverage(rawSymbol);
    setLeverage((prev) => Math.min(prev, currentMax));
  }, [rawSymbol, t?.mode, t.engine]);

  const currentPrice =
    (t?.feeds as Record<string, any>)?.[rawSymbol]?.price || selectedMarket.defaultPrice;
  const open24h =
    (t?.feeds as Record<string, any>)?.[rawSymbol]?.open24 || currentPrice * 0.985;
  const currentPosition = t?.positions?.find((p) => p.market === rawSymbol) ?? null;
  const posPnl = currentPosition ? pnlOf(currentPosition, currentPrice) : 0;
  const pnlLabel = currentPosition ? fmtSigned(posPnl) : '';

  const handleOrder = (
    side: 'LONG' | 'SHORT',
    margin: number,
    lev: number,
    tp?: number | null,
    sl?: number | null
  ) => {
    if (t?.open) {
      t.open(rawSymbol, side.toLowerCase() as 'long' | 'short', margin, lev, tp, sl);
    }
  };

  const handleMarketSelect = (m: MarketDef) => {
    setSelectedMarket(m);
    const asset = m.symbol.replace('-USD', '');
    const maxLev = t?.mode === 'paper1000x' ? 1000 : t.engine.getMaxLeverage(asset);
    setLeverage((prev) => Math.min(prev, maxLev));
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('pair', m.symbol);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const handleSelectSymbol = (sym: string) => {
    const found = marketsList.find((m: any) => m.symbol.replace('-USD', '') === sym) || {
      symbol: `${sym}-USD`,
      name: sym,
      index: 0,
      maxLev: t?.mode === 'paper1000x' ? 1000 : t.engine.getMaxLeverage(sym),
      corridorBps: 1.5,
      defaultPrice: (t?.feeds as any)?.[sym]?.price || 100,
    };
    handleMarketSelect(found);
  };

  return (
    <div className="mx-auto font-sans text-foreground space-y-1.5 max-w-[1920px] w-full overflow-x-hidden text-xs min-[1440px]:h-full min-[1440px]:flex min-[1440px]:flex-col min-[1440px]:overflow-hidden 2xl:h-full 2xl:flex 2xl:flex-col 2xl:overflow-hidden">
      {/* 1. Market Bar: mark, 24h%, funding+countdown, OI, 24h vol, max lev, index/oracle on hover */}
      <MarketBar
        market={rawSymbol}
        resetLabel="Reset ($10k)"
        onSelect={(s) => handleSelectSymbol(s)}
        price={currentPrice}
        open24h={open24h}
        corridorBps={selectedMarket.corridorBps}
        showReset={t?.mode === 'paper1000x'}
        onReset={() => t?.resetPaperBalance && t.resetPaperBalance()}
      />

      {/* 2. Watchlist Strip: persistent starred favorites with [+] picker trigger */}
      <WatchlistStrip
        favorites={favorites}
        activeMarket={rawSymbol}
        onSelectMarket={handleSelectSymbol}
        onOpenPicker={() => {
          // Trigger Cmd+K dialog in MarketBar
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
        }}
        feeds={t?.feeds || {}}
      />

      {/* Mobile Segmented Switcher [Perps | 1000x] and [Chart | Trade] */}
      <div className="flex lg:hidden items-center justify-between gap-2 p-1.5 bg-white border border-black/[0.06] rounded-2xl shadow-xs">
        <div className="flex items-center p-0.5 rounded-full bg-[#F0F2F5] border border-black/[0.04]">
          <Link
            to="/"
            search={{ pair: selectedMarket.symbol } as any}
            onClick={() => t?.setMode('perps')}
            className={`h-7 px-3 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
              t?.mode === 'perps'
                ? 'bg-black text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="size-1.5 rounded-full bg-[#00D964] animate-pulse" />
            <span>Perps</span>
          </Link>
          <Link
            to="/trade"
            search={{ pair: selectedMarket.symbol } as any}
            onClick={() => t?.setMode('paper1000x')}
            className={`h-7 px-3 rounded-full text-xs font-bold flex items-center gap-1 transition-all ${
              t?.mode === 'paper1000x'
                ? 'bg-black text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="1000x Paper Synthetic Trading"
          >
            <span>1000x</span>
          </Link>
        </div>

        <div className="flex items-center p-0.5 rounded-full bg-[#F0F2F5] border border-black/[0.04]">
          <button
            type="button"
            onClick={() => setMobileTab('chart')}
            className={`h-7 px-3 rounded-full text-xs font-bold cursor-pointer transition-all ${
              mobileTab === 'chart'
                ? 'bg-white text-foreground shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Chart
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('trade')}
            className={`h-7 px-3 rounded-full text-xs font-bold cursor-pointer transition-all ${
              mobileTab === 'trade'
                ? 'bg-white text-foreground shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Trade
          </button>
        </div>
      </div>

      {/* 3 Columns: Chart (flex) | Book/Trades/Info (≈280px) | Order panel (≈340px) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-[1fr_280px_340px] gap-2 items-start min-[1440px]:flex-1 min-[1440px]:min-h-0 min-[1440px]:items-stretch 2xl:flex-1 2xl:min-h-0 2xl:items-stretch">
        {/* Column 1: Chart Panel (flex, min 500px height) */}
        <div
          className={`lg:col-span-7 xl:col-auto flex flex-col min-h-[500px] min-[1440px]:min-h-0 min-[1440px]:h-full 2xl:min-h-0 2xl:h-full bg-white rounded-2xl border border-black/[0.06] overflow-hidden shadow-xs ${
            isFullscreen ? 'fixed inset-2 z-50 min-h-[calc(100vh-16px)]' : ''
          } ${mobileTab === 'trade' ? 'hidden lg:flex' : 'flex'}`}
        >
          {/* Chart Header Bar: [Chart | TradingView] + Timeframes + Indicators + Fullscreen */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 border-b border-black/[0.06] bg-[#FAFAFC]">
            {/* Chart Mode Switcher */}
            <div className="flex items-center rounded-full bg-[#F0F2F5] p-0.5 border border-black/[0.04]">
              <button
                type="button"
                onClick={() => setChartMode('chart')}
                className={`h-7.5 px-3 rounded-full text-xs font-mono font-medium gap-1.5 flex items-center transition-all cursor-pointer ${
                  chartMode === 'chart'
                    ? 'bg-white text-foreground font-bold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <CandlestickChart className="size-3.5 text-[#00D964]" />
                <span>Chart</span>
              </button>
              <button
                type="button"
                onClick={() => setChartMode('tradingview')}
                className={`h-7.5 px-3 rounded-full text-xs font-mono font-medium gap-1.5 flex items-center transition-all cursor-pointer ${
                  chartMode === 'tradingview'
                    ? 'bg-white text-foreground font-bold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <BarChart2 className="size-3.5 text-[#2563EB]" />
                <span>TradingView</span>
                <span className="text-xs text-muted-foreground font-normal">(External)</span>
              </button>
            </div>

            {/* Timeframe Interval Pills + Indicators + Fullscreen */}
            {chartMode === 'chart' && (
              <div className="flex items-center gap-1.5">
                <div className="flex items-center rounded-full bg-[#F0F2F5] p-0.5 border border-black/[0.04]">
                  {TIMEFRAMES.map((tf) => (
                    <button
                      key={tf.label}
                      type="button"
                      onClick={() => setSelectedTf(tf.interval)}
                      className={`h-7.5 px-2.5 rounded-full text-xs font-mono font-semibold transition-all cursor-pointer ${
                        selectedTf === tf.interval
                          ? 'bg-white text-foreground font-bold shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center rounded-full bg-[#F0F2F5] p-0.5 border border-black/[0.04]">
                  <button
                    type="button"
                    onClick={() => setShowIndicators((prev) => !prev)}
                    className={`h-7.5 px-2.5 rounded-full text-xs font-mono flex items-center gap-1 transition-all cursor-pointer ${
                      showIndicators
                        ? 'bg-white text-foreground font-bold shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title="Toggle indicators (EMA / SMA)"
                  >
                    <SlidersHorizontal className="size-3" />
                    <span>SMA</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFullscreen((prev) => !prev)}
                    className={`h-7.5 px-2 rounded-full text-xs font-mono flex items-center gap-1 transition-all cursor-pointer ${
                      isFullscreen
                        ? 'bg-white text-foreground font-bold shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen chart'}
                  >
                    <Maximize2 className="size-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Chart Viewport */}
          <div className="relative flex-1 w-full min-h-[460px] bg-white">
            {chartMode === 'chart' ? (
              <>
                <LightweightCandleChart
                  coin={rawSymbol}
                  interval={selectedTf}
                  entryPrice={currentPosition?.entry}
                  liquidationPrice={
                    currentPosition
                      ? ((currentPosition as any).liqPrice ??
                         (currentPosition as any).liquidationPrice ??
                         calcLiquidationPrice(
                           currentPosition.entry,
                           currentPosition.leverage,
                           currentPosition.side,
                           t?.mode === 'paper1000x' ? 0.0004 : 0.005
                         ))
                      : null
                  }
                  takeProfitPrice={currentPosition?.tp}
                  stopLossPrice={currentPosition?.sl}
                  showIndicators={showIndicators}
                />
                {currentPosition && (
                  <div className="absolute top-2.5 right-12 z-20 flex items-center gap-2.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-black/[0.06] shadow-sm font-mono text-xs">
                    <span className="font-bold tracking-tight">{currentPosition.side.toUpperCase()} {currentPosition.leverage}×</span>
                    <span className={posPnl >= 0 ? "text-[#00D964] font-bold" : "text-[#FF3B30] font-bold"}>{pnlLabel}</span>
                    <button
                      type="button"
                      onClick={() => t?.close && t.close(currentPosition.id)}
                      className="px-2 py-0.5 rounded-lg bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 text-[#FF3B30] border border-[#FF3B30]/20 text-[10px] font-bold cursor-pointer transition-all active:scale-[0.98]"
                    >
                      Close
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Suspense
                fallback={
                  <div className="h-full min-h-[460px] flex items-center justify-center text-xs font-mono text-muted-foreground">
                    Loading external TradingView feed...
                  </div>
                }
              >
                <TradingViewWidget market={rawSymbol} height="100%" />
              </Suspense>
            )}
          </div>
        </div>

        {/* Column 2: Book / Trades / Info (≈280px) */}
        <div
          className={`hidden xl:block w-full xl:w-[280px] h-[520px] min-[1440px]:h-full min-[1440px]:min-h-0 2xl:h-full 2xl:min-h-0 shrink-0 ${
            mobileTab === 'trade' ? 'hidden' : 'hidden xl:block'
          }`}
        >
          <MarketBookTradesInfo
            coin={rawSymbol}
            currentPrice={currentPrice}
            oraclePrice={currentPrice}
            maxLeverage={activeMaxLev}
            szDecimals={t.engine.getSzDecimals(rawSymbol)}
            userPositionNotional={currentPosition ? currentPosition.stake * currentPosition.leverage : 0}
            onSelectPrice={(px) => setSelectedBookPrice(px)}
          />
        </div>

        {/* Column 3: Order Panel (≈340px) */}
        <div
          className={`lg:col-span-5 xl:col-auto w-full xl:w-[340px] shrink-0 min-[1440px]:h-full min-[1440px]:overflow-y-auto min-[1440px]:min-h-0 2xl:h-full 2xl:overflow-y-auto 2xl:min-h-0 ${
            mobileTab === 'chart' ? 'hidden lg:block' : 'block'
          }`}
        >
          <OrderForm
            currentPrice={currentPrice}
            leverage={leverage}
            onLeverageChange={setLeverage}
            maxLeverage={activeMaxLev}
            asset={rawSymbol}
            corridorBps={selectedMarket.corridorBps}
            availableBalance={t?.available ?? 0}
            mode={t?.mode || 'perps'}
            book={l2Book}
            limitPriceInput={selectedBookPrice}
            onTrade={handleOrder}
          />
        </div>
      </div>

      {/* 4. Bottom Tabs: Positions · Orders · Fills · Funding · Balances · Account Strip */}
      <div className="mt-2 shrink-0 min-[1440px]:max-h-[220px] min-[1440px]:overflow-y-auto 2xl:max-h-[220px] 2xl:overflow-y-auto">
        <Dock
          feeds={t?.feeds || ({} as any)}
          open={t?.positions || []}
          history={t?.history || []}
          onSelect={(sym) => handleSelectSymbol(sym)}
          onClose={t?.close || (() => {})}
          onShare={setShareTrade}
        />
      </div>

      {/* Mobile Sticky Bottom Action Bar (when in 'chart' view) */}
      {mobileTab === 'chart' && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-border p-2 px-3 flex items-center gap-2 shadow-xl pb-[max(0.6rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => {
              setMobileTab('trade');
              window.scrollTo({ top: 0, behavior: 'instant' });
            }}
            className="flex-1 h-11 rounded-xl bg-[#00D964] text-black font-bold font-sans flex items-center justify-center gap-1.5 shadow-xs active:scale-[0.98] transition-transform text-xs cursor-pointer"
          >
            <span className="font-extrabold uppercase tracking-wide">LONG</span>
            <span className="text-xs opacity-80 font-mono">↗</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileTab('trade');
              window.scrollTo({ top: 0, behavior: 'instant' });
            }}
            className="flex-1 h-11 rounded-xl bg-[#FF3B30] text-white font-bold font-sans flex items-center justify-center gap-1.5 shadow-xs active:scale-[0.98] transition-transform text-xs cursor-pointer"
          >
            <span className="font-extrabold uppercase tracking-wide">SHORT</span>
            <span className="text-xs opacity-80 font-mono">↘</span>
          </button>
        </div>
      )}

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
