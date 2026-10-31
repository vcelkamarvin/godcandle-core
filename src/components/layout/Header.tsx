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
} from "lucide-react";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { useTrading } from "@/components/godcandle/TradingProvider";
import { fmtUsd } from "@/lib/engine";
import { TransferDialog } from "@/components/godcandle/TransferDialog";
import { Button } from "@/components/ui/button";
import { useAccount, useBalance } from "wagmi";
import { formatUnits } from "viem";
import { toast } from "sonner";

export function Header() {
  const t = useTrading();
  const { address: wagmiAddress } = useAccount();
  const localAddr =
    typeof window !== "undefined" ? localStorage.getItem("godcandle_wallet_address") : null;
  const activeAddr = wagmiAddress || localAddr;
  const { data: hypeBalance } = useBalance({
    address: activeAddr as `0x${string}` | undefined,
    chainId: 999,
  });
  const [transfer, setTransfer] = useState<"Deposit" | "Withdraw" | null>(null);
  const [candleOpen, setCandleOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const candleRef = useRef<HTMLDivElement>(null);

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isLanding = pathname === "/main" || pathname === "/settings";
  const isCandleActive = pathname.startsWith("/candle") || pathname.startsWith("/staking");
  const isGoalOrBoost = pathname === "/goal" || pathname === "/boost";

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
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-white/95 text-foreground font-sans backdrop-blur-md">
        {/* Status Bar */}
        <div className="border-b border-border/60 bg-secondary/50 text-muted-foreground px-4 sm:px-6 py-1 flex items-center justify-between text-[11px] font-mono tracking-tight select-none">
          <div className="flex items-center gap-2">
            <span className="inline-block size-1.5 rounded-full bg-[#00D964] animate-pulse" />
            <span className="font-semibold text-foreground tracking-wide">
              ● HYPERLIQUID L1 CONNECTED · BUILDER CODE ACTIVE
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-[#00D964]" />
              BUILDER CODE: <span className="text-[#2563EB] font-semibold">GODCANDLE</span>
            </span>
            <span className="text-border">|</span>
            <span>DIRECT L1 ROUTING</span>
            <span className="text-border">|</span>
            <span className="text-[#06964A] font-semibold">ZERO ADDED LATENCY</span>
          </div>
        </div>

        {/* Signature Light Rainbow / Iridescent Thin Bar */}
        <div className="h-[2px] w-full rainbow-bar" />

        {/* Main Navbar */}
        <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
          {/* Left Cluster: Logo & Primary Left Navigation */}
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className={`group flex shrink-0 items-center gap-2 ${isLanding ? "font-mono" : "font-sans"}`}
              aria-label="godcandle home"
            >
              <span
                className={`text-[22px] font-bold tracking-tight transition-colors ${isLanding ? "text-white group-hover:text-[#00D964]" : "text-foreground font-normal group-hover:opacity-85"}`}
              >
                godcandle
              </span>
              {isLanding ? (
                <span className="hidden rounded-full border border-[#30363D] bg-[#161B22] px-2 py-0.5 text-[9px] font-semibold text-[#58A6FF] sm:inline-flex items-center gap-1 font-mono">
                  <Sparkles className="size-2.5 text-[#00D964]" />
                  BUILDER CODE: GODCANDLE
                </span>
              ) : (
                <span className="hidden rounded-full border border-border bg-gradient-to-r from-[#CDC3F0]/40 via-[#FFDAC8]/40 to-[#A0D4CA]/40 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-foreground sm:inline-flex items-center gap-1">
                  <Sparkles className="size-2.5 text-[#0A0A0A]/70" />
                  v3 Light
                </span>
              )}
            </Link>

            {/* Left Nav: Products [Perps | 1000x], Trade (Live), Roadmap, Docs, Analysis, Leaderboard */}
            <nav aria-label="Main navigation" className="hidden md:flex items-center gap-2">
              {/* Product Switch Segment: Perps | 1000x */}
              <div className="flex items-center p-0.5 rounded-full bg-secondary border border-border/80 shadow-2xs">
                <Link
                  to="/"
                  onClick={() => t.setMode("perps")}
                  className={
                    t.mode === "perps"
                      ? "pill pill-ink h-8 px-3.5 text-xs font-semibold shadow-xs"
                      : "pill h-8 px-3.5 text-xs text-muted-foreground hover:text-foreground hover:bg-white/60 transition-colors"
                  }
                >
                  <span className="flex items-center gap-1.5">
                    <span>Perps</span>
                    <span className="rounded bg-[#E3F8EC] px-1.5 py-0.2 text-[8px] font-bold text-[#06964A]">
                      LIVE
                    </span>
                  </span>
                </Link>
                <Link
                  to="/trade"
                  onClick={() => t.setMode("paper1000x")}
                  className={
                    t.mode === "paper1000x"
                      ? "pill pill-ink h-8 px-3.5 text-xs font-semibold shadow-xs"
                      : "pill h-8 px-3.5 text-xs text-muted-foreground hover:text-foreground hover:bg-white/60 transition-colors"
                  }
                >
                  <span className="flex items-center gap-1.5">
                    <span>1000x</span>
                    <span className="rounded bg-[#FFECEA] px-1.5 py-0.2 text-[9px] font-bold text-[#FF3B30]">
                      MAX
                    </span>
                    <span className="rounded bg-[#FFF4E5] px-1.5 py-0.2 text-[8px] font-bold text-[#D97706]">
                      TEST · PAPER
                    </span>
                  </span>
                </Link>
              </div>

              {/* Trade (Live) Direct Link */}
              <Link
                to="/trade"
                activeProps={{
                  className: "pill pill-ink h-8 px-3 text-xs font-semibold shadow-xs",
                }}
                inactiveProps={{
                  className:
                    "pill h-8 px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors",
                }}
              >
                <span className="flex items-center gap-1.5">
                  <span>Trade (Live)</span>
                  <span className="size-1.5 rounded-full bg-[#00D964] animate-pulse" />
                </span>
              </Link>

              {/* Roadmap Anchor Link */}
              <a
                href="/main#roadmap"
                className="pill h-8 px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                Roadmap
              </a>

              {/* Docs Link */}
              <a
                href="/docs"
                className="pill h-8 px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                Docs
              </a>

              <Link
                to="/goal"
                className={
                  isGoalOrBoost
                    ? "pill pill-ink h-8 px-3.5 text-xs font-medium shadow-xs"
                    : "pill h-8 px-3.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                }
              >
                Goal &amp; Boost
              </Link>

              <Link
                to="/analytics"
                activeProps={{
                  className: "pill pill-ink h-8 px-3.5 text-xs font-medium shadow-xs",
                }}
                inactiveProps={{
                  className:
                    "pill h-8 px-3.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary",
                }}
              >
                Analysis
              </Link>
              <Link
                to="/leaderboard"
                activeProps={{
                  className: "pill pill-ink h-8 px-3.5 text-xs font-medium shadow-xs",
                }}
                inactiveProps={{
                  className:
                    "pill h-8 px-3.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary",
                }}
              >
                Leaderboard
              </Link>
              <Link
                to="/settings"
                activeProps={{
                  className: isLanding
                    ? "h-8 px-3 rounded-md bg-[#21262D] border border-[#30363D] text-xs font-semibold text-white shadow-xs inline-flex items-center gap-1.5"
                    : "pill pill-ink h-8 px-3.5 text-xs font-medium shadow-xs inline-flex items-center gap-1.5",
                }}
                inactiveProps={{
                  className: isLanding
                    ? "h-8 px-3 rounded-md text-xs text-[#8B949E] hover:text-white hover:bg-[#161B22] transition-colors inline-flex items-center gap-1.5"
                    : "pill h-8 px-3.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary inline-flex items-center gap-1.5",
                }}
              >
                <SettingsIcon className="size-3.5" />
                <span>Settings</span>
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
                className: "pill pill-ink h-8 px-3.5 text-xs font-medium shadow-xs",
              }}
              inactiveProps={{
                className:
                  "pill h-8 px-3.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary",
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
                      <p className="text-[10px] text-muted-foreground">
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
                      <p className="text-[10px] text-muted-foreground">
                        USDC revenue distributions
                      </p>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* Available Balance */}
            <div className="hidden lg:block text-right pr-1">
              <p className="data-label text-[9px] flex items-center justify-end gap-1">
                <span>{t.mode === "perps" ? "Real Withdrawable" : "Paper Available"}</span>
                {t.mode === "perps" && (
                  <span className="font-mono text-[#06964A] font-bold">· LIVE</span>
                )}
                {t.mode === "paper1000x" && (
                  <span className="font-mono text-[#D97706] font-bold">· 1000x</span>
                )}
              </p>
              <p className="tabular text-xs font-semibold text-foreground">
                ${fmtUsd(t.available)}
              </p>
            </div>

            {/* Deposit or Reset Button */}
            {t.mode === "paper1000x" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const res = await t.resetPaperBalance();
                  if (res.success) {
                    toast.success("Paper balance reset to $10,000.00 USDC");
                  } else {
                    toast.error(res.error || "Reset cooldown active");
                  }
                }}
                className="pill pill-ink h-8 px-3 text-xs gap-1 border-0 cursor-pointer shadow-xs"
              >
                Reset ($10k)
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTransfer("Deposit")}
                className="pill pill-ink h-8 px-3 text-xs gap-1 border-0 cursor-pointer shadow-xs"
              >
                <Plus className="size-3" />
                Deposit
              </Button>
            )}

            {/* Connect Wallet Modal */}
            <ConnectModal />

            {/* Settings Gear Icon Link / Modal Trigger */}
            {pathname === "/settings" ? (
              <Link
                to="/settings"
                title="Settings Page"
                aria-label="Settings"
                className="flex size-8 items-center justify-center rounded-full bg-[#00D964] text-black shadow-xs font-bold transition-all cursor-pointer shrink-0"
              >
                <SettingsIcon className="size-3.5" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setSettingsModalOpen(true)}
                title="Settings (Cmd+,)"
                aria-label="Settings"
                className={`flex size-8 items-center justify-center rounded-full transition-all cursor-pointer shrink-0 ${
                  isLanding
                    ? "border border-[#30363D] bg-[#161B22] text-[#8B949E] hover:text-white hover:bg-[#21262D]"
                    : "border border-border/80 bg-secondary/70 text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <SettingsIcon className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Nav Sub-row */}
        <div
          className={`flex md:hidden items-center gap-1 overflow-x-auto border-t px-3 py-1.5 no-scrollbar ${
            isLanding
              ? "border-[#21262D] bg-[#0D1117] text-xs font-mono"
              : "border-border bg-[#F6F6F4]/60"
          }`}
        >
          <Link
            to="/trade"
            className={
              isLanding
                ? "h-7 px-2.5 rounded-md bg-[#00D964]/10 border border-[#00D964]/30 text-[11px] font-bold text-[#00D964] flex items-center gap-1 shrink-0"
                : "pill pill-ink h-7 px-2.5 text-[11px] font-semibold shrink-0"
            }
          >
            <span>Trade (Live)</span>
            <span className="size-1 rounded-full bg-[#00D964] animate-pulse" />
          </Link>
          <a
            href="/main#roadmap"
            className={
              isLanding
                ? "h-7 px-2.5 rounded-md text-[11px] text-[#8B949E] hover:text-white hover:bg-[#161B22] flex items-center shrink-0"
                : "pill h-7 px-2.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary shrink-0"
            }
          >
            Roadmap
          </a>
          <a
            href="/docs"
            className={
              isLanding
                ? "h-7 px-2.5 rounded-md text-[11px] text-[#8B949E] hover:text-white hover:bg-[#161B22] flex items-center shrink-0"
                : "pill h-7 px-2.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary shrink-0"
            }
          >
            Docs
          </a>
          <Link
            to="/goal"
            className={
              isGoalOrBoost
                ? "pill pill-ink h-7 px-2.5 text-[11px] font-medium shrink-0"
                : "pill h-7 px-2.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary shrink-0"
            }
          >
            Goal &amp; Boost
          </Link>
          <Link
            to="/analytics"
            activeProps={{
              className: "pill pill-ink h-7 px-2.5 text-[11px] font-medium shrink-0",
            }}
            inactiveProps={{
              className:
                "pill h-7 px-2.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary shrink-0",
            }}
          >
            Analysis
          </Link>
          <Link
            to="/leaderboard"
            activeProps={{
              className: "pill pill-ink h-7 px-2.5 text-[11px] font-medium shrink-0",
            }}
            inactiveProps={{
              className:
                "pill h-7 px-2.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary shrink-0",
            }}
          >
            Leaderboard
          </Link>
          <Link
            to="/portfolio"
            activeProps={{
              className: "pill pill-ink h-7 px-2.5 text-[11px] font-medium shrink-0",
            }}
            inactiveProps={{
              className:
                "pill h-7 px-2.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary shrink-0",
            }}
          >
            Portfolio
          </Link>
          <Link
            to="/candle"
            activeProps={{
              className: "pill pill-ink h-7 px-2.5 text-[11px] font-medium shrink-0",
            }}
            inactiveProps={{
              className:
                "pill h-7 px-2.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary shrink-0",
            }}
          >
            CANDLE
          </Link>
          <Link
            to="/staking"
            activeProps={{
              className: "pill pill-ink h-7 px-2.5 text-[11px] font-medium shrink-0",
            }}
            inactiveProps={{
              className:
                "pill h-7 px-2.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary shrink-0",
            }}
          >
            Staking
          </Link>
          <Link
            to="/settings"
            activeProps={{
              className: isLanding
                ? "h-7 px-2.5 rounded-md bg-[#21262D] border border-[#30363D] text-[11px] font-bold text-white flex items-center gap-1 shrink-0"
                : "pill pill-ink h-7 px-2.5 text-[11px] font-medium shrink-0",
            }}
            inactiveProps={{
              className: isLanding
                ? "h-7 px-2.5 rounded-md text-[11px] text-[#8B949E] hover:text-white hover:bg-[#161B22] flex items-center gap-1 shrink-0"
                : "pill h-7 px-2.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary shrink-0",
            }}
          >
            <SettingsIcon className="size-3" />
            <span>Settings</span>
          </Link>
        </div>
      </header>

      {transfer && <TransferDialog mode={transfer} onClose={() => setTransfer(null)} />}
      <SettingsModal open={settingsModalOpen} onOpenChange={setSettingsModalOpen} />
    </>
  );
}
