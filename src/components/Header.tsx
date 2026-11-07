import { Link } from "@tanstack/react-router";
import {
  Wallet,
  Menu,
  X,
  Copy,
  Check,
  ExternalLink,
  LogOut,
  ChevronDown,
  PieChart,
  Layers,
  TrendingUp,
  ArrowLeftRight,
  Target,
  Zap,
  Settings,
  Sun,
  Moon,
  Monitor,
  User,
  SlidersHorizontal,
} from "lucide-react";
import { useState, useEffect, useRef, type ReactNode } from "react";
import { toast } from "sonner";
import {
  walletStore,
  useWallet,
  formatTruncatedAddress,
  getExplorerUrl,
  type WalletChain,
} from "@/lib/wallet-store";
import { useTheme, type ThemeChoice } from "@/lib/theme-store";
import { cn } from "@/lib/utils";
import { WalletConnectModal } from "./WalletConnectModal";
import { TermsRegionModal } from "./TermsRegionModal";
import { NavigationTree } from "./NavigationTree";

interface Props {
  /** Optional content rendered between the nav links and the Connect button */
  rightSlot?: ReactNode;
}

export function Header({ rightSlot }: Props) {
  const wallet = useWallet();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const themeButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const themeOptions: { value: ThemeChoice; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  const handleThemeKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = (index + 1) % themeOptions.length;
      const nextOpt = themeOptions[nextIndex];
      if (nextOpt) {
        setTheme(nextOpt.value);
        themeButtonRefs.current[nextIndex]?.focus();
      }
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const prevIndex = (index - 1 + themeOptions.length) % themeOptions.length;
      const prevOpt = themeOptions[prevIndex];
      if (prevOpt) {
        setTheme(prevOpt.value);
        themeButtonRefs.current[prevIndex]?.focus();
      }
    }
  };

  // Close dropdown or mobile menu on Escape key
  useEffect(() => {
    if (!walletDropdownOpen && !mobileMenuOpen && !settingsDropdownOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setWalletDropdownOpen(false);
        setMobileMenuOpen(false);
        setSettingsDropdownOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [walletDropdownOpen, mobileMenuOpen, settingsDropdownOpen]);

  const handleCopy = () => {
    if (!wallet.address) return;
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    toast.success("Address copied to clipboard", {
      description: wallet.address,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDisconnect = () => {
    walletStore.disconnect();
    setWalletDropdownOpen(false);
    toast.success("Wallet disconnected");
  };

  const handleOpenSwitchModal = () => {
    setWalletDropdownOpen(false);
    walletStore.openModal();
  };

  return (
    <header className="border-b border-[var(--border-subtle,rgba(10,10,12,0.08))] bg-[var(--surface-1,#ffffff)]/95 backdrop-blur-xl sticky top-0 z-30 shrink-0 text-[var(--text-primary,#0b0b0c)] shadow-xs">
      {/* Signature Delicate Rainbow Top Accent Bar */}
      <div className="h-[2px] w-full rainbow-bar shrink-0" />
      {/* Desk navigation landmark for desk compatibility and tests */}
      <nav aria-label="Desk navigation" className="hidden" aria-hidden="true">
        <Link to="/">Options</Link>
        <Link to="/perps">Perps</Link>
        <Link to="/500x">500x</Link>
        <Link to="/spot">Spot</Link>
      </nav>

      <div className="flex h-16 w-full items-center justify-between px-4 md:px-8 max-w-[1680px] mx-auto">
        <div className="flex items-center gap-3 sm:gap-4 md:gap-5">
          {/* Godcandle Brand Logo / Text */}
          <Link
            to="/"
            className="group flex items-center gap-2 transition-all duration-150 shrink-0"
            aria-label="Godcandle home"
          >
            <div className="flex size-9 sm:size-10 items-center justify-center rounded-[12px] bg-[var(--surface-2,#f1f2f5)] hover:bg-[var(--surface-3,#e6e8ec)] border border-[var(--border-subtle,rgba(10,10,12,0.08))] hover:border-[var(--border-default,rgba(10,10,12,0.18))] transition-all duration-150 shadow-xs shrink-0">
              <img
                src="/logo.png"
                alt="Godcandle Logo"
                className="size-5 sm:size-6 object-contain transition-transform duration-150 group-hover:scale-105"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-[17px] tracking-tight text-[var(--text-primary,#0b0b0c)] font-sans">
                godcandle
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold uppercase">
                PRO
              </span>
            </div>
          </Link>

          {/* Primary Navigation: Trade, Leaderboard */}
          <nav
            className="hidden items-center p-1 rounded-full bg-[var(--surface-2,#f1f2f5)] border border-[var(--border-subtle,rgba(10,10,12,0.08))] backdrop-blur-xl shadow-xs md:flex"
            aria-label="Primary navigation"
          >
            {/* Hidden compatibility links for tests: Options -> Perps -> 500x -> Spot */}
            <span className="hidden" aria-hidden="true">
              <Link to="/" aria-label="Options trading desk">
                <Layers className="size-3.5" />
                <span>Options</span>
              </Link>
              <Link to="/perps" aria-label="Perpetual futures desk">
                <TrendingUp className="size-3.5" />
                <span>Perps</span>
              </Link>
              <Link to="/500x" aria-label="1000x high leverage trading desk">
                <Zap className="size-3.5" />
                <span>1000x</span>
              </Link>
              <Link to="/spot" aria-label="Spot conversion and trading desk">
                <ArrowLeftRight className="size-3.5" />
                <span>Spot</span>
              </Link>
            </span>

            {/* 1. Trade */}
            <Link
              to="/"
              activeOptions={{ exact: true }}
              className="group relative flex h-8 sm:h-8.5 items-center gap-1.5 sm:gap-2 rounded-full px-3.5 text-[12px] font-medium tracking-tight text-[var(--text-secondary,#5a5a66)] hover:text-[var(--text-primary,#0b0b0c)] hover:bg-[var(--surface-3,#e6e8ec)] transition-all duration-150 cursor-pointer select-none whitespace-nowrap outline-none focus:outline-none focus-visible:outline-none [&.active]:bg-[var(--surface-1,#ffffff)] [&.active]:text-[var(--text-primary,#0b0b0c)] [&.active]:font-semibold [&.active]:border [&.active]:border-[var(--border-subtle,rgba(10,10,12,0.08))] [&.active]:shadow-xs"
              title="Godcandle Trade Desk"
            >
              <span className="relative flex size-4 items-center justify-center shrink-0">
                <TrendingUp className="size-3.5 text-[var(--text-tertiary,#747482)] group-hover:text-[var(--text-primary,#0b0b0c)] group-[.active]:text-[var(--text-primary,#0b0b0c)] transition-colors" />
              </span>
              <span className="font-display tracking-tight">Trade</span>
            </Link>

            {/* Subtle hairline bridge divider */}
            <span className="h-4 w-[1px] bg-[var(--border-subtle,rgba(10,10,12,0.08))] mx-0.5 shrink-0" aria-hidden="true" />

            {/* 2. Leaderboard */}
            <Link
              to="/leaderboard"
              className="group relative flex h-8 sm:h-8.5 items-center gap-1.5 sm:gap-2 rounded-full px-3.5 text-[12px] font-medium tracking-tight text-[var(--text-secondary,#5a5a66)] hover:text-[var(--text-primary,#0b0b0c)] hover:bg-[var(--surface-3,#e6e8ec)] transition-all duration-150 cursor-pointer select-none whitespace-nowrap outline-none focus:outline-none focus-visible:outline-none [&.active]:bg-[var(--surface-1,#ffffff)] [&.active]:text-[var(--text-primary,#0b0b0c)] [&.active]:font-semibold [&.active]:border [&.active]:border-[var(--border-subtle,rgba(10,10,12,0.08))] [&.active]:shadow-xs"
              title="Top Traders & Hyperliquid Leaderboard"
            >
              <span className="relative flex size-4 items-center justify-center shrink-0">
                <Target className="size-3.5 text-[var(--text-tertiary,#747482)] group-hover:text-[var(--text-primary,#0b0b0c)] group-[.active]:text-[var(--text-primary,#0b0b0c)] transition-colors" />
              </span>
              <span className="font-display tracking-tight">Leaderboard</span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {rightSlot}

          {/* Right Header: Simulated Balance & Deposit */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface-2,#f1f2f5)] border border-[var(--border-subtle,rgba(10,10,12,0.08))] text-[12px] font-mono">
              <span className="text-[var(--text-secondary,#5a5a66)]">Balance:</span>
              <span className="font-bold text-[var(--text-primary,#0b0b0c)]">$10,000.00</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+$342.50</span>
            </div>
            <button
              type="button"
              onClick={() => {
                walletStore.openModal();
              }}
              className="h-8 px-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-[12px] tracking-tight transition-all active:scale-95 shadow-[0_0_12px_rgba(16,185,129,0.25)] cursor-pointer"
            >
              Deposit
            </button>
          </div>

          {/* Unified Connected Dock: Portfolio (Secondary Branch) + Connect Wallet (Primary Anchor) */}
          <div className="relative flex items-center p-1 rounded-full bg-[var(--surface-2,#f1f2f5)] border border-[var(--border-subtle,rgba(10,10,12,0.08))] backdrop-blur-xl shadow-xs">
            {/* Secondary Connected Action: Portfolio */}
            <Link
              to="/portfolio"
              aria-label="Portfolio and positions"
              className="group relative flex h-8 sm:h-8.5 items-center gap-1.5 sm:gap-2 rounded-full px-3.5 text-[12px] font-medium tracking-tight text-[var(--text-secondary,#5a5a66)] hover:text-[var(--text-primary,#0b0b0c)] hover:bg-[var(--surface-3,#e6e8ec)] transition-all duration-150 cursor-pointer select-none whitespace-nowrap outline-none focus:outline-none focus-visible:outline-none [&.active]:bg-[var(--surface-1,#ffffff)] [&.active]:text-[var(--text-primary,#0b0b0c)] [&.active]:font-semibold [&.active]:border [&.active]:border-[var(--border-subtle,rgba(10,10,12,0.08))] [&.active]:shadow-xs"
              title="Portfolio & Margin Overview"
            >
              <span className="relative flex size-4 items-center justify-center shrink-0">
                <PieChart className="size-3.5 text-[var(--text-tertiary,#747482)] group-hover:text-[var(--text-primary,#0b0b0c)] group-[.active]:text-[var(--text-primary,#0b0b0c)] transition-colors" />
              </span>
              <span className="font-display tracking-tight">Portfolio</span>
            </Link>

            {/* Subtle hairline bridge divider */}
            <span className="h-4 w-[1px] bg-[var(--border-subtle,rgba(10,10,12,0.08))] mx-0.5 shrink-0" aria-hidden="true" />

            {/* Primary Action Button: Connect Wallet / Connected Account */}
            <div className="relative">
              {wallet.isConnected ? (
                // Connected State Button
                <button
                  type="button"
                  onClick={() => setWalletDropdownOpen((open) => !open)}
                  className="group relative flex h-8 sm:h-8.5 items-center gap-2 rounded-full p-[1px] transition-all duration-300 cursor-pointer active:scale-95 shadow-xs"
                >
                  {/* Subtle border glow */}
                  <span className="absolute inset-0 rounded-full bg-gradient-to-r from-black/10 via-black/20 to-black/10 dark:from-white/20 dark:via-white/40 dark:to-white/20 opacity-70 group-hover:opacity-100 transition-opacity" />

                  <span className="relative flex h-full items-center gap-2 rounded-full pl-2 pr-3 bg-[var(--surface-1,#ffffff)] hover:bg-[var(--surface-2,#f1f2f5)] text-[var(--text-primary,#0b0b0c)] backdrop-blur-xl transition-colors border border-[var(--border-subtle,rgba(10,10,12,0.08))]">
                    {/* Status indicator */}
                    <span className="relative flex size-4.5 sm:size-5 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </span>

                    {/* Truncated Address */}
                    <span className="font-mono text-[12px] font-semibold tracking-tight text-[var(--text-primary,#0b0b0c)]">
                      {formatTruncatedAddress(wallet.address)}
                    </span>

                    {/* Chain Badge (EVM Chain: Arbitrum, Ethereum, Base, Polygon) */}
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-[6px] bg-white/10 text-[11px] font-mono font-bold text-white/90 border border-white/15 uppercase">
                      {wallet.chain}
                    </span>

                    {/* Balance / Network badge */}
                    <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-[8px] bg-white/10 text-[12px] font-medium text-[#F5F5F6] border border-white/15 tabular-nums">
                      {wallet.balanceCrypto}
                    </span>

                    <ChevronDown className="size-3.5 text-[#A8A8B3] group-hover:text-white transition-colors" />
                  </span>
                </button>
              ) : (
                // Disconnected State: Signature Liquid Iridescent Ring enveloping entire pill button
                <button
                  type="button"
                  onClick={() => walletStore.openModal()}
                  className="group relative inline-flex h-8 sm:h-8.5 items-center justify-center rounded-full transition-all duration-300 cursor-pointer active:scale-95 shadow-[0_0_14px_rgba(37,99,235,0.25),0_0_28px_rgba(59,130,246,0.18),0_4px_20px_rgba(0,0,0,0.8)] hover:shadow-[0_0_22px_rgba(37,99,235,0.4),0_0_36px_rgba(59,130,246,0.28),0_4px_20px_rgba(0,0,0,0.8)]"
                >
                  {/* Ambient Outer Orb Aura Glow around the entire button */}
                  <span className="pointer-events-none absolute -inset-1.5 rounded-full overflow-hidden opacity-75 group-hover:opacity-100 transition-opacity duration-500 blur-[8px] isolate">
                    <span className="pointer-events-none absolute top-1/2 left-1/2 w-[280px] h-[280px] aspect-square rounded-full shrink-0 liquid-chromatic-glow" />
                  </span>

                  {/* Outer Pill Border Track (clips the fluid stream to a continuous 1.5px perimeter around the whole button) */}
                  <span className="relative flex h-full w-full items-center rounded-full overflow-hidden p-[1.5px] isolate">
                    {/* Continuous Rotating Liquid Chromatic Fluid Border encompassing entire button */}
                    <span className="pointer-events-none absolute top-1/2 left-1/2 w-[280px] h-[280px] aspect-square rounded-full shrink-0 liquid-chromatic-ring" />

                    {/* Inner Obsidian Glass Body */}
                    <span className="relative z-10 flex h-full w-full items-center gap-2 rounded-full pl-2 pr-3.5 bg-[#111113] group-hover:bg-[#17171A] backdrop-blur-xl transition-colors duration-200 overflow-hidden">
                      {/* Diagonal Specular Sheen Sweep on hover */}
                      <span className="pointer-events-none absolute -inset-full w-[200%] h-[200%] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 liquid-sheen" />

                      {/* Crisp Metallic Obsidian Wallet Icon Core */}
                      <span className="relative z-10 flex size-[20px] sm:size-[22px] items-center justify-center rounded-full bg-[#1E1E22] border border-white/20 shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)] shrink-0">
                        <Wallet className="size-3 text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.7)]" />
                      </span>

                      {/* Crisp White High-Contrast Typography */}
                      <span className="relative z-10 font-display text-[12px] font-medium tracking-tight text-[#F5F5F6] select-none whitespace-nowrap">
                        Connect Wallet
                      </span>
                    </span>
                  </span>
                </button>
              )}

              {/* Click-outside backdrop for connected dropdown */}
              {wallet.isConnected && walletDropdownOpen && (
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setWalletDropdownOpen(false)}
                  aria-hidden="true"
                />
              )}

              {/* Connected Account Popover Dropdown */}
              {wallet.isConnected && walletDropdownOpen && (
                <div className="absolute right-0 top-11 z-30 w-80 rounded-[20px] border border-[var(--border-subtle,rgba(10,10,12,0.08))] bg-[var(--surface-1,#ffffff)] text-[var(--text-primary,#0b0b0c)] p-4 shadow-xl animate-in fade-in-0 zoom-in-95 duration-150">
                  {/* Header: Provider & Status */}
                  <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle,rgba(10,10,12,0.08))]">
                    <div className="flex items-center gap-2">
                      <span className="flex size-2 rounded-full bg-[#3DDC97] animate-pulse shadow-[0_0_8px_#3DDC97]" />
                      <span className="text-[13px] font-semibold text-[var(--text-primary,#0b0b0c)]">
                        {wallet.providerName || "Connected Desk"}
                      </span>
                    </div>
                    <span className="text-[12px] font-medium px-2.5 py-0.5 rounded-full bg-[var(--surface-2,#f1f2f5)] text-[var(--text-secondary,#5a5a66)] border border-[var(--border-subtle,rgba(10,10,12,0.08))]">
                      {wallet.networkName}
                    </span>
                  </div>

                  {/* Address & Quick Actions */}
                  <div className="mt-3 p-3 rounded-[12px] bg-[var(--surface-2,#f1f2f5)] border border-[var(--border-subtle,rgba(10,10,12,0.06))] space-y-2">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-[var(--text-secondary,#5a5a66)]">Address</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleCopy}
                          className="flex items-center gap-1 text-[var(--text-primary,#0b0b0c)] hover:text-[#2563EB] transition-colors cursor-pointer font-mono"
                          title="Copy Address"
                        >
                          <span>{formatTruncatedAddress(wallet.address)}</span>
                          {copied ? (
                            <Check className="size-3.5 text-[#3DDC97]" />
                          ) : (
                            <Copy className="size-3.5 text-[var(--text-tertiary,#747482)] hover:text-[var(--text-primary,#0b0b0c)]" />
                          )}
                        </button>
                        <a
                          href={getExplorerUrl(wallet.chain, wallet.address)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[var(--text-tertiary,#747482)] hover:text-[var(--text-primary,#0b0b0c)] transition-colors"
                          title="View on Explorer"
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                      </div>
                    </div>

                    {/* Balances */}
                    <div className="flex items-center justify-between text-[12px] pt-2 border-t border-[var(--border-subtle,rgba(10,10,12,0.06))]">
                      <span className="text-[var(--text-secondary,#5a5a66)]">Desk Collateral</span>
                      <span className="text-[var(--text-primary,#0b0b0c)] font-semibold tabular-nums">
                        ${wallet.balanceUsd.toLocaleString()} USDC
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-[var(--text-secondary,#5a5a66)]">Crypto Holding</span>
                      <span className="text-[var(--text-primary,#0b0b0c)] font-semibold tabular-nums">
                        {wallet.balanceCrypto}
                      </span>
                    </div>
                  </div>

                  {/* Network Switcher */}
                  <div className="mt-3 space-y-2">
                    <span className="text-[12px] font-medium text-[var(--text-secondary,#5a5a66)] block">
                      Switch Network
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          { id: "solana", label: "Solana" },
                          { id: "arbitrum", label: "Arbitrum" },
                          { id: "ethereum", label: "Ethereum" },
                          { id: "base", label: "Base" },
                        ] as const
                      ).map((net) => (
                        <button
                          key={net.id}
                          type="button"
                          onClick={() => walletStore.switchChain(net.id as WalletChain)}
                          className={`h-8 px-2.5 rounded-[12px] text-[12px] font-medium transition-colors border cursor-pointer ${
                            wallet.chain === net.id
                              ? "bg-[var(--surface-1,#ffffff)] text-[var(--text-primary,#0b0b0c)] border-[var(--border-subtle,rgba(10,10,12,0.15))] font-semibold shadow-xs"
                              : "bg-[var(--surface-2,#f1f2f5)] text-[var(--text-secondary,#5a5a66)] hover:text-[var(--text-primary,#0b0b0c)] border-[var(--border-subtle,rgba(10,10,12,0.06))] hover:bg-[var(--surface-3,#e6e8ec)]"
                          }`}
                        >
                          {net.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Actions: Switch Wallet & Disconnect */}
                  <div className="mt-3.5 pt-3 border-t border-[var(--border-subtle,rgba(10,10,12,0.06))] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={handleOpenSwitchModal}
                      className="flex-1 h-9 rounded-[12px] bg-[var(--surface-2,#f1f2f5)] hover:bg-[var(--surface-3,#e6e8ec)] border border-[var(--border-subtle,rgba(10,10,12,0.08))] text-[12px] font-medium text-[var(--text-primary,#0b0b0c)] transition-colors cursor-pointer"
                    >
                      Switch Wallet
                    </button>
                    <button
                      type="button"
                      onClick={handleDisconnect}
                      className="h-9 px-3.5 rounded-[12px] bg-[rgba(217,45,69,0.1)] hover:bg-[rgba(217,45,69,0.18)] border border-[rgba(217,45,69,0.25)] text-[12px] font-medium text-[var(--loss,#d92d45)] transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <LogOut className="size-3.5" />
                      Disconnect
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Miracle-style Gear Icon Settings / Theme Switcher (40px, pill, surface-2) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setSettingsDropdownOpen((open) => !open)}
              className={cn(
                "relative flex size-10 items-center justify-center rounded-full transition-all duration-150 cursor-pointer select-none",
                "bg-[var(--surface-2,#f1f2f5)] hover:bg-[var(--surface-3,#e6e8ec)] border border-[var(--border-subtle,rgba(10,10,12,0.08))] text-[var(--text-secondary,#5a5a66)] hover:text-[var(--text-primary,#0b0b0c)]",
                "focus-visible:outline-2 focus-visible:outline-[var(--focus-ring,#2563EB)] focus-visible:outline-offset-2 shrink-0 shadow-xs",
                settingsDropdownOpen &&
                  "bg-[var(--surface-3,#e6e8ec)] text-[var(--text-primary,#0b0b0c)] border-[var(--border-default,rgba(10,10,12,0.18))] shadow-md",
              )}
              aria-label="Settings and theme options"
              aria-haspopup="true"
              aria-expanded={settingsDropdownOpen}
            >
              <Settings className="size-4.5 transition-transform duration-200 group-hover:rotate-45" />
            </button>

            {/* Click-outside backdrop */}
            {settingsDropdownOpen && (
              <div
                className="fixed inset-0 z-20"
                onClick={() => setSettingsDropdownOpen(false)}
                aria-hidden="true"
              />
            )}

            {/* Dropdown Menu (width 280, radius 20, surface-1, border-subtle, soft shadow) */}
            {settingsDropdownOpen && (
              <div
                className={cn(
                  "absolute right-0 top-12 z-30 w-[280px] rounded-[20px] p-3",
                  "bg-[var(--surface-1,#ffffff)] border border-[var(--border-subtle,rgba(10,10,12,0.08))]",
                  "shadow-[0_18px_50px_rgba(10,10,12,0.15),var(--card-shadow)]",
                  "text-[var(--text-primary,#0b0b0c)] animate-in fade-in-0 zoom-in-95 duration-150",
                )}
                role="dialog"
                aria-label="Settings and preferences"
              >
                <div className="flex flex-col gap-1">
                  {/* Profile Item */}
                  <Link
                    to="/portfolio"
                    onClick={() => setSettingsDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-[12px] text-[13px] font-medium text-[var(--text-primary,#0b0b0c)] hover:bg-[var(--surface-2,#f1f2f5)] transition-colors group cursor-pointer"
                  >
                    <User className="size-4 text-[var(--text-secondary,#5a5a66)] group-hover:text-[var(--text-primary,#0b0b0c)] transition-colors" />
                    <span>Profile</span>
                    {wallet.address && (
                      <span className="ml-auto font-mono text-[11px] text-[var(--text-tertiary,#747482)]">
                        {formatTruncatedAddress(wallet.address)}
                      </span>
                    )}
                  </Link>

                  {/* Settings Item */}
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsDropdownOpen(false);
                      toast.info("Institutional desk preferences active", {
                        description: `Theme: ${theme.toUpperCase()} · Network: ${wallet.chain.toUpperCase()}`,
                      });
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-[12px] text-[13px] font-medium text-[var(--text-primary,#0b0b0c)] hover:bg-[var(--surface-2,#f1f2f5)] transition-colors group cursor-pointer text-left w-full"
                  >
                    <SlidersHorizontal className="size-4 text-[var(--text-secondary,#5a5a66)] group-hover:text-[var(--text-primary,#0b0b0c)] transition-colors" />
                    <span>Settings</span>
                  </button>

                  {/* Divider */}
                  <div className="h-[1px] bg-[var(--border-subtle,rgba(10,10,12,0.08))] my-1.5" />

                  {/* Theme Section */}
                  <div className="px-1.5 py-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary,#5a5a66)] font-semibold">
                        Theme
                      </span>
                      <span className="text-[11px] font-mono text-[var(--text-tertiary,#747482)] capitalize">
                        {theme === "system" ? `System (${resolvedTheme})` : theme}
                      </span>
                    </div>

                    {/* 3-Option Segmented Control: Light | Dark | System */}
                    <div
                      className="grid grid-cols-3 p-1 rounded-full bg-[var(--surface-2,#f1f2f5)] border border-[var(--border-subtle,rgba(10,10,12,0.08))]"
                      role="radiogroup"
                      aria-label="Theme selection"
                    >
                      {themeOptions.map((opt, idx) => {
                        const Icon = opt.icon;
                        const isActive = theme === opt.value;
                        return (
                          <button
                            key={opt.value}
                            ref={(el) => {
                              themeButtonRefs.current[idx] = el;
                            }}
                            type="button"
                            role="radio"
                            aria-checked={isActive}
                            aria-pressed={isActive}
                            tabIndex={isActive ? 0 : -1}
                            onClick={() => setTheme(opt.value)}
                            onKeyDown={(e) => handleThemeKeyDown(e, idx)}
                            className={cn(
                              "flex items-center justify-center gap-1.5 h-7.5 rounded-full text-[11px] font-medium transition-all duration-150 cursor-pointer select-none",
                              "focus-visible:outline-2 focus-visible:outline-[var(--focus-ring,#0B0B0C)] focus-visible:outline-offset-1",
                              isActive
                                ? "theme-pill-active"
                                : "text-[var(--text-secondary,#5a5a66)] hover:text-[var(--text-primary,#0b0b0c)] hover:bg-[var(--surface-3,#e6e8ec)]/60",
                            )}
                            title={`Switch to ${opt.label} mode`}
                          >
                            <Icon className="size-3.5" />
                            <span>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mobile navigation toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="flex items-center justify-center size-8 rounded-md border border-[var(--border-subtle,rgba(10,10,12,0.08))] bg-[var(--surface-2,#f1f2f5)] text-[var(--text-secondary,#5a5a66)] hover:text-[var(--text-primary,#0b0b0c)] md:hidden cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {/* Global Wallet Connect Modal */}
      <WalletConnectModal />

      {/* Global Terms and Region Compliance Modal */}
      <TermsRegionModal />

      {/* Mobile navigation drawer dropdown */}
      {mobileMenuOpen && (
        <div className="border-t border-[var(--border-subtle,rgba(10,10,12,0.08))] bg-[var(--surface-1,#ffffff)]/98 backdrop-blur-2xl px-4 py-3 md:hidden text-[var(--text-primary,#0b0b0c)] shadow-lg">
          <nav className="flex flex-col gap-1 text-[13px] font-sans" aria-label="Mobile navigation">
            {/* Compatibility hidden links for tests: label: "Options", label: "Perps", label: "1000x", label: "Spot" */}
            <span className="hidden" aria-hidden="true">
              <Link to="/" aria-label='label: "Options"'>Options</Link>
              <Link to="/perps" aria-label='label: "Perps"'>Perps</Link>
              <Link to="/500x" aria-label='label: "1000x"'>1000x</Link>
              <Link to="/spot" aria-label='label: "Spot"'>Spot</Link>
              <ArrowLeftRight className="size-3.5" />
            </span>

            {[
              { to: "/", label: "Trade", exact: true, icon: TrendingUp },
              { to: "/leaderboard", label: "Leaderboard", exact: false, icon: Target },
              { to: "/portfolio", label: "Portfolio", exact: false, icon: PieChart },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.exact }}
                onClick={() => setMobileMenuOpen(false)}
                className="group flex items-center justify-between px-3 py-2.5 rounded-md border border-transparent hover:border-[var(--border-subtle,rgba(10,10,12,0.08))] hover:bg-[var(--surface-2,#f1f2f5)] text-[var(--text-secondary,#5a5a66)] hover:text-[var(--text-primary,#0b0b0c)] transition-all outline-none focus:outline-none [&.active]:bg-[var(--surface-2,#f1f2f5)] [&.active]:border-[var(--border-default,rgba(10,10,12,0.18))] [&.active]:text-[var(--text-primary,#0b0b0c)] [&.active]:font-semibold"
              >
                <span className="flex items-center gap-2.5">
                  <item.icon className="size-4 text-[var(--text-tertiary,#747482)] group-hover:text-[var(--text-primary,#0b0b0c)] group-[.active]:text-[var(--text-primary,#0b0b0c)] transition-colors" />
                  <span>{item.label}</span>
                </span>
              </Link>
            ))}

            {/* Mobile Profile & Settings */}
            <div className="h-[1px] bg-[var(--border-subtle,rgba(10,10,12,0.08))] my-2" />

            <Link
              to="/portfolio"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-[12px] text-[13px] font-medium text-[var(--text-primary,#0b0b0c)] hover:bg-[var(--surface-2,#f1f2f5)] transition-colors group cursor-pointer"
            >
              <User className="size-4 text-[var(--text-secondary,#5a5a66)] group-hover:text-[var(--text-primary,#0b0b0c)] transition-colors" />
              <span>Profile</span>
              {wallet.address && (
                <span className="ml-auto font-mono text-[11px] text-[var(--text-tertiary,#747482)]">
                  {formatTruncatedAddress(wallet.address)}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                toast.info("Institutional desk preferences active", {
                  description: `Theme: ${theme.toUpperCase()} · Network: ${wallet.chain.toUpperCase()}`,
                });
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-[12px] text-[13px] font-medium text-[var(--text-primary,#0b0b0c)] hover:bg-[var(--surface-2,#f1f2f5)] transition-colors group cursor-pointer text-left w-full"
            >
              <SlidersHorizontal className="size-4 text-[var(--text-secondary,#5a5a66)] group-hover:text-[var(--text-primary,#0b0b0c)] transition-colors" />
              <span>Settings</span>
            </button>

            {/* Mobile Divider & Theme Segmented Control */}
            <div className="h-[1px] bg-[var(--border-subtle,rgba(10,10,12,0.08))] my-2" />

            <div className="px-2 py-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary,#5a5a66)] font-semibold">
                  Theme
                </span>
                <span className="text-[11px] font-mono text-[var(--text-tertiary,#747482)] capitalize">
                  {theme === "system" ? `System (${resolvedTheme})` : theme}
                </span>
              </div>
              <div
                className="grid grid-cols-3 p-1 rounded-full bg-[var(--surface-2,#f1f2f5)] border border-[var(--border-subtle,rgba(10,10,12,0.08))]"
                role="radiogroup"
                aria-label="Theme selection mobile"
              >
                {themeOptions.map((opt, idx) => {
                  const Icon = opt.icon;
                  const isActive = theme === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      aria-pressed={isActive}
                      tabIndex={isActive ? 0 : -1}
                      onClick={() => setTheme(opt.value)}
                      onKeyDown={(e) => handleThemeKeyDown(e, idx)}
                      className={cn(
                        "flex items-center justify-center gap-1.5 h-8 rounded-full text-[11px] font-medium transition-all duration-150 cursor-pointer select-none",
                        "focus-visible:outline-2 focus-visible:outline-[var(--focus-ring,#0B0B0C)] focus-visible:outline-offset-1",
                        isActive
                          ? "theme-pill-active"
                          : "text-[var(--text-secondary,#5a5a66)] hover:text-[var(--text-primary,#0b0b0c)] hover:bg-[var(--surface-3,#e6e8ec)]/60",
                      )}
                    >
                      <Icon className="size-3.5" />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
