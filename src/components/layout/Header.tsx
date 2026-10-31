import React, { useState, useRef, useEffect } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { ConnectModal } from '@/components/wallet/ConnectModal';
import { Sparkles, Plus, ChevronDown, BarChart2, Coins, Trophy, BookOpen } from 'lucide-react';
import { useTrading } from '@/components/godcandle/TradingProvider';
import { fmtUsd } from '@/lib/engine';
import { TransferDialog } from '@/components/godcandle/TransferDialog';
import { Button } from '@/components/ui/button';
import { useAccount, useBalance } from 'wagmi';

export function Header() {
  const t = useTrading();
  const { address: wagmiAddress } = useAccount();
  const localAddr = typeof window !== 'undefined' ? localStorage.getItem('godcandle_wallet_address') : null;
  const activeAddr = wagmiAddress || localAddr;
  const { data: hypeBalance } = useBalance({
    address: activeAddr as `0x${string}` | undefined,
    chainId: 999,
  });
  const [transfer, setTransfer] = useState<'Deposit' | 'Withdraw' | null>(null);
  const [candleOpen, setCandleOpen] = useState(false);
  const candleRef = useRef<HTMLDivElement>(null);

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isCandleActive =
    pathname.startsWith('/candle') || pathname.startsWith('/staking');

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (candleRef.current && !candleRef.current.contains(e.target as Node)) {
        setCandleOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur-md">
        {/* Signature Light Rainbow Iridescent Thin Bar */}
        <div className="h-[2px] w-full rainbow-bar" />

        {/* Main Navbar */}
        <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
          {/* Left Cluster: Logo & Primary Left Navigation */}
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="group flex shrink-0 items-center gap-2 font-sans"
              aria-label="godcandle home"
            >
              <span className="text-[22px] font-normal tracking-tight text-foreground group-hover:opacity-85 transition-opacity">
                godcandle
              </span>
              <span className="hidden rounded-full border border-border bg-gradient-to-r from-[#CDC3F0]/40 via-[#FFDAC8]/40 to-[#A0D4CA]/40 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-foreground sm:inline-flex items-center gap-1">
                <Sparkles className="size-2.5 text-[#0A0A0A]/70" />
                v3 Light
              </span>
            </Link>

            {/* Left Nav: Products [Perps | 1000x], Analysis, Leaderboard */}
            <nav aria-label="Main navigation" className="hidden md:flex items-center gap-2">
              {/* Product Switch Segment: Perps | 1000x */}
              <div className="flex items-center p-0.5 rounded-full bg-secondary border border-border/80 shadow-2xs">
                <Link
                  to="/"
                  activeOptions={{ exact: true }}
                  activeProps={{
                    className: 'pill pill-ink h-8 px-3.5 text-xs font-semibold shadow-xs',
                  }}
                  inactiveProps={{
                    className:
                      'pill h-8 px-3.5 text-xs text-muted-foreground hover:text-foreground hover:bg-white/60 transition-colors',
                  }}
                >
                  Perps
                </Link>
                <Link
                  to="/trade"
                  activeProps={{
                    className: 'pill pill-ink h-8 px-3.5 text-xs font-semibold shadow-xs',
                  }}
                  inactiveProps={{
                    className:
                      'pill h-8 px-3.5 text-xs text-muted-foreground hover:text-foreground hover:bg-white/60 transition-colors',
                  }}
                >
                  <span className="flex items-center gap-1.5">
                    <span>1000x</span>
                    <span className="rounded bg-[#FFECEA] px-1.5 py-0.2 text-[9px] font-bold text-[#FF3B30]">
                      MAX
                    </span>
                  </span>
                </Link>
              </div>

              <Link
                to="/analytics"
                activeProps={{
                  className: 'pill pill-ink h-8 px-3.5 text-xs font-medium shadow-xs',
                }}
                inactiveProps={{
                  className:
                    'pill h-8 px-3.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary',
                }}
              >
                Analysis
              </Link>
              <Link
                to="/leaderboard"
                activeProps={{
                  className: 'pill pill-ink h-8 px-3.5 text-xs font-medium shadow-xs',
                }}
                inactiveProps={{
                  className:
                    'pill h-8 px-3.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary',
                }}
              >
                Leaderboard
              </Link>
            </nav>
          </div>

          {/* Right Cluster: Portfolio, CANDLE Dropdown, Balance, Deposit, Connect Wallet */}
          <div className="flex shrink-0 items-center gap-2.5 sm:gap-3">
            {/* Portfolio Link */}
            <Link
              to="/portfolio"
              className="hidden md:inline-flex"
              activeProps={{
                className: 'pill pill-ink h-8 px-3.5 text-xs font-medium shadow-xs',
              }}
              inactiveProps={{
                className:
                  'pill h-8 px-3.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary',
              }}
            >
              Portfolio
            </Link>

            {/* CANDLE Dropdown Menu (Strictly Platform Analysis & Staking) */}
            <div className="relative hidden md:block" ref={candleRef}>
              <button
                type="button"
                onClick={() => setCandleOpen((v) => !v)}
                className={`pill h-8 px-3 text-xs font-semibold gap-1.5 transition-all cursor-pointer ${
                  isCandleActive
                    ? 'pill-ink shadow-xs'
                    : 'bg-secondary/70 hover:bg-secondary text-foreground border border-border/80'
                }`}
                aria-expanded={candleOpen}
                aria-haspopup="menu"
              >
                <span className="bg-gradient-to-r from-[#8B5CF6] to-[#00D964] bg-clip-text text-transparent font-bold">
                  CANDLE
                </span>
                <ChevronDown
                  className={`size-3 text-muted-foreground transition-transform duration-200 ${
                    candleOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {candleOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-border bg-white p-1.5 shadow-xl animate-in zoom-in-95 fade-in-0 duration-150 z-50"
                >
                  <Link
                    to="/candle"
                    role="menuitem"
                    onClick={() => setCandleOpen(false)}
                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-secondary transition-colors text-left"
                  >
                    <div className="flex size-7 items-center justify-center rounded-lg bg-secondary text-foreground">
                      <BarChart2 className="size-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Platform Analysis</p>
                      <p className="text-[10px] text-muted-foreground">Protocol supply &amp; activity</p>
                    </div>
                  </Link>

                  <Link
                    to="/staking"
                    role="menuitem"
                    onClick={() => setCandleOpen(false)}
                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-secondary transition-colors text-left"
                  >
                    <div className="flex size-7 items-center justify-center rounded-lg bg-[#E3F8EC] text-[#06964A]">
                      <Coins className="size-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Staking</p>
                      <p className="text-[10px] text-muted-foreground">USDC revenue distributions</p>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* Available Balance */}
            <div className="hidden lg:block text-right pr-1">
              <p className="data-label text-[9px] flex items-center justify-end gap-1">
                <span>Available</span>
                {hypeBalance && (
                  <span className="font-mono text-muted-foreground font-normal">
                    · {parseFloat(hypeBalance.formatted).toFixed(2)} HYPE
                  </span>
                )}
              </p>
              <p className="tabular text-xs font-semibold text-foreground">
                ${fmtUsd(t.available)}
              </p>
            </div>

            {/* Deposit Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTransfer('Deposit')}
              className="pill pill-ink h-8 px-3 text-xs gap-1 border-0 cursor-pointer shadow-xs"
            >
              <Plus className="size-3" />
              Deposit
            </Button>

            {/* Connect Wallet Modal */}
            <ConnectModal />
          </div>
        </div>

        {/* Mobile Nav Sub-row */}
        <div className="flex md:hidden items-center gap-1 overflow-x-auto border-t border-border px-3 py-1.5 bg-[#F6F6F4]/60 no-scrollbar">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            activeProps={{
              className: 'pill pill-ink h-7 px-2.5 text-[11px] font-semibold shrink-0',
            }}
            inactiveProps={{
              className:
                'pill h-7 px-2.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary shrink-0',
            }}
          >
            Perps
          </Link>
          <Link
            to="/trade"
            activeProps={{
              className: 'pill pill-ink h-7 px-2.5 text-[11px] font-semibold shrink-0',
            }}
            inactiveProps={{
              className:
                'pill h-7 px-2.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary shrink-0',
            }}
          >
            1000x
          </Link>
          <Link
            to="/analytics"
            activeProps={{
              className: 'pill pill-ink h-7 px-2.5 text-[11px] font-medium shrink-0',
            }}
            inactiveProps={{
              className:
                'pill h-7 px-2.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary shrink-0',
            }}
          >
            Analysis
          </Link>
          <Link
            to="/leaderboard"
            activeProps={{
              className: 'pill pill-ink h-7 px-2.5 text-[11px] font-medium shrink-0',
            }}
            inactiveProps={{
              className:
                'pill h-7 px-2.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary shrink-0',
            }}
          >
            Leaderboard
          </Link>
          <Link
            to="/portfolio"
            activeProps={{
              className: 'pill pill-ink h-7 px-2.5 text-[11px] font-medium shrink-0',
            }}
            inactiveProps={{
              className:
                'pill h-7 px-2.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary shrink-0',
            }}
          >
            Portfolio
          </Link>
          <Link
            to="/candle"
            activeProps={{
              className: 'pill pill-ink h-7 px-2.5 text-[11px] font-medium shrink-0',
            }}
            inactiveProps={{
              className:
                'pill h-7 px-2.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary shrink-0',
            }}
          >
            CANDLE
          </Link>
          <Link
            to="/staking"
            activeProps={{
              className: 'pill pill-ink h-7 px-2.5 text-[11px] font-medium shrink-0',
            }}
            inactiveProps={{
              className:
                'pill h-7 px-2.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary shrink-0',
            }}
          >
            Staking
          </Link>
        </div>
      </header>

      {transfer && <TransferDialog mode={transfer} onClose={() => setTransfer(null)} />}
    </>
  );
}
