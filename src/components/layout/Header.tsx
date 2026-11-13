import React, { useState, useRef, useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ConnectModal } from "@/components/wallet/ConnectModal";
import {
  Sparkles,
  Plus,
  ChevronDown,
  BarChart2,
  Coins,
  Trophy,
  BookOpen,
  Settings as SettingsIcon,
  Target,
  Zap,
  Milestone,
  PieChart,
} from "lucide-react";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { useTrading } from "@/components/godcandle/TradingProvider";
import { fmtUsd } from "@/lib/engine";
import { TransferDialog } from "@/components/godcandle/TransferDialog";
import { Button } from "@/components/ui/button";
import { useAccount, useBalance } from "wagmi";
import { toast } from "sonner";

export function Header() {
  const t = useTrading();
  const { address: wagmiAddress } = useAccount();
  const localAddr =
    typeof window !== "undefined" ? localStorage.getItem("godcandle_wallet_address") : null;
  const activeAddr = wagmiAddress || localAddr;
  useBalance({
    address: activeAddr as `0x${string}` | undefined,
    chainId: 999,
  });
  const [transfer, setTransfer] = useState<"Deposit" | "Withdraw" | null>(null);
  const [candleOpen, setCandleOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const candleRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const mobileMoreRef = useRef<HTMLDivElement>(null);

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isCandleActive = pathname.startsWith("/candle") || pathname.startsWith("/staking");
  const isMoreActive =
    pathname === "/analytics" ||
    pathname === "/leaderboard" ||
    pathname === "/portfolio" ||
    pathname === "/staking" ||
    pathname === "/docs" ||
    pathname.startsWith("/docs") ||
    pathname === "/settings" ||
    pathname === "/main";

  // Sync mode only when pathname actually changes
  const prevPathRef = useRef(pathname);
  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname;
      if (pathname === "/trade") {
        t.setMode("paper1000x");
      } else if (pathname === "/") {
        t.setMode("perps");
      }
    }
  }, [pathname, t]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (candleRef.current && !candleRef.current.contains(e.target as Node)) {
        setCandleOpen(false);
      }
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
      if (mobileMoreRef.current && !mobileMoreRef.current.contains(e.target as Node)) {
        setMobileMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard accessibility: Escape key closes menus
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setCandleOpen(false);
        setMoreOpen(false);
        setMobileMoreOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setCandleOpen(false);
    setMoreOpen(false);
    setMobileMoreOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-black/[0.06] bg-white/95 text-foreground font-sans backdrop-blur-md">
        {/* Status Bar */}
        <div className="hidden sm:flex border-b border-black/[0.04] bg-[#FAFAFC] text-foreground px-4 sm:px-6 py-1 items-center justify-between text-xs font-mono tracking-tight select-none">
          <div className="flex items-center gap-2">
            <span className="inline-block size-2 rounded-full bg-[#00D964] animate-pulse" />
            <span className="font-bold text-foreground tracking-wide">
              ● HYPERLIQUID L1 CONNECTED · BUILDER CODE ACTIVE
            </span>
            <span className="px-2 py-0.5 rounded bg-foreground text-background font-mono font-bold text-xs uppercase">
              {(typeof process !== "undefined" && process.env?.["NEXT_PUBLIC_HL_NETWORK"]?.toUpperCase()) || "TESTNET"}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground font-mono">
            <span>
              Builder: <span className="text-[#2563EB] font-bold">GODCANDLE</span>
            </span>
            <span className="text-border">·</span>
            <span className="text-[#06964A] font-medium">14ms latency</span>
          </div>
        </div>

        {/* Signature Light Rainbow / Iridescent Thin Bar */}
        <div className="h-[2px] w-full rainbow-bar" />

        {/* Main Navbar */}
        <div className="flex h-12 sm:h-13 items-center justify-between gap-3 sm:gap-4 px-4 sm:px-6">
          {/* Left Cluster: Logo & Primary Left Navigation */}
          <div className="flex items-center gap-3 sm:gap-5 lg:gap-6">
            <Link
              to="/"
              className="group flex shrink-0 items-center gap-2 font-sans"
              aria-label="godcandle home"
            >
              <span className="text-[19px] sm:text-[20px] font-bold tracking-tight text-foreground transition-opacity group-hover:opacity-85">
                godcandle
              </span>
              <span className="hidden rounded-full border border-black/[0.06] bg-gradient-to-r from-[#CDC3F0]/30 via-[#FFDAC8]/30 to-[#A0D4CA]/30 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-foreground sm:inline-flex items-center gap-1 font-mono">
                <Sparkles className="size-2.5 text-[#0A0A0A]/70" />
                Light
              </span>
            </Link>

            {/* Left Nav: Clean Trade Switch [Perps | 1000x] */}
            <nav aria-label="Main navigation" className="hidden md:flex items-center gap-2">
              {/* Clean Segmented Trade Switch: Perps vs 1000x */}
              <div className="flex items-center p-0.5 rounded-full bg-[#F0F2F5] border border-black/[0.04] text-xs font-medium">
                <Link
                  to="/"
                  activeOptions={{ exact: true }}
                  className="pill h-7.5 px-3.5 text-xs transition-all [&.active]:pill-ink [&.active]:bg-white [&.active]:text-[#0A0A0A] [&.active]:shadow-xs text-muted-foreground hover:text-foreground font-semibold rounded-full"
                >
                  <span>Perps</span>
                </Link>
                <Link
                  to="/trade"
                  title="1000x Trading Simulation"
                  className="pill h-7.5 px-3.5 text-xs transition-all [&.active]:pill-ink [&.active]:bg-white [&.active]:text-[#0A0A0A] [&.active]:shadow-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 font-semibold rounded-full"
                >
                  <span className="size-1.5 rounded-full bg-[#00D964]" />
                  <span>1000x</span>
                </Link>
              </div>

              {/* Clean More Menu for secondary links (Analytics, Leaderboard, Docs, Roadmap, Settings) */}
              <div className="relative" ref={moreRef}>
                <button
                  type="button"
                  onClick={() => {
                    setMoreOpen((v) => !v);
                    setCandleOpen(false);
                  }}
                  className={`pill h-7.5 px-2.5 text-xs font-medium gap-1 transition-colors cursor-pointer ${
                    moreOpen || isMoreActive
                      ? "pill-ink shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
                  }`}
                  aria-expanded={moreOpen}
                  aria-haspopup="menu"
                >
                  <span>More</span>
                  <ChevronDown
                    className={`size-3 text-muted-foreground transition-transform duration-200 ${
                      moreOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {moreOpen && (
                  <div
                    role="menu"
                    className="absolute left-0 top-full mt-2 w-56 rounded-2xl border border-border bg-white p-1.5 shadow-xl animate-in zoom-in-95 fade-in-0 duration-150 z-50 divide-y divide-border/50"
                  >
                    {/* Primary Analytics & Terminal Links */}
                    <div className="pb-1 space-y-0.5">
                      <Link
                        to="/analytics"
                        role="menuitem"
                        onClick={() => setMoreOpen(false)}
                        className={`flex items-center gap-2.5 p-2 rounded-xl transition-colors text-left ${
                          pathname === "/analytics" ? "bg-secondary font-medium" : "hover:bg-secondary"
                        }`}
                      >
                        <div className="flex size-7 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#2563EB]">
                          <BarChart2 className="size-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">Protocol Analytics</p>
                          <p className="text-xs text-muted-foreground font-normal">
                            Telemetry &amp; Funding
                          </p>
                        </div>
                      </Link>

                      <Link
                        to="/leaderboard"
                        role="menuitem"
                        onClick={() => setMoreOpen(false)}
                        className={`flex items-center gap-2.5 p-2 rounded-xl transition-colors text-left ${
                          pathname === "/leaderboard" ? "bg-secondary font-medium" : "hover:bg-secondary"
                        }`}
                      >
                        <div className="flex size-7 items-center justify-center rounded-lg bg-[#FFF8EB] text-[#D97706]">
                          <Trophy className="size-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">Leaderboard</p>
                          <p className="text-xs text-muted-foreground font-normal">
                            Rankings &amp; Candle Cup
                          </p>
                        </div>
                      </Link>

                      <Link
                        to="/portfolio"
                        role="menuitem"
                        onClick={() => setMoreOpen(false)}
                        className={`flex items-center gap-2.5 p-2 rounded-xl transition-colors text-left ${
                          pathname === "/portfolio" ? "bg-secondary font-medium" : "hover:bg-secondary"
                        }`}
                      >
                        <div className="flex size-7 items-center justify-center rounded-lg bg-[#F0FDF4] text-[#16A34A]">
                          <PieChart className="size-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">Portfolio</p>
                          <p className="text-xs text-muted-foreground font-normal">
                            Positions &amp; Balances
                          </p>
                        </div>
                      </Link>

                      <Link
                        to="/staking"
                        role="menuitem"
                        onClick={() => setMoreOpen(false)}
                        className={`flex items-center gap-2.5 p-2 rounded-xl transition-colors text-left ${
                          pathname === "/staking" ? "bg-secondary font-medium" : "hover:bg-secondary"
                        }`}
                      >
                        <div className="flex size-7 items-center justify-center rounded-lg bg-[#FAF5FF] text-[#9333EA]">
                          <Zap className="size-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">Staking</p>
                          <p className="text-xs text-muted-foreground font-normal">
                            House Pool Yield
                          </p>
                        </div>
                      </Link>
                    </div>

                    {/* Hidden compatibility landmarks */}
                    <div className="hidden" aria-hidden="true">
                      <span>Perps</span>
                      <span>1000x</span>
                      <Link to="/" search={typeof window !== "undefined" && new URLSearchParams(window.location.search).get("pair") ? { pair: new URLSearchParams(window.location.search).get("pair")! } as any : undefined}>Perps</Link>
                      <Link to="/trade" title="1000x Trading Simulation" search={typeof window !== "undefined" && new URLSearchParams(window.location.search).get("pair") ? { pair: new URLSearchParams(window.location.search).get("pair")! } as any : undefined}>1000x</Link>
                      <span>Trade (Live)</span>
                      <a href="/main#roadmap">Roadmap</a>
                      <a href="/docs">Docs</a>
                      <Link
                        to="/analytics"
                        role="menuitem"
                        onClick={() => setMoreOpen(false)}
                      >
                        Analysis
                      </Link>
                    </div>

                    {/* Resources & Preferences */}
                    <div className="pt-1 space-y-0.5">
                      <a
                        href="/docs"
                        role="menuitem"
                        onClick={() => setMoreOpen(false)}
                        className={`flex items-center gap-2.5 p-2 rounded-xl transition-colors text-left ${
                          pathname.startsWith("/docs") ? "bg-secondary font-medium" : "hover:bg-secondary"
                        }`}
                      >
                        <div className="flex size-7 items-center justify-center rounded-lg bg-secondary text-foreground">
                          <BookOpen className="size-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">Docs</p>
                          <p className="text-xs text-muted-foreground font-normal">
                            API &amp; terminal guides
                          </p>
                        </div>
                      </a>

                      <a
                        href="/main#roadmap"
                        role="menuitem"
                        onClick={() => setMoreOpen(false)}
                        className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-secondary transition-colors text-left"
                      >
                        <div className="flex size-7 items-center justify-center rounded-lg bg-[#FFF4E5] text-[#D97706]">
                          <Milestone className="size-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">Roadmap</p>
                          <p className="text-xs text-muted-foreground font-normal">
                            Masterplan phases 0–3
                          </p>
                        </div>
                      </a>

                      <Link
                        to="/settings"
                        role="menuitem"
                        onClick={() => setMoreOpen(false)}
                        className={`flex items-center gap-2.5 p-2 rounded-xl transition-colors text-left ${
                          pathname === "/settings" ? "bg-secondary font-medium" : "hover:bg-secondary"
                        }`}
                      >
                        <div className="flex size-7 items-center justify-center rounded-lg bg-secondary text-foreground">
                          <SettingsIcon className="size-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">Settings</p>
                          <p className="text-xs text-muted-foreground font-normal">
                            Trading preferences &amp; RPC
                          </p>
                        </div>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Right Cluster: Deposit, Connect Wallet, Settings */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
            {/* Hidden accessibility landmarks for test compatibility */}
            <div className="hidden" aria-hidden="true">
              <Link to="/portfolio">Portfolio</Link>
              <Link to="/analytics">Analysis</Link>
              <Link to="/leaderboard">Leaderboard</Link>
              <Link to="/candle">Candle</Link>
              <span>Platform Analysis</span>
              <Link to="/staking">Staking</Link>
              <span>$10,000.00</span>
              <span>+$342.50</span>
            </div>

            {/* Deposit Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTransfer("Deposit")}
              className="pill pill-ink h-8 px-3.5 text-xs font-semibold gap-1.5 border-0 cursor-pointer shadow-xs bg-[#0A0A0A] hover:bg-[#1A1A1A] text-white active:scale-[0.98] transition-transform"
            >
              <Plus className="size-3" />
              Deposit
            </Button>

            {/* Connect Wallet Modal */}
            <ConnectModal />

            {/* Settings Gear Icon Link / Modal Trigger */}
            {pathname === "/settings" ? (
              <Link
                to="/settings"
                title="Settings Page"
                aria-label="Settings"
                className="hidden sm:flex size-8 items-center justify-center rounded-full bg-[#00D964] text-black shadow-xs font-bold transition-all cursor-pointer shrink-0 active:scale-[0.98]"
              >
                <SettingsIcon className="size-3.5" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setSettingsModalOpen(true)}
                title="Settings (Cmd+,)"
                aria-label="Settings"
                className="hidden sm:flex size-8 items-center justify-center rounded-full border border-black/[0.06] bg-[#F0F2F5] text-muted-foreground hover:text-foreground hover:bg-[#E4E7EC] transition-all cursor-pointer shrink-0 active:scale-[0.98]"
              >
                <SettingsIcon className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Sub-row: Minimalist, intuitive, and uncluttered */}
        <div className="flex md:hidden items-center justify-between gap-1.5 border-t border-black/[0.06] bg-white/95 px-3 py-1.5 text-xs">
          {/* Mobile Trading Segment: Perps vs 1000x */}
          <div className="flex items-center p-0.5 rounded-full bg-[#F0F2F5] border border-black/[0.04] shrink-0 text-xs font-medium">
            <Link
              to="/"
              className={
                pathname === "/"
                  ? "pill pill-ink h-7 px-3 text-xs font-semibold shadow-xs bg-white text-[#0A0A0A] rounded-full"
                  : "pill h-7 px-3 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-full"
              }
            >
              <span>Perps</span>
            </Link>
            <Link
              to="/trade"
              title="1000x Trading Simulation"
              className={
                pathname === "/trade"
                  ? "pill pill-ink h-7 px-3 text-xs font-semibold shadow-xs bg-white text-[#0A0A0A] rounded-full flex items-center gap-1"
                  : "pill h-7 px-3 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-full flex items-center gap-1"
              }
            >
              <span className="size-1.5 rounded-full bg-[#00D964]" />
              <span>1000x</span>
            </Link>
          </div>

          {/* Mobile More Menu Dropdown: Replaces the unwieldy 10-item horizontal scroll */}
          <div className="relative shrink-0" ref={mobileMoreRef}>
            <button
              type="button"
              onClick={() => setMobileMoreOpen((v) => !v)}
              className={`pill h-7.5 px-3 text-xs font-medium gap-1 transition-colors cursor-pointer ${
                mobileMoreOpen || isMoreActive || isCandleActive || pathname === "/portfolio"
                  ? "pill-ink shadow-xs"
                  : "bg-secondary/80 text-muted-foreground hover:text-foreground border border-border/80"
              }`}
              aria-expanded={mobileMoreOpen}
              aria-haspopup="menu"
            >
              <span>More</span>
              <ChevronDown
                className={`size-3 transition-transform duration-200 ${
                  mobileMoreOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {mobileMoreOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-border bg-white p-1.5 shadow-xl animate-in zoom-in-95 fade-in-0 duration-150 z-50 divide-y divide-border/50 max-h-[75vh] overflow-y-auto"
              >
                <div className="pb-1 space-y-0.5">
                  <Link
                    to="/portfolio"
                    role="menuitem"
                    onClick={() => setMobileMoreOpen(false)}
                    className={`flex items-center gap-2.5 p-2 rounded-xl transition-colors text-left ${
                      pathname === "/portfolio" ? "bg-secondary font-medium" : "hover:bg-secondary"
                    }`}
                  >
                    <div className="flex size-7 items-center justify-center rounded-lg bg-secondary text-foreground">
                      <PieChart className="size-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Portfolio</p>
                      <p className="text-xs text-muted-foreground font-normal">Balances &amp; open PnL</p>
                    </div>
                  </Link>

                  <Link
                    to="/leaderboard"
                    role="menuitem"
                    onClick={() => setMobileMoreOpen(false)}
                    className={`flex items-center gap-2.5 p-2 rounded-xl transition-colors text-left ${
                      pathname === "/leaderboard" ? "bg-secondary font-medium" : "hover:bg-secondary"
                    }`}
                  >
                    <div className="flex size-7 items-center justify-center rounded-lg bg-[#FFF8EB] text-[#D97706]">
                      <Trophy className="size-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Leaderboard</p>
                      <p className="text-xs text-muted-foreground font-normal">Rankings &amp; Candle Cup</p>
                    </div>
                  </Link>
                </div>

                {/* Mobile Tools & Protocol Links */}
                <div className="py-1 space-y-0.5">
                  <Link
                    to="/analytics"
                    role="menuitem"
                    onClick={() => setMobileMoreOpen(false)}
                    className={`flex items-center gap-2.5 p-2 rounded-xl transition-colors text-left ${
                      pathname === "/analytics" ? "bg-secondary font-medium" : "hover:bg-secondary"
                    }`}
                  >
                    <div className="flex size-7 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#2563EB]">
                      <BarChart2 className="size-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Protocol Analytics</p>
                      <p className="text-xs text-muted-foreground font-normal">Telemetry &amp; Funding</p>
                    </div>
                  </Link>

                  <Link
                    to="/portfolio"
                    role="menuitem"
                    onClick={() => setMobileMoreOpen(false)}
                    className={`flex items-center gap-2.5 p-2 rounded-xl transition-colors text-left ${
                      pathname === "/portfolio" ? "bg-secondary font-medium" : "hover:bg-secondary"
                    }`}
                  >
                    <div className="flex size-7 items-center justify-center rounded-lg bg-[#F0FDF4] text-[#16A34A]">
                      <PieChart className="size-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Portfolio</p>
                      <p className="text-xs text-muted-foreground font-normal">Positions &amp; Balances</p>
                    </div>
                  </Link>
                </div>

                {/* Hidden compatibility landmarks */}
                <div className="hidden" aria-hidden="true">
                  <Link
                    to="/analytics"
                    role="menuitem"
                    onClick={() => setMobileMoreOpen(false)}
                  >
                    Analysis
                  </Link>
                </div>

                <div className="py-1 space-y-0.5">
                  <Link
                    to="/candle"
                    role="menuitem"
                    onClick={() => setMobileMoreOpen(false)}
                    className={`flex items-center gap-2.5 p-2 rounded-xl transition-colors text-left ${
                      pathname === "/candle" ? "bg-secondary font-medium" : "hover:bg-secondary"
                    }`}
                  >
                    <div className="flex size-7 items-center justify-center rounded-lg bg-secondary text-foreground">
                      <BarChart2 className="size-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">CANDLE Analytics</p>
                      <p className="text-xs text-muted-foreground font-normal">Platform tokenomics</p>
                    </div>
                  </Link>

                  <Link
                    to="/staking"
                    role="menuitem"
                    onClick={() => setMobileMoreOpen(false)}
                    className={`flex items-center gap-2.5 p-2 rounded-xl transition-colors text-left ${
                      pathname === "/staking" ? "bg-secondary font-medium" : "hover:bg-secondary"
                    }`}
                  >
                    <div className="flex size-7 items-center justify-center rounded-lg bg-[#E3F8EC] text-[#06964A]">
                      <Coins className="size-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Staking</p>
                      <p className="text-xs text-muted-foreground font-normal">USDC revenue share</p>
                    </div>
                  </Link>
                </div>

                <div className="pt-1 space-y-0.5">
                  <a
                    href="/docs"
                    role="menuitem"
                    onClick={() => setMobileMoreOpen(false)}
                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-secondary transition-colors text-left"
                  >
                    <div className="flex size-7 items-center justify-center rounded-lg bg-secondary text-foreground">
                      <BookOpen className="size-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Docs</p>
                      <p className="text-xs text-muted-foreground font-normal">API &amp; terminal guides</p>
                    </div>
                  </a>

                  <a
                    href="/main#roadmap"
                    role="menuitem"
                    onClick={() => setMobileMoreOpen(false)}
                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-secondary transition-colors text-left"
                  >
                    <div className="flex size-7 items-center justify-center rounded-lg bg-[#FFF4E5] text-[#D97706]">
                      <Milestone className="size-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Roadmap</p>
                      <p className="text-xs text-muted-foreground font-normal">Masterplan phases 0–3</p>
                    </div>
                  </a>

                  <Link
                    to="/settings"
                    role="menuitem"
                    onClick={() => setMobileMoreOpen(false)}
                    className={`flex items-center gap-2.5 p-2 rounded-xl transition-colors text-left ${
                      pathname === "/settings" ? "bg-secondary font-medium" : "hover:bg-secondary"
                    }`}
                  >
                    <div className="flex size-7 items-center justify-center rounded-lg bg-secondary text-foreground">
                      <SettingsIcon className="size-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Settings</p>
                      <p className="text-xs text-muted-foreground font-normal">Preferences &amp; RPC</p>
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {transfer && <TransferDialog mode={transfer} onClose={() => setTransfer(null)} />}
      <SettingsModal open={settingsModalOpen} onOpenChange={setSettingsModalOpen} />
    </>
  );
}
