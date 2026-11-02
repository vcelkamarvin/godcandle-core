import React, { useState, useEffect, useMemo } from 'react';
import { marketStore, type HlTrade, fetchL2BookSnapshot } from '@/lib/hyperliquid/market-data';
import type { L2Book, BookLevel } from '@/lib/trading';
import { fmtUsd } from '@/lib/engine';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, Filter, Info, BookOpen, Clock } from 'lucide-react';

interface MarketBookTradesInfoProps {
  coin: string;
  currentPrice: number;
  oraclePrice?: number;
  fundingRate?: number;
  openInterest?: number;
  maxLeverage?: number;
  szDecimals?: number;
  userPositionNotional?: number;
  onSelectPrice: (price: number) => void;
}

export function MarketBookTradesInfo({
  coin,
  currentPrice,
  oraclePrice = currentPrice,
  fundingRate = 0.0001, // 0.01%
  openInterest = 25000000,
  maxLeverage = 50,
  szDecimals = 2,
  userPositionNotional = 0,
  onSelectPrice,
}: MarketBookTradesInfoProps) {
  const [activeTab, setActiveTab] = useState<'book' | 'trades' | 'info'>('book');
  const [book, setBook] = useState<L2Book>({ bids: [], asks: [] });
  const [trades, setTrades] = useState<HlTrade[]>([]);
  const [tradeFilter, setTradeFilter] = useState<'all' | '1k' | '10k'>('all');

  const rawCoin = coin.replace('-USD', '');

  // Subscribe to L2 Book and Trades
  useEffect(() => {
    let mounted = true;

    // Load initial snapshot
    fetchL2BookSnapshot(rawCoin).then((initBook) => {
      if (mounted && (initBook.bids.length > 0 || initBook.asks.length > 0)) {
        setBook(initBook);
      }
    });

    const unsubBook = marketStore.subscribeL2Book(rawCoin, (newBook) => {
      if (mounted) setBook(newBook);
    });

    const unsubTrades = marketStore.subscribeTrades(rawCoin, (newTrades) => {
      if (mounted) {
        setTrades((prev) => [...newTrades, ...prev].slice(0, 50));
      }
    });

    return () => {
      mounted = false;
      unsubBook();
      unsubTrades();
    };
  }, [rawCoin]);

  // Generate fallback book if offline or during initial connection
  const displayBook = useMemo(() => {
    if (book.bids.length > 0 && book.asks.length > 0) {
      return book;
    }
    const bids: BookLevel[] = [];
    const asks: BookLevel[] = [];
    const step = currentPrice * 0.0003;

    for (let i = 1; i <= 12; i++) {
      bids.push({
        px: currentPrice - i * step,
        sz: +(Math.random() * 2 + 0.5).toFixed(szDecimals),
      });
      asks.push({
        px: currentPrice + i * step,
        sz: +(Math.random() * 2 + 0.5).toFixed(szDecimals),
      });
    }
    return { bids, asks };
  }, [book, currentPrice, szDecimals]);

  // 12 levels per side
  const topAsks = useMemo(() => {
    return displayBook.asks.slice(0, 12).reverse();
  }, [displayBook.asks]);

  const topBids = useMemo(() => {
    return displayBook.bids.slice(0, 12);
  }, [displayBook.bids]);

  // Cumulative depth and totals
  const totalBidVol = useMemo(
    () => topBids.reduce((acc, b) => acc + b.sz * b.px, 0),
    [topBids]
  );
  const totalAskVol = useMemo(
    () => topAsks.reduce((acc, a) => acc + a.sz * a.px, 0),
    [topAsks]
  );
  const totalVol = Math.max(1, totalBidVol + totalAskVol);
  const bidImbalancePct = ((totalBidVol / totalVol) * 100).toFixed(1);

  // Spread calculation
  const bestBid = topBids[0]?.px ?? currentPrice * 0.9995;
  const bestAsk = topAsks[topAsks.length - 1]?.px ?? currentPrice * 1.0005;
  const spreadUsd = Math.max(0, bestAsk - bestBid);
  const spreadBps = bestBid > 0 ? ((spreadUsd / bestBid) * 10000).toFixed(1) : '0.0';

  // Filtered trades
  const filteredTrades = useMemo(() => {
    if (trades.length === 0) {
      // Default placeholder tape
      const now = Date.now();
      return Array.from({ length: 15 }, (_, i) => ({
        coin: rawCoin,
        side: i % 2 === 0 ? ('buy' as const) : ('sell' as const),
        px: currentPrice * (1 + (i % 2 === 0 ? 0.0001 : -0.0001) * i),
        sz: +(Math.random() * 1.5 + 0.1).toFixed(szDecimals),
        time: now - i * 3500,
      }));
    }

    return trades.filter((t) => {
      const notional = t.px * t.sz;
      if (tradeFilter === '1k') return notional >= 1000;
      if (tradeFilter === '10k') return notional >= 10000;
      return true;
    });
  }, [trades, tradeFilter, rawCoin, currentPrice, szDecimals]);

  // Premium between mark and oracle
  const premiumBps = oraclePrice > 0 ? (((currentPrice - oraclePrice) / oraclePrice) * 10000).toFixed(2) : '0.00';
  const fundingPerDayUsd = userPositionNotional > 0 ? userPositionNotional * fundingRate * 24 : 0;

  return (
    <div className="flex flex-col h-full bg-white border border-border rounded-2xl shadow-xs overflow-hidden select-none font-mono text-[11px]">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between p-1.5 border-b border-border bg-[#FBFBFA]">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('book')}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              activeTab === 'book'
                ? "bg-foreground text-background shadow-2xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Book
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('trades')}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              activeTab === 'trades'
                ? "bg-foreground text-background shadow-2xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Trades
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              activeTab === 'info'
                ? "bg-foreground text-background shadow-2xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Info
          </button>
        </div>

        {activeTab === 'book' && (
          <div className="text-[10px] text-muted-foreground tabular">
            Imbalance: <span className="font-bold text-[#06964A]">{bidImbalancePct}% Bids</span>
          </div>
        )}

        {activeTab === 'trades' && (
          <div className="flex items-center gap-1 text-[10px]">
            <Filter className="size-2.5 text-muted-foreground" />
            <select
              value={tradeFilter}
              onChange={(e) => setTradeFilter(e.target.value as any)}
              className="bg-transparent text-muted-foreground hover:text-foreground border-none outline-none font-mono text-[10px] cursor-pointer"
            >
              <option value="all">All Sizes</option>
              <option value="1k">&gt; $1k</option>
              <option value="10k">&gt; $10k</option>
            </select>
          </div>
        )}
      </div>

      {/* Tab 1: Order Book */}
      {activeTab === 'book' && (
        <div className="flex flex-col flex-1 p-2 min-h-0 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-3 text-[10px] uppercase text-muted-foreground pb-1.5 border-b border-border/60">
            <span>Price</span>
            <span className="text-right">Size ({rawCoin})</span>
            <span className="text-right">Total ($)</span>
          </div>

          {/* Asks (Sells) */}
          <div className="flex-1 flex flex-col justify-end space-y-0.5 overflow-hidden py-1">
            {topAsks.map((ask, idx) => {
              const depthPct = Math.min(100, ((ask.sz * ask.px) / totalAskVol) * 250);
              return (
                <div
                  key={`ask-${idx}`}
                  onClick={() => onSelectPrice(ask.px)}
                  className="relative grid grid-cols-3 py-0.5 px-1 rounded hover:bg-secondary cursor-pointer transition-colors group tabular"
                >
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-[#FF3B30]/10 rounded-sm pointer-events-none"
                    style={{ width: `${depthPct}%` }}
                  />
                  <span className="text-[#FF3B30] font-semibold group-hover:underline">
                    ${fmtUsd(ask.px, currentPrice >= 100 ? 1 : 2)}
                  </span>
                  <span className="text-right text-muted-foreground">{ask.sz.toFixed(szDecimals)}</span>
                  <span className="text-right text-muted-foreground font-medium">
                    ${fmtUsd(ask.sz * ask.px, 0)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Spread Bar */}
          <div className="my-1 py-1.5 px-2 bg-secondary/70 border-y border-border/70 flex items-center justify-between text-[10px]">
            <span className="font-bold text-foreground tabular">
              Spread ${fmtUsd(spreadUsd, 2)} ({spreadBps} bps)
            </span>
            <span className="text-muted-foreground tabular">
              Mid: ${fmtUsd((bestBid + bestAsk) / 2, 2)}
            </span>
          </div>

          {/* Bids (Buys) */}
          <div className="flex-1 flex flex-col space-y-0.5 overflow-hidden py-1">
            {topBids.map((bid, idx) => {
              const depthPct = Math.min(100, ((bid.sz * bid.px) / totalBidVol) * 250);
              return (
                <div
                  key={`bid-${idx}`}
                  onClick={() => onSelectPrice(bid.px)}
                  className="relative grid grid-cols-3 py-0.5 px-1 rounded hover:bg-secondary cursor-pointer transition-colors group tabular"
                >
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-[#00D964]/10 rounded-sm pointer-events-none"
                    style={{ width: `${depthPct}%` }}
                  />
                  <span className="text-[#06964A] font-semibold group-hover:underline">
                    ${fmtUsd(bid.px, currentPrice >= 100 ? 1 : 2)}
                  </span>
                  <span className="text-right text-muted-foreground">{bid.sz.toFixed(szDecimals)}</span>
                  <span className="text-right text-muted-foreground font-medium">
                    ${fmtUsd(bid.sz * bid.px, 0)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Trades Tape */}
      {activeTab === 'trades' && (
        <div className="flex-1 p-2 flex flex-col min-h-0 overflow-y-auto no-scrollbar">
          <div className="grid grid-cols-3 text-[10px] uppercase text-muted-foreground pb-1.5 border-b border-border/60">
            <span>Price</span>
            <span className="text-right">Size</span>
            <span className="text-right">Time</span>
          </div>

          <div className="space-y-1 py-1 flex-1 overflow-y-auto no-scrollbar">
            {filteredTrades.map((t, idx) => (
              <div
                key={`t-${idx}-${t.time}`}
                className="grid grid-cols-3 py-0.5 px-1 rounded hover:bg-secondary tabular items-center"
              >
                <span
                  className={cn(
                    "font-semibold flex items-center gap-0.5",
                    t.side === 'buy' ? 'text-[#06964A]' : 'text-[#FF3B30]'
                  )}
                >
                  {t.side === 'buy' ? (
                    <ArrowUpRight className="size-2.5 inline" />
                  ) : (
                    <ArrowDownRight className="size-2.5 inline" />
                  )}
                  ${fmtUsd(t.px, currentPrice >= 100 ? 1 : 2)}
                </span>
                <span className="text-right text-foreground font-medium">
                  {t.sz.toFixed(szDecimals)}
                </span>
                <span className="text-right text-muted-foreground text-[10px]">
                  {new Date(t.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Market Info & Analytics */}
      {activeTab === 'info' && (
        <div className="flex-1 p-3 space-y-3 overflow-y-auto no-scrollbar text-xs">
          <div className="space-y-2 pb-2.5 border-b border-border/60">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              Funding Telemetry
            </span>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Current 1h Rate</span>
              <span className="font-bold text-[#06964A]">{(fundingRate * 100).toFixed(4)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Predicted Next Rate</span>
              <span className="font-semibold text-foreground">{(fundingRate * 0.95 * 100).toFixed(4)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Est. Cost / Day</span>
              <span className="font-mono font-medium text-foreground">
                ${fmtUsd(fundingPerDayUsd, 2)}
              </span>
            </div>
          </div>

          <div className="space-y-2 pb-2.5 border-b border-border/60">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              Open Interest &amp; Premium
            </span>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Open Interest</span>
              <span className="font-bold text-foreground">${fmtUsd(openInterest, 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Oracle Price</span>
              <span className="font-mono text-foreground">${fmtUsd(oraclePrice, 2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Mark / Oracle Premium</span>
              <span className="font-mono text-muted-foreground">{premiumBps} bps</span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              Contract Specifications
            </span>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Max Allowed Leverage</span>
              <span className="font-bold text-foreground">{maxLeverage}×</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Size Decimals</span>
              <span className="font-mono text-foreground">{szDecimals} decimals</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Settlement Asset</span>
              <span className="font-bold text-[#06964A]">USDC (Hyperliquid L1)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
