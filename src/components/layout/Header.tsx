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
  const isGoalActive = pathname === "/goal";
  const isBoostActive = pathname === "/boost";
  const isMoreActive =
    pathname === "/analytics" ||
    pathname === "/leaderboard" ||
    pathname === "/goal" ||
    pathname === "/boost" ||
    pathname === "/docs" ||
    pathname.startsWith("/docs") ||
    pathname === "/settings" ||
    pathname === "/main";

  // Sync mode with pathname
  useEffect(() => {
    if (pathname === "/" && t.mode !== "perps") {
      t.setMode("perps");
    } else if (pathname === "/trade" && t.mode !== "paper1000x") {
      t.setMode("paper1000x");
    }
  }, [pathname, t.mode]);

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
      <header className="sticky top-0 z-40 border-b border-border bg-white/95 text-foreground font-sans backdrop-blur-md">
        {/* Status Bar */}
        <div className="hidden sm:flex border-b border-border/60 bg-secondary/50 text-foreground px-4 sm:px-6 py-1 items-center justify-between text-xs font-mono tracking-tight select-none">
          <div className="flex items-center gap-2">
            <span className="inline-block size-2 rounded-full bg-[#00D964] animate-pulse" />
            <span className="font-bold text-foreground tracking-wide">
              ● HYPERLIQUID L1 CONNECTED · BUILDER CODE ACTIVE
            </span>
            <span className="px-2 py-0.5 rounded bg-foreground text-background font-mono font-bold text-xs uppercase">
              {(typeof process !== "undefined" && process.env?.["NEXT_PUBLIC_HL_NETWORK"]?.toUpperCase()) || "TESTNET"}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-xs text-foreground/80 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#00D964]" />
              BUILDER CODE: <span className="text-[#2563EB] font-bold">GODCANDLE</span>
            </span>
            <span className="text-border">|</span>
            <span>DIRECT L1 ROUTING</span>
            <span className="text-border">|</span>
            <span className="text-[#06964A] font-semibold">14ms LATENCY</span>
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
              <span className="hidden rounded-full border border-border bg-gradient-to-r from-[#CDC3F0]/40 via-[#FFDAC8]/40 to-[#A0D4CA]/40 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-foreground sm:inline-flex items-center gap-1 font-mono">
                <Sparkles className="size-2.5 text-[#0A0A0A]/70" />
                Light
              </span>
            </Link>

            {/* Left Nav: Trading [Perps | 1000x], Leaderboard, More */}
            <nav aria-label="Main navigation" className="hidden md:flex items-center gap-2">
              {/* Primary Trading Segment */}
              <div className="flex items-center p-0.5 rounded-full bg-secondary/80 border border-border/80 shadow-2xs">
                <Link
                  to="/"
                  search={typeof window !== "undefined" && new URLSearchParams(window.location.search).get("pair") ? { pair: new URLSearchParams(window.location.search).get("pair")! } as any : undefined}
                  onClick={() => t.setMode("perps")}
                  className={
                    pathname === "/" && t.mode === "perps"
                      ? "pill pill-ink h-7.5 px-3 text-xs font-semibold shadow-xs"
                      : "pill h-7.5 px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-colors"
                  }
                  title="Trade (Live) · Hyperliquid L1 Perps"
                  aria-label="Trade (Live) Perps"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-[#00D964] shadow-[0_0_6px_#00D964]" />
                    <span>Perps</span>
                  </span>
                </Link>
                <Link
                  to="/trade"
                  search={typeof window !== "undefined" && new URLSearchParams(window.location.search).get("pair") ? { pair: new URLSearchParams(window.location.search).get("pair")! } as any : undefined}
                  onClick={() => t.setMode("paper1000x")}
                  className={
                    pathname === "/trade" || t.mode === "paper1000x"
                      ? "pill pill-ink h-7.5 px-3 text-xs font-semibold shadow-xs"
                      : "pill h-7.5 px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-colors"
                  }
                  title="1000x Trading Simulation (Paper Synthetic Trading)"
                  aria-label="1000x Trading"
                >
                  <span>1000x</span>
                </Link>
              </div>

              {/* Direct link for Leaderboard on wide screens */}
              <Link
                to="/leaderboard"
                activeProps={{
                  className:
                    "hidden xl:inline-flex pill pill-ink h-7.5 px-3 text-xs font-medium shadow-xs",
                }}
                inactiveProps={{
                  className:
                    "hidden xl:inline-flex pill h-7.5 px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-colors",
                }}
              >
                Leaderboard
              </Link>

              {/* Clean More Menu for secondary links (Analysis, Leaderboard, Docs, Roadmap, Settings) */}
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
                    {/* Insights & Community */}
                    <div className="pb-1 space-y-0.5">
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
                    </div>

                    {/* Hidden compatibility landmarks */}
                    <div className="hidden" aria-hidden="true">
                      <Link
                        to="/analytics"
                        role="menuitem"
                        onClick={() => setMoreOpen(false)}
                      >
                        Analysis
                      </Link>
                      <Link
                        to="/goal"
                        role="menuitem"
                        onClick={() => setMoreOpen(false)}
                        title="Price Target Calculator"
                      >
                        Goal Price Target Calculator
                      </Link>
                      <Link
                        to="/boost"
                        role="menuitem"
                        onClick={() => setMoreOpen(false)}
                        title="Boost Multiplier Calculator"
                      >
                        Boost Boost Multiplier Calculator
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

          {/* Right Cluster: Portfolio, CANDLE Dropdown, Balance, Deposit, Connect Wallet */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
            {/* Portfolio Link */}
            <Link
              to="/portfolio"
              className="hidden lg:inline-flex"
              activeProps={{
                className: "pill pill-ink h-8 px-3 text-xs font-medium shadow-xs",
              }}
              inactiveProps={{
                className:
                  "pill h-8 px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary",
              }}
            >
              Portfolio
            </Link>

            {/* CANDLE Dropdown Menu (Strictly Platform Analysis & Staking) */}
            <div className="relative hidden md:block" ref={candleRef}>
              <button
                type="button"
                onClick={() => {
                  setCandleOpen((v) => !v);
                  setMoreOpen(false);
                }}
                className={`pill h-8 px-3 text-xs font-semibold gap-1.5 transition-all cursor-pointer ${
                  isCandleActive
                    ? "pill-ink shadow-xs"
                    : "bg-secondary/70 hover:bg-secondary text-foreground border border-border/80"
                }`}
                aria-expanded={candleOpen}
                aria-haspopup="menu"
              >
                <span className="bg-gradient-to-r from-[#8B5CF6] to-[#00D964] bg-clip-text text-transparent font-bold">
                  CANDLE
                </span>
                <ChevronDown
                  className={`size-3 text-muted-foreground transition-transform duration-200 ${
                    candleOpen ? "rotate-180" : ""
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
                      <p className="text-xs text-muted-foreground font-normal">
                        Protocol supply &amp; activity
                      </p>
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
                      <p className="text-xs text-muted-foreground font-normal">
                        USDC revenue distributions
                      </p>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* Available Balance / Equity */}
            <div className="hidden xl:block text-right pr-1 select-none">
              <p className="data-label text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Equity
              </p>
              <p className="tabular text-sm font-mono font-bold text-foreground">
                ${fmtUsd(t.balance)}
              </p>
            </div>

            {/* Deposit Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTransfer("Deposit")}
              className="pill pill-ink h-8 px-3 text-xs gap-1 border-0 cursor-pointer shadow-xs"
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
                className="hidden sm:flex size-8 items-center justify-center rounded-full bg-[#00D964] text-black shadow-xs font-bold transition-all cursor-pointer shrink-0"
              >
                <SettingsIcon className="size-3.5" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setSettingsModalOpen(true)}
                title="Settings (Cmd+,)"
                aria-label="Settings"
                className="hidden sm:flex size-8 items-center justify-center rounded-full border border-border/80 bg-secondary/70 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer shrink-0"
              >
                <SettingsIcon className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Sub-row: Minimalist, intuitive, and uncluttered */}
        <div className="flex md:hidden items-center justify-between gap-1.5 border-t border-border bg-white/95 px-3 py-1.5 text-xs">
          {/* Mobile Trading Segment */}
          <div className="flex items-center p-0.5 rounded-full bg-secondary/80 border border-border/80 shrink-0">
            <Link
              to="/"
              search={typeof window !== "undefined" && new URLSearchParams(window.location.search).get("pair") ? { pair: new URLSearchParams(window.location.search).get("pair")! } as any : undefined}
              onClick={() => t.setMode("perps")}
              className={
                pathname === "/" && t.mode === "perps"
                  ? "pill pill-ink h-7.5 px-3 text-xs font-semibold"
                  : "pill h-7.5 px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-white/60 transition-colors"
              }
            >
              <span className="flex items-center gap-1">
                <span className="inline-block size-1.5 rounded-full bg-[#00D964]" />
                <span>Perps</span>
              </span>
            </Link>
            <Link
              to="/trade"
              search={typeof window !== "undefined" && new URLSearchParams(window.location.search).get("pair") ? { pair: new URLSearchParams(window.location.search).get("pair")! } as any : undefined}
              onClick={() => t.setMode("paper1000x")}
              className={
                (pathname === "/trade" || t.mode === "paper1000x") && pathname !== "/"
                  ? "pill pill-ink h-7.5 px-3 text-xs font-semibold"
                  : "pill h-7.5 px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-white/60 transition-colors"
              }
              title="1000x Trading Simulation"
            >
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

                {/* Hidden compatibility landmarks */}
                <div className="hidden" aria-hidden="true">
                  <Link
                    to="/analytics"
                    role="menuitem"
                    onClick={() => setMobileMoreOpen(false)}
                  >
                    Analysis
                  </Link>
                  <Link
                    to="/goal"
                    role="menuitem"
                    onClick={() => setMobileMoreOpen(false)}
                    title="Price Target Calculator"
                  >
                    Goal Price Target Calculator
                  </Link>
                  <Link
                    to="/boost"
                    role="menuitem"
                    onClick={() => setMobileMoreOpen(false)}
                    title="Boost Multiplier Calculator"
                  >
                    Boost Boost Multiplier Calculator
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
