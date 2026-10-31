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
    <div className="space-y-6 font-sans text-xs text-foreground">
      {/* Top Banner: Weekly Candle Cup Showcase */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-white p-6 shadow-sm">
        {/* Subtle Iridescent Top Bar */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#CDC3F0] via-[#FFDAC8] to-[#A0D4CA]" />

        {/* Ambient Rainbow Glow behind hero */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-[#CDC3F0]/25 via-[#FFDAC8]/20 to-[#A0D4CA]/25 blur-3xl" />

        <div className="relative flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1 rounded-lg bg-gradient-to-r from-[#CDC3F0]/50 to-[#FFDAC8]/50 text-foreground">
                <Trophy className="w-4 h-4 text-foreground" />
              </span>
              <span className="font-bold text-sm tracking-wider text-foreground uppercase">
                WEEKLY CANDLE CUP — SEASON 12
              </span>
              <span className="rounded-full bg-gradient-to-r from-[#CDC3F0]/40 via-[#FFDAC8]/40 to-[#A0D4CA]/40 px-2 py-0.5 text-[9px] font-semibold uppercase text-foreground border border-border">
                Live
              </span>
            </div>
            <p className="text-muted-foreground text-xs">
              Weekly ROI competition paying out real USDC and custom hardware trophies directly on HyperEVM.
            </p>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div>
              <span className="text-[10px] text-muted-foreground block">SEASON ENDS IN</span>
              <span className="text-foreground font-bold tabular flex items-center gap-1 justify-end">
                <Timer className="w-3.5 h-3.5 text-[#06964A]" />
                2d 14h 22m 08s
              </span>
            </div>
            <div className="pl-4 border-l border-border">
              <span className="text-[10px] text-muted-foreground block">PRIZE POOL</span>
              <span className="text-[#06964A] font-bold text-base tabular">$53,500 USDC</span>
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
                className={`p-4 rounded-2xl border relative transition-all shadow-sm ${
                  isFirst
                    ? 'border-foreground/20 bg-gradient-to-b from-[#CDC3F0]/10 via-[#FFDAC8]/5 to-white'
                    : 'border-border bg-[#F6F6F4]/50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      isFirst
                        ? 'bg-gradient-to-r from-[#CDC3F0] via-[#FFDAC8] to-[#A0D4CA] text-foreground shadow-sm'
                        : 'bg-white text-muted-foreground border border-border'
                    }`}
                  >
                    RANK #{item.rank}
                  </span>
                  <span className="text-[#06964A] font-bold tabular text-sm">
                    ${item.prizeUsdc.toLocaleString()} USDC
                  </span>
                </div>

                <div className="text-xs font-semibold text-foreground truncate mt-1">
                  {item.trader}
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-[10px] text-muted-foreground">NET ROI</span>
                  <span className="text-[#06964A] font-bold tabular text-lg">
                    +{item.roi}%
                  </span>
                </div>

                <div className="mt-2 pt-2 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>TROPHY:</span>
                  <span className="text-foreground font-semibold">{item.trophy}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Standings Table */}
      <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-sm">
        <table className="w-full min-w-[700px] text-left">
          <thead className="bg-[#F6F6F4] text-muted-foreground text-[10px] uppercase border-b border-border">
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
              <tr key={row.rank} className="hover:bg-[#F6F6F4]/50 transition-colors">
                <td className="p-3.5 font-bold tabular text-foreground">#{row.rank}</td>
                <td className="p-3.5 text-foreground font-semibold tabular">{row.trader}</td>
                <td className="p-3.5 text-[#06964A] font-bold tabular">+{row.roi}%</td>
                <td className="p-3.5 text-foreground tabular">${row.pnl.toLocaleString()}</td>
                <td className="p-3.5 text-muted-foreground tabular">{row.volume}</td>
                <td className="p-3.5 text-foreground tabular">{row.winRate}</td>
                <td className="p-3.5 text-muted-foreground text-[11px]">{row.trophy}</td>
                <td className="p-3.5 text-right font-bold text-[#06964A] tabular">
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
