import React, { useState, useEffect, useMemo } from 'react';
import { Share2, X, Download, AlertCircle } from 'lucide-react';
import {
  fmtDuration,
  fmtSigned,
  fmtUsd,
  liquidation,
  pnlOf,
  type ClosedTrade,
  type Position,
} from '@/lib/trade';
import { Button } from '@/components/ui/button';
import { getMarket, type MarketSymbol } from '@/config/markets';
import type { FeedSnap } from '@/lib/price-feed';
import { MarketLogo } from './MarketLogo';
import { useTrading } from './TradingProvider';
import { fetchOpenOrders, fetchUserFundingHistory } from '@/lib/hyperliquid/market-data';
import { useAccount } from 'wagmi';

interface Props {
  feeds: Record<MarketSymbol, FeedSnap>;
  onSelect: (m: MarketSymbol) => void;
  open: Position[];
  history: ClosedTrade[];
  onClose: (idOrMarket: string) => void;
  onShare: (t: ClosedTrade) => void;
}

const SideBadge = ({ side }: { side: string }) => (
  <span
    className={`rounded-sm px-1.5 py-0.2 text-[10px] font-bold uppercase font-mono ${
      side.toLowerCase() === 'long' || side.toLowerCase() === 'buy'
        ? 'bg-[#00D964] text-black'
        : 'bg-[#FF3B30] text-white'
    }`}
  >
    {side.toUpperCase()}
  </span>
);

export function Dock({ feeds, onSelect, open, history, onClose, onShare }: Props) {
  const t = useTrading();
  const { address } = useAccount();
  const [tab, setTab] = useState<'positions' | 'orders' | 'fills' | 'funding' | 'balances' | 'stats'>('positions');
  const [openOrders, setOpenOrders] = useState<any[]>([]);
  const [fundingHistory, setFundingHistory] = useState<any[]>([]);

  // Fetch open orders and funding
  useEffect(() => {
    let mounted = true;
    if (address) {
      fetchOpenOrders(address).then((orders) => {
        if (mounted) setOpenOrders(orders);
      });
      fetchUserFundingHistory(address).then((fundings) => {
        if (mounted) setFundingHistory(fundings);
      });
    }
    return () => {
      mounted = false;
    };
  }, [address]);

  // Total unrealized PnL
  const unrealizedPnl = useMemo(() => {
    return open.reduce((acc, pos) => {
      const price = feeds[pos.market]?.price ?? pos.entry;
      return acc + pnlOf(pos, price);
    }, 0);
  }, [open, feeds]);

  const wins = history.filter((h) => h.pnl > 0).length;
  const totalRealizedPnl = history.reduce((s, h) => s + h.pnl, 0);
  const best = history.length ? Math.max(...history.map((h) => h.pnl)) : 0;
  const worst = history.length ? Math.min(...history.map((h) => h.pnl)) : 0;

  const tabs = [
    { id: 'positions', label: `Positions (${open.length})` },
    { id: 'orders', label: `Orders (${openOrders.length})` },
    { id: 'fills', label: `Fills (${history.length})` },
    { id: 'funding', label: `Funding` },
    { id: 'balances', label: `Balances` },
    { id: 'stats', label: `Stats` },
  ] as const;

  const handleExportCsv = () => {
    if (history.length === 0) return;
    const headers = ['Order ID', 'Market', 'Side', 'Leverage', 'Entry', 'Exit', 'PnL', 'Date'];
    const rows = history.map((h) => [
      h.id,
      `${h.market}-USD`,
      h.side,
      h.leverage,
      h.entry,
      h.exit,
      h.pnl,
      new Date(h.closedAt).toISOString(),
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `godcandle_trades_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="rounded-2xl border border-border bg-white shadow-xs overflow-hidden select-none font-mono text-[11px]">
      {/* Account Telemetry Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2 bg-[#FBFBFA] border-b border-border text-[11px]">
        <div className="flex items-center gap-4 text-muted-foreground">
          <div>
            <span className="text-[9px] uppercase tracking-wider block text-muted-foreground/75">Equity</span>
            <span className="font-bold text-foreground tabular">${fmtUsd(t.balance, 2)}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div>
            <span className="text-[9px] uppercase tracking-wider block text-muted-foreground/75">Available</span>
            <span className="font-bold text-[#06964A] tabular">${fmtUsd(t.available, 2)}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div>
            <span className="text-[9px] uppercase tracking-wider block text-muted-foreground/75">Margin Used</span>
            <span className="font-medium text-foreground tabular">${fmtUsd(t.marginUsed, 2)}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div>
            <span className="text-[9px] uppercase tracking-wider block text-muted-foreground/75">Unrealized PnL</span>
            <span
              className={`font-bold tabular ${
                unrealizedPnl >= 0 ? 'text-[#06964A]' : 'text-[#FF3B30]'
              }`}
            >
              {fmtSigned(unrealizedPnl)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-muted-foreground">
            Realized PnL:{' '}
            <span className={`font-bold ${totalRealizedPnl >= 0 ? 'text-[#06964A]' : 'text-[#FF3B30]'}`}>
              {fmtSigned(totalRealizedPnl)}
            </span>
          </span>
          {tab === 'stats' && history.length > 0 && (
            <Button
              variant="terminal"
              onClick={handleExportCsv}
              className="h-6 px-2 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-[10px] gap-1 flex items-center"
            >
              <Download className="size-3" />
              <span>Export CSV</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center justify-between p-1.5 border-b border-border bg-white overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1">
          {tabs.map((tItem) => (
            <button
              key={tItem.id}
              type="button"
              onClick={() => setTab(tItem.id as any)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                tab === tItem.id
                  ? 'bg-foreground text-background font-bold shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
              }`}
            >
              {tItem.label}
            </button>
          ))}
        </div>

        {tab === 'orders' && openOrders.length > 0 && (
          <button
            type="button"
            onClick={() => setOpenOrders([])}
            className="px-2 py-0.5 rounded-lg text-[10px] font-bold text-[#FF3B30] hover:bg-[#FFECEA] border border-[#FF3B30]/30 transition-colors"
          >
            Cancel All Orders
          </button>
        )}
      </div>

      {/* Tab Panels */}
      <div className="p-3">
        {/* Positions Tab */}
        {tab === 'positions' && (
          open.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-muted-foreground">
              No open positions.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-xs font-mono tabular">
                <thead>
                  <tr className="text-left text-[10px] uppercase text-muted-foreground border-b border-border/60 pb-2">
                    <th className="py-2 px-2">Market</th>
                    <th className="py-2 px-2">Side</th>
                    <th className="py-2 px-2 text-right">Size</th>
                    <th className="py-2 px-2 text-right">Entry</th>
                    <th className="py-2 px-2 text-right">Mark</th>
                    <th className="py-2 px-2 text-right">Liq Price</th>
                    <th className="py-2 px-2 text-right">Margin</th>
                    <th className="py-2 px-2 text-right">uPnL / ROE</th>
                    <th className="py-2 px-2 text-right">TP / SL</th>
                    <th className="py-2 px-2 text-right">Close Position</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {open.map((pos) => {
                    const price = feeds[pos.market]?.price ?? pos.entry;
                    const market = getMarket(pos.market);
                    const pnl = pnlOf(pos, price);
                    const roi = (pnl / pos.stake) * 100;
                    const isUp = pnl >= 0;
                    const liqP = liquidation(pos);
                    const sz = (pos.stake * pos.leverage) / pos.entry;

                    return (
                      <tr key={pos.id} className="hover:bg-secondary/40 transition-colors">
                        <td className="py-2.5 px-2">
                          <button
                            type="button"
                            onClick={() => onSelect(pos.market)}
                            className="flex items-center gap-1.5 font-bold hover:underline"
                          >
                            <MarketLogo symbol={pos.market} size={18} />
                            <span>{pos.market}-USD</span>
                            <span className="text-[10px] font-normal text-muted-foreground">
                              {pos.leverage}×
                            </span>
                          </button>
                        </td>
                        <td className="py-2.5 px-2">
                          <SideBadge side={pos.side} />
                        </td>
                        <td className="py-2.5 px-2 text-right font-medium">
                          {sz.toFixed(market.decimals > 2 ? 4 : 2)}
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          ${fmtUsd(pos.entry, market.decimals)}
                        </td>
                        <td className="py-2.5 px-2 text-right font-semibold">
                          ${fmtUsd(price, market.decimals)}
                        </td>
                        <td className="py-2.5 px-2 text-right font-semibold text-[#FF3B30]">
                          ${fmtUsd(liqP, market.decimals)}
                        </td>
                        <td className="py-2.5 px-2 text-right font-medium">
                          ${fmtUsd(pos.stake, 2)}
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <div className={isUp ? 'text-[#06964A] font-bold' : 'text-[#FF3B30] font-bold'}>
                            {fmtSigned(pnl)}
                          </div>
                          <div className={`text-[10px] ${isUp ? 'text-[#06964A]' : 'text-[#FF3B30]'}`}>
                            {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-right text-[10px] text-muted-foreground">
                          {pos.tp && <span className="text-[#06964A] block">TP ${fmtUsd(pos.tp, 1)}</span>}
                          {pos.sl && <span className="text-[#FF3B30] block">SL ${fmtUsd(pos.sl, 1)}</span>}
                          {!pos.tp && !pos.sl && <span>—</span>}
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                onShare({
                                  ...pos,
                                  exit: price,
                                  pnl,
                                  liquidated: false,
                                  closedAt: Date.now(),
                                  durationMs: Date.now() - pos.openedAt,
                                });
                              }}
                              className="px-2 py-1 rounded bg-secondary hover:bg-secondary/80 border border-border text-[10px] cursor-pointer"
                              title="Share PnL"
                            >
                              Share
                            </button>
                            <button
                              type="button"
                              onClick={() => onClose(pos.id)}
                              className="px-2.5 py-1 rounded bg-foreground text-background font-bold text-[10px] hover:opacity-90 shadow-2xs cursor-pointer"
                            >
                              Market
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Orders Tab */}
        {tab === 'orders' && (
          openOrders.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-muted-foreground">
              No active orders.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono tabular">
                <thead>
                  <tr className="text-left text-[10px] uppercase text-muted-foreground border-b border-border/60 pb-2">
                    <th className="py-2 px-2">Market</th>
                    <th className="py-2 px-2">Side</th>
                    <th className="py-2 px-2">Type</th>
                    <th className="py-2 px-2 text-right">Size</th>
                    <th className="py-2 px-2 text-right">Price</th>
                    <th className="py-2 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {openOrders.map((ord, idx) => (
                    <tr key={ord.oid || idx} className="hover:bg-secondary/40">
                      <td className="py-2 px-2 font-bold">{ord.coin}-USD</td>
                      <td className="py-2 px-2">
                        <SideBadge side={ord.side === 'B' ? 'long' : 'short'} />
                      </td>
                      <td className="py-2 px-2 text-muted-foreground">{ord.orderType || 'Limit'}</td>
                      <td className="py-2 px-2 text-right">{ord.sz}</td>
                      <td className="py-2 px-2 text-right">${ord.limitPx}</td>
                      <td className="py-2 px-2 text-right">
                        <button
                          type="button"
                          onClick={() => setOpenOrders((prev) => prev.filter((o) => o !== ord))}
                          className="px-2 py-0.5 rounded text-[10px] font-bold text-[#FF3B30] hover:bg-[#FFECEA]"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Fills Tab */}
        {tab === 'fills' && (
          history.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-muted-foreground">
              No fills yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-xs font-mono tabular">
                <thead>
                  <tr className="text-left text-[10px] uppercase text-muted-foreground border-b border-border/60 pb-2">
                    <th className="py-2 px-2">Order ID</th>
                    <th className="py-2 px-2">Market</th>
                    <th className="py-2 px-2">Side</th>
                    <th className="py-2 px-2 text-right">Entry</th>
                    <th className="py-2 px-2 text-right">Exit</th>
                    <th className="py-2 px-2 text-right">Realized PnL</th>
                    <th className="py-2 px-2 text-right">Duration</th>
                    <th className="py-2 px-2 text-right">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {history.map((h) => (
                    <tr key={h.id} className="hover:bg-secondary/40">
                      <td className="py-2 px-2 text-muted-foreground text-[10px]">#{h.id.slice(0, 8)}</td>
                      <td className="py-2 px-2 font-bold">{h.market}-USD</td>
                      <td className="py-2 px-2">
                        <SideBadge side={h.side} />
                      </td>
                      <td className="py-2 px-2 text-right">${fmtUsd(h.entry, 2)}</td>
                      <td className="py-2 px-2 text-right">${fmtUsd(h.exit, 2)}</td>
                      <td className={`py-2 px-2 text-right font-bold ${h.pnl >= 0 ? 'text-[#06964A]' : 'text-[#FF3B30]'}`}>
                        {fmtSigned(h.pnl)}
                      </td>
                      <td className="py-2 px-2 text-right text-muted-foreground">{fmtDuration(h.durationMs)}</td>
                      <td className="py-2 px-2 text-right">
                        <button
                          type="button"
                          onClick={() => onShare(h)}
                          className="px-2 py-0.5 rounded bg-secondary hover:bg-secondary/80 border border-border text-[10px]"
                        >
                          Share
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Funding Tab */}
        {tab === 'funding' && (
          fundingHistory.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-muted-foreground">
              No funding payments yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono tabular">
                <thead>
                  <tr className="text-left text-[10px] uppercase text-muted-foreground border-b border-border/60 pb-2">
                    <th className="py-2 px-2">Time</th>
                    <th className="py-2 px-2">Market</th>
                    <th className="py-2 px-2 text-right">Rate</th>
                    <th className="py-2 px-2 text-right">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {fundingHistory.map((f, i) => (
                    <tr key={i} className="hover:bg-secondary/40">
                      <td className="py-2 px-2 text-muted-foreground">
                        {new Date(f.time).toLocaleString()}
                      </td>
                      <td className="py-2 px-2 font-bold">{f.coin}</td>
                      <td className="py-2 px-2 text-right">{(parseFloat(f.fundingRate) * 100).toFixed(4)}%</td>
                      <td className="py-2 px-2 text-right font-bold text-foreground">${f.usdc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Balances Tab */}
        {tab === 'balances' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-[#FBFBFA] border border-border">
              <span className="text-[10px] text-muted-foreground uppercase block">Account Equity</span>
              <span className="text-base font-bold text-foreground">${fmtUsd(t.balance, 2)}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#FBFBFA] border border-border">
              <span className="text-[10px] text-muted-foreground uppercase block">Available Margin</span>
              <span className="text-base font-bold text-[#06964A]">${fmtUsd(t.available, 2)}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#FBFBFA] border border-border">
              <span className="text-[10px] text-muted-foreground uppercase block">Margin In Use</span>
              <span className="text-base font-bold text-foreground">${fmtUsd(t.marginUsed, 2)}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#FBFBFA] border border-border">
              <span className="text-[10px] text-muted-foreground uppercase block">Settlement Layer</span>
              <span className="text-xs font-semibold text-foreground">Hyperliquid L1 Clearinghouse</span>
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {tab === 'stats' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[#FBFBFA] border border-border">
                <span className="text-[10px] text-muted-foreground uppercase block">Win Rate</span>
                <span className="text-lg font-bold text-foreground">
                  {history.length ? `${Math.round((wins / history.length) * 100)}%` : '—'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#FBFBFA] border border-border">
                <span className="text-[10px] text-muted-foreground uppercase block">Best Trade</span>
                <span className={`text-lg font-bold ${best >= 0 ? 'text-[#06964A]' : 'text-[#FF3B30]'}`}>
                  {fmtSigned(best)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#FBFBFA] border border-border">
                <span className="text-[10px] text-muted-foreground uppercase block">Worst Trade</span>
                <span className={`text-lg font-bold ${worst >= 0 ? 'text-[#06964A]' : 'text-[#FF3B30]'}`}>
                  {fmtSigned(worst)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#FBFBFA] border border-border">
                <span className="text-[10px] text-muted-foreground uppercase block">Total PnL</span>
                <span className={`text-lg font-bold ${totalRealizedPnl >= 0 ? 'text-[#06964A]' : 'text-[#FF3B30]'}`}>
                  {fmtSigned(totalRealizedPnl)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
