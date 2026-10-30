import React, { useState } from 'react';
import { Trophy, Flame, Award, Timer, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { fmtSigned } from '@/lib/engine';

interface LeaderboardEntry {
  rank: number;
  trader: string;
  roi: number;
  pnl: number;
  volume: string;
  trophy: string;
  winRate: string;
  prizeUsdc: number;
}

const CUP_STANDINGS: LeaderboardEntry[] = [
  { rank: 1, trader: '0x9c97…4fa2', roi: 482.5, pnl: 48250, volume: '$1.42M', trophy: 'Titanium Godcandle Dial', winRate: '78%', prizeUsdc: 25000 },
  { rank: 2, trader: '0x7c85…a08d', roi: 395.2, pnl: 39520, volume: '$980K', trophy: 'Silver Anodized Knob', winRate: '72%', prizeUsdc: 15000 },
  { rank: 3, trader: '0xa63e…e1f8', roi: 312.8, pnl: 31280, volume: '$760K', trophy: 'Bronze Knurled Dial', winRate: '69%', prizeUsdc: 7500 },
  { rank: 4, trader: '0x18db…82c9', roi: 245.0, pnl: 24500, volume: '$510K', trophy: 'Hardware Commemorative Badge', winRate: '65%', prizeUsdc: 3000 },
  { rank: 5, trader: '0x3ef2…901a', roi: 198.4, pnl: 19840, volume: '$430K', trophy: 'Hardware Commemorative Badge', winRate: '63%', prizeUsdc: 2000 },
  { rank: 6, trader: '0x8821…bb34', roi: 164.2, pnl: 16420, volume: '$390K', trophy: 'Hardware Commemorative Badge', winRate: '61%', prizeUsdc: 1000 },
];

export function LeaderboardTable() {
  const [filterPeriod, setFilterPeriod] = useState<'Current Season' | 'Previous Season'>('Current Season');

  return (
    <div className="space-y-6 font-mono text-xs text-accent">
      {/* Top Banner: Weekly Candle Cup Showcase */}
      <div className="bg-surface border border-border p-6 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2 text-bull mb-1">
              <Trophy className="w-5 h-5 text-accent" />
              <span className="font-bold text-sm tracking-wider text-accent uppercase">
                WEEKLY CANDLE CUP — SEASON 12
              </span>
            </div>
            <p className="text-subtle text-xs">
              Weekly ROI competition paying out real USDC and custom hardware trophies directly on HyperEVM.
            </p>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div>
              <span className="text-[10px] text-subtle block">SEASON ENDS IN</span>
              <span className="text-accent font-bold tabular flex items-center gap-1 justify-end">
                <Timer className="w-3.5 h-3.5 text-bull" />
                2d 14h 22m 08s
              </span>
            </div>
            <div className="pl-4 border-l border-border">
              <span className="text-[10px] text-subtle block">PRIZE POOL</span>
              <span className="text-bull font-bold text-base tabular">$53,500 USDC</span>
            </div>
          </div>
        </div>

        {/* Podium Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-5">
          {CUP_STANDINGS.slice(0, 3).map((item) => {
            const isFirst = item.rank === 1;
            return (
              <div
                key={item.rank}
                className={`p-4 border relative ${
                  isFirst
                    ? 'border-accent bg-surface-elevated'
                    : 'border-border bg-background'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                      isFirst
                        ? 'bg-accent text-background'
                        : 'bg-surface text-subtle border border-border'
                    }`}
                  >
                    RANK #{item.rank}
                  </span>
                  <span className="text-bull font-bold tabular text-sm">
                    ${item.prizeUsdc.toLocaleString()} USDC
                  </span>
                </div>

                <div className="text-xs font-semibold text-accent truncate mt-1">
                  {item.trader}
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-[10px] text-subtle">NET ROI</span>
                  <span className="text-bull font-bold tabular text-lg">
                    +{item.roi}%
                  </span>
                </div>

                <div className="mt-2 pt-2 border-t border-border flex items-center justify-between text-[10px] text-subtle">
                  <span>TROPHY:</span>
                  <span className="text-accent font-semibold">{item.trophy}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Standings Table */}
      <div className="bg-surface border border-border overflow-x-auto">
        <table className="w-full min-w-[700px] text-left">
          <thead className="bg-background text-subtle text-[10px] uppercase border-b border-border">
            <tr>
              <th className="p-3.5">Rank</th>
              <th className="p-3.5">Trader</th>
              <th className="p-3.5">Weekly ROI</th>
              <th className="p-3.5">Realized PnL</th>
              <th className="p-3.5">Volume</th>
              <th className="p-3.5">Win Rate</th>
              <th className="p-3.5">Physical Award</th>
              <th className="p-3.5 text-right">Prize</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {CUP_STANDINGS.map((row) => (
              <tr key={row.rank} className="hover:bg-surface-elevated/50 transition-colors">
                <td className="p-3.5 font-bold tabular">#{row.rank}</td>
                <td className="p-3.5 text-accent font-semibold tabular">{row.trader}</td>
                <td className="p-3.5 text-bull font-bold tabular">+{row.roi}%</td>
                <td className="p-3.5 text-accent tabular">${row.pnl.toLocaleString()}</td>
                <td className="p-3.5 text-subtle tabular">{row.volume}</td>
                <td className="p-3.5 text-accent tabular">{row.winRate}</td>
                <td className="p-3.5 text-subtle text-[11px]">{row.trophy}</td>
                <td className="p-3.5 text-right font-bold text-bull tabular">
                  ${row.prizeUsdc.toLocaleString()} USDC
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
