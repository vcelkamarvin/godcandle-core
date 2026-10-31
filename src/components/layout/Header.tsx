import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ConnectModal } from '@/components/wallet/ConnectModal';
import { Trophy, Activity, ShieldCheck, Sparkles, Plus } from 'lucide-react';
import { useTrading } from '@/components/godcandle/TradingProvider';
import { fmtUsd } from '@/lib/engine';
import { TransferDialog } from '@/components/godcandle/TransferDialog';
import { Button } from '@/components/ui/button';

const NAV_LINKS = [
  { href: '/', label: 'Trade' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/analytics', label: 'Analysis' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/cup', label: 'Candle Cup' },
  { href: '/staking', label: 'Staking' },
  { href: '/docs', label: 'Docs' },
];

export function Header() {
  const t = useTrading();
  const [transfer, setTransfer] = useState<'Deposit' | 'Withdraw' | null>(null);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-white/90 backdrop-blur-md">
        {/* Signature Light Rainbow Iridescent Thin Bar */}
        <div className="h-[2px] w-full rainbow-bar" />

        {/* Top Micro-Ticker */}
        <div className="flex items-center justify-between overflow-x-auto border-b border-border bg-[#F6F6F4]/90 px-4 py-1 font-mono text-[11px] text-muted-foreground sm:px-6">
          <div className="flex shrink-0 items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium text-[#06964A]">
              <span className="size-1.5 rounded-full bg-[#00D964] animate-pulse" />
              HyperEVM (999) Active
            </span>
            <span className="hidden text-border sm:inline">|</span>
            <span className="hidden items-center gap-1.5 text-foreground sm:flex">
              <Trophy className="size-3 text-[#FFD60A]" />
              <span className="font-semibold">Candle Cup W12:</span>
              <span className="font-mono">#1 0x9c97…4fa2</span>
              <span className="rounded bg-[#E3F8EC] px-1.5 py-0.2 text-[10px] font-bold text-[#06964A]">+482.5% ROI</span>
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-4 pl-4 text-[10px]">
            <span className="font-mono text-muted-foreground">L1Read: 0x0806 / 0x080e</span>
            <span className="flex items-center gap-1 font-medium text-[#06964A]">
              <ShieldCheck className="size-3" />
              House Pool: 100% Solvent
            </span>
          </div>
        </div>

        {/* Main Navbar */}
        <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
          {/* Logo with Rainbow iridescent accent */}
          <Link to="/" className="group flex shrink-0 items-center gap-2.5 font-sans" aria-label="godcandle home">
            <span className="text-[23px] font-normal tracking-tight text-foreground group-hover:opacity-85 transition-opacity">
              godcandle
            </span>
            <span className="hidden rounded-full border border-border bg-gradient-to-r from-[#CDC3F0]/40 via-[#FFDAC8]/40 to-[#A0D4CA]/40 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-foreground sm:inline-flex items-center gap-1">
              <Sparkles className="size-2.5 text-[#0A0A0A]/70" />
              v3 Light
            </span>
          </Link>

          {/* Nav Links */}
          <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-1 overflow-x-auto py-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                to={link.href as any}
                activeOptions={{ exact: link.href === '/' }}
                activeProps={{
                  className: 'pill pill-ink h-8 px-3.5 text-xs font-medium shadow-sm',
                }}
                inactiveProps={{
                  className: 'pill h-8 px-3.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary',
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Action Cluster */}
          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="data-label">Available balance</p>
              <p className="tabular text-xs font-semibold text-foreground">${fmtUsd(t.available)}</p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setTransfer('Deposit')}
              className="pill pill-ink h-8 px-3 text-xs gap-1 border-0"
            >
              <Plus className="size-3" />
              Deposit
            </Button>

            <ConnectModal />
          </div>
        </div>

        {/* Mobile Nav Sub-row */}
        <div className="flex lg:hidden items-center gap-1 overflow-x-auto border-t border-border px-3 py-1.5 bg-[#F6F6F4]/50">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              to={link.href as any}
              activeOptions={{ exact: link.href === '/' }}
              activeProps={{
                className: 'pill pill-ink h-7 px-2.5 text-[11px] font-medium shrink-0',
              }}
              inactiveProps={{
                className: 'pill h-7 px-2.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary shrink-0',
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </header>

      {transfer && <TransferDialog mode={transfer} onClose={() => setTransfer(null)} />}
    </>
  );
}
