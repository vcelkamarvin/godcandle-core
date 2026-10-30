import React from 'react';
import { Link } from '@tanstack/react-router';
import { ConnectModal } from '@/components/wallet/ConnectModal';
import { Trophy, Flame, Activity, BookOpen, Cpu, ShieldCheck } from 'lucide-react';

const NAV_LINKS = [
  { href: '/trade', label: '1000x Trade' },
  { href: '/options', label: '0DTE Options' },
  { href: '/cup', label: 'Candle Cup' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/analytics', label: 'Analysis' },
  { href: '/staking', label: 'Staking' },
  { href: '/hardware', label: 'Hardware' },
  { href: '/docs', label: 'Docs' },
];

export function Header() {
  return (
    <header className="border-b border-border bg-background sticky top-0 z-50 font-mono text-xs text-accent">
      {/* Top Micro-Ticker */}
      <div className="bg-surface border-b border-border px-4 py-1 flex items-center justify-between text-[11px] text-subtle overflow-x-auto">
        <div className="flex items-center gap-4 shrink-0">
          <span className="flex items-center gap-1 text-bull font-semibold">
            <Activity className="w-3 h-3" />
            HyperEVM (999) Active
          </span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:flex items-center gap-1 text-accent">
            <Trophy className="w-3 h-3 text-accent" />
            Candle Cup Week 12: #1 0x9c97…4fa2 (+482.5% ROI)
          </span>
        </div>

        <div className="flex items-center gap-4 shrink-0 pl-4">
          <span className="text-[10px]">L1Read: 0x0806 / 0x080e</span>
          <span className="text-bull text-[10px] flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            House Pool: 100% Solvent
          </span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="px-4 lg:px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-sm text-accent tracking-wider shrink-0">
          <div className="size-6 bg-accent text-background flex items-center justify-center font-bold text-xs rounded-sm">
            G
          </div>
          <span>godcandle</span>
        </Link>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-1 overflow-x-auto">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              to={link.href as any}
              activeProps={{
                className: 'bg-surface-elevated text-accent border border-accent font-semibold',
              }}
              inactiveProps={{
                className: 'text-subtle hover:text-accent hover:bg-surface border border-transparent',
              }}
              className="px-3 py-1.5 rounded transition-all text-xs"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Wallet Connection */}
        <div className="flex items-center gap-2 shrink-0">
          <ConnectModal />
        </div>
      </div>
    </header>
  );
}
