import { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  X,
  TrendingUp,
  TrendingDown,
  Star,
  Activity,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
  Zap,
  BarChart3,
  Clock,
  ChevronRight,
} from "lucide-react";
import { GradientArt } from "./GradientArt";
import { cn } from "@/lib/utils";

import { type TickerMarketItem, PERPS_MARKET_ITEMS, SPOT_MARKET_ITEMS } from "@/lib/ticker-data";

export type { TickerMarketItem };
export { PERPS_MARKET_ITEMS, SPOT_MARKET_ITEMS };

export interface TickerPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type?: "perps" | "spot";
  selectedPair: string;
  onSelectPair: (pairKey: string) => void;
  favorites?: string[];
  onToggleFavorite?: (pairKey: string) => void;
}

export function TickerPickerModal({
  open,
  onOpenChange,
  type = "perps",
  selectedPair,
  onSelectPair,
  favorites = ["BTC-PERP", "ETH-PERP", "SOL-PERP", "HYPE-PERP", "BTC/USDC", "ETH/USDC"],
  onToggleFavorite,
}: TickerPickerModalProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [previewKey, setPreviewKey] = useState<string>(selectedPair);
  const [favs, setFavs] = useState<string[]>(favorites);
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync preview key when modal opens or selectedPair changes
  useEffect(() => {
    if (open) {
      setPreviewKey(selectedPair);
      setSearch("");
      setSelectedCategory("All");
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [open, selectedPair]);

  // Handle ESC key and scroll locking
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, onOpenChange]);

  const rawItems = type === "perps" ? PERPS_MARKET_ITEMS : SPOT_MARKET_ITEMS;

  const categories = useMemo(() => {
    if (type === "perps") {
      return ["All", "Favorites", "Layer 1", "Layer 2", "DeFi", "AI", "Meme"];
    }
    return ["All", "Favorites", "Major", "Layer 1", "Meme"];
  }, [type]);

  const filteredItems = useMemo(() => {
    return rawItems.filter((item) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.symbol.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.base.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (selectedCategory === "Favorites") {
        return favs.includes(item.symbol);
      }
      if (selectedCategory !== "All") {
        return item.category === selectedCategory;
      }
      return true;
    });
  }, [rawItems, search, selectedCategory, favs]);

  // Current active preview item (fallback to first filtered or first item)
  const previewItem = useMemo(() => {
    const found = rawItems.find((i) => i.symbol === previewKey);
    if (found) return found;
    return filteredItems[0] || rawItems[0]!;
  }, [rawItems, previewKey, filteredItems]);

  const toggleFav = (sym: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavs((prev) => (prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]));
    if (onToggleFavorite) onToggleFavorite(sym);
  };

  const handleConfirmSelect = (symbol: string) => {
    onSelectPair(symbol);
    onOpenChange(false);
  };

  // Keyboard navigation through filtered list
  const handleContainerKeyDown = (e: React.KeyboardEvent) => {
    if (filteredItems.length === 0) return;
    const currentIndex = filteredItems.findIndex((i) => i.symbol === previewItem.symbol);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIdx = (currentIndex + 1) % filteredItems.length;
      setPreviewKey(filteredItems[nextIdx]!.symbol);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevIdx = (currentIndex - 1 + filteredItems.length) % filteredItems.length;
      setPreviewKey(filteredItems[prevIdx]!.symbol);
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleConfirmSelect(previewItem.symbol);
    }
  };

  if (!open || !mounted || typeof document === "undefined") return null;

  // Calculate 24h range percentage for progress bar
  const rangeSpan = Math.max(1, previewItem.highNum - previewItem.lowNum);
  const currentOffset = Math.max(0, previewItem.price - previewItem.lowNum);
  const rangePercent = Math.min(100, Math.max(0, (currentOffset / rangeSpan) * 100));

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center max-sm:items-end p-4 max-sm:p-0 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onOpenChange(false);
        }
      }}
      onKeyDown={handleContainerKeyDown}
    >
      {/* Obsidian Backdrop: rgba(0,0,0,0.6) + backdrop blur 24px */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-[24px] animate-in fade-in-0 duration-200"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* 50/50 Split Modal Architecture: 960x600 Desktop / 90vh Mobile */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ticker-picker-title"
        className="relative z-10 w-full sm:max-w-[960px] h-[90vh] sm:h-[600px] overflow-hidden rounded-t-[28px] rounded-b-none sm:rounded-[28px] border-t sm:border border-white/[0.08] bg-[#111113] text-[#F5F5F6] shadow-[0_24px_80px_rgba(0,0,0,0.9)] flex flex-col sm:flex-row animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 fade-in-0 duration-200"
      >
        {/* ============================================================== */}
        {/* MOBILE TOP AMBIENT GRADIENT BANNER (<640px only, 140px height) */}
        {/* ============================================================== */}
        <div className="relative h-[140px] w-full shrink-0 sm:hidden overflow-hidden">
          <GradientArt
            variant="sapphire"
            backgroundImage="/images/blue-ambient.png"
            className="h-full w-full"
          >
            <div className="absolute inset-0 p-4 flex flex-col justify-between z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#2563EB] shadow-[0_0_10px_#2563EB] animate-pulse" />
                  <span className="font-display font-black text-[14px] tracking-wider text-white">
                    {type === "perps" ? "GODCANDLE PERPETUALS" : "GODCANDLE SPOT DESK"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="flex size-7 items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white cursor-pointer"
                  aria-label="Close"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-[18px] font-bold text-white font-mono">
                    {previewItem.symbol}
                  </span>
                  <span className="text-[12px] text-white/70 ml-2">{previewItem.name}</span>
                </div>
                <span
                  className={cn(
                    "text-[13px] font-mono font-bold px-2 py-0.5 rounded-full border",
                    previewItem.isUp
                      ? "bg-[#3DDC97]/20 text-[#3DDC97] border-[#3DDC97]/30"
                      : "bg-[#FF5C6C]/20 text-[#FF5C6C] border-[#FF5C6C]/30",
                  )}
                >
                  {previewItem.change24h}
                </span>
              </div>
            </div>
          </GradientArt>
        </div>

        {/* ============================================================== */}
        {/* LEFT PANE: Search, Categories, Scrollable Pair List (50%)     */}
        {/* ============================================================== */}
        <div className="relative flex-1 sm:w-1/2 h-full bg-[#111113] p-5 sm:p-7 flex flex-col justify-between overflow-hidden z-10 border-b sm:border-b-0 sm:border-r border-white/[0.06]">
          {/* Header Title & Subtitle */}
          <div className="shrink-0 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#2563EB] shadow-[0_0_8px_#2563EB] animate-pulse" />
                <h2
                  id="ticker-picker-title"
                  className="font-display text-[18px] font-bold text-[#F5F5F6] tracking-tight"
                >
                  {type === "perps" ? "Select Perpetual Market Asset" : "Select Spot Market Pair"}
                </h2>
              </div>
              <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#1E1E22] text-[#A8A8B3] border border-white/[0.06]">
                {filteredItems.length} pairs
              </span>
            </div>

            {/* Search Bar (Matches Search for an asset requirement) */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#8A8A96]" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for an asset or ticker (BTC, ETH, SOL...)"
                className="h-10 w-full rounded-full border border-white/[0.08] bg-[#1E1E22] pl-10 pr-9 text-[13px] text-[#F5F5F6] placeholder:text-[#8A8A96] focus:border-[#2563EB]/70 focus:outline-none transition-colors font-mono"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8A96] hover:text-[#F5F5F6] p-0.5 cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-3 py-1 rounded-full text-[12px] font-mono whitespace-nowrap transition-all cursor-pointer border",
                      isSelected
                        ? "bg-[#2563EB] text-white font-semibold border-[#2563EB] shadow-[0_2px_10px_rgba(37,99,235,0.4)]"
                        : "bg-[#1E1E22] text-[#A8A8B3] border-white/[0.06] hover:bg-[#26262B] hover:text-[#F5F5F6]",
                    )}
                  >
                    {cat === "Favorites" ? "★ Favorites" : cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scrollable Pairs List */}
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-1.5 my-3 pr-0.5 min-h-0">
            {filteredItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#8A8A96] space-y-2">
                <Activity className="size-8 opacity-40" />
                <p className="text-[13px]">No matching assets found for &quot;{search}&quot;</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setSelectedCategory("All");
                  }}
                  className="text-[12px] text-[#2563EB] hover:underline cursor-pointer"
                >
                  Clear search filters
                </button>
              </div>
            ) : (
              filteredItems.map((item) => {
                const isCurrent = selectedPair === item.symbol;
                const isPreviewed = previewItem.symbol === item.symbol;
                const isFav = favs.includes(item.symbol);

                return (
                  <div
                    key={item.symbol}
                    onMouseEnter={() => setPreviewKey(item.symbol)}
                    onClick={() => handleConfirmSelect(item.symbol)}
                    className={cn(
                      "group flex items-center justify-between h-14 px-3.5 rounded-[16px] transition-all cursor-pointer border select-none",
                      isPreviewed
                        ? "bg-[#1E1E22] border-[#2563EB]/40 shadow-sm ring-1 ring-[#2563EB]/30"
                        : "bg-[#17171A] hover:bg-[#1E1E22] border-white/[0.05] hover:border-white/15",
                    )}
                  >
                    {/* Left: Star + Asset Icon + Symbol + Category */}
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => toggleFav(item.symbol, e)}
                        className={cn(
                          "p-1 rounded-full transition-colors cursor-pointer shrink-0",
                          isFav
                            ? "text-amber-400 hover:text-amber-300"
                            : "text-[#8A8A96] hover:text-[#F5F5F6]",
                        )}
                        title={isFav ? "Remove favorite" : "Add favorite"}
                      >
                        <Star className={cn("size-3.5", isFav && "fill-current")} />
                      </button>

                      <div className="size-8 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center font-bold text-[11px] font-mono text-white shrink-0">
                        {item.base.slice(0, 3)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[13px] font-bold text-[#F5F5F6] tracking-tight truncate">
                            {item.symbol}
                          </span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 rounded-full bg-[#2563EB]/20 text-[10px] font-mono font-bold text-[#93C5FD] border border-[#2563EB]/40">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#8A8A96] truncate">
                          <span>{item.name}</span>
                          <span>•</span>
                          <span>{item.category}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Price + 24h Change badge */}
                    <div className="flex items-center gap-3 shrink-0 text-right pl-2 font-mono">
                      <div>
                        <div className="text-[13px] font-bold text-[#F5F5F6] tabular-nums">
                          {item.priceFormatted}
                        </div>
                        <div className="text-[11px] text-[#8A8A96]">24h Vol: {item.volume24h}</div>
                      </div>

                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-[6px] text-[11px] font-bold tabular-nums min-w-[56px] text-center border",
                          item.isUp
                            ? "bg-[#3DDC97]/15 text-[#3DDC97] border-[#3DDC97]/25"
                            : "bg-[#FF5C6C]/15 text-[#FF5C6C] border-[#FF5C6C]/25",
                        )}
                      >
                        {item.change24h}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Navigation Tip */}
          <div className="shrink-0 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-[#8A8A96]">
            <span>Press ↑ ↓ to preview · Enter to select</span>
            <span>ESC to close</span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* RIGHT PANE: Ambient Blue Gradient Art & Live Market Stats     */}
        {/* ============================================================== */}
        <div className="relative hidden sm:block sm:w-1/2 h-full overflow-hidden select-none">
          <GradientArt
            variant="sapphire"
            backgroundImage="/images/blue-ambient.png"
            className="h-full w-full"
          >
            {/* Top-level Floating Close Button on Right Panel */}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="absolute top-5 right-5 size-8 items-center justify-center rounded-full bg-black/40 hover:bg-black/60 border border-white/20 text-white transition-colors cursor-pointer z-30"
              aria-label="Close modal"
            >
              <X className="size-4" />
            </button>

            {/* Inner Content Card with Frosted Dark Overlay for Crisp Contrast */}
            <div className="relative z-10 h-full w-full p-6 sm:p-8 flex flex-col justify-between overflow-y-auto no-scrollbar bg-gradient-to-b from-black/40 via-black/30 to-black/70">
              {/* Top Status Bar: Mode chip + QUANTIN • LIVE */}
              <div className="flex items-center justify-between shrink-0">
                <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-mono text-[11px] font-medium tracking-wide">
                  {type === "perps" ? "PERPETUAL FUTURES · 50×" : "HYPERLIQUID L1 SPOT · ZERO GAS"}
                </span>

                <div className="flex items-center gap-2 pr-9">
                  <span className="font-display font-black text-[13px] tracking-wider text-white">
                    GODCANDLE
                  </span>
                  <span className="size-2 rounded-full bg-[#60A5FA] shadow-[0_0_10px_#60A5FA] animate-pulse" />
                </div>
              </div>

              {/* Headline Asset Summary: Symbol, Name, Huge Price, 24h Pill */}
              <div className="space-y-1.5 my-auto py-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-[26px] font-black tracking-tight text-white drop-shadow-md">
                    {previewItem.symbol}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white/90 text-[11px] font-mono">
                    {previewItem.category}
                  </span>
                </div>
                <p className="text-[13px] font-medium text-white/80">{previewItem.name} Market</p>

                {/* Big Live Price */}
                <div className="flex items-baseline gap-3 pt-1">
                  <span className="text-[32px] font-bold font-mono tracking-tight text-white drop-shadow-lg tabular-nums">
                    {previewItem.priceFormatted}
                  </span>
                  <span
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-mono font-bold backdrop-blur-md border",
                      previewItem.isUp
                        ? "bg-[#3DDC97]/25 text-[#3DDC97] border-[#3DDC97]/40 shadow-[0_0_12px_rgba(61,220,151,0.3)]"
                        : "bg-[#FF5C6C]/25 text-[#FF5C6C] border-[#FF5C6C]/40 shadow-[0_0_12px_rgba(255,92,108,0.3)]",
                    )}
                  >
                    {previewItem.isUp ? (
                      <TrendingUp className="size-3.5" />
                    ) : (
                      <TrendingDown className="size-3.5" />
                    )}
                    <span>{previewItem.change24h}</span>
                  </span>
                </div>

                {/* 24h High/Low Range Bar */}
                <div className="pt-2 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono text-white/70">
                    <span>24h Low: {previewItem.low24h}</span>
                    <span>24h High: {previewItem.high24h}</span>
                  </div>
                  <div className="relative h-2 w-full rounded-full bg-black/40 border border-white/10 overflow-hidden">
                    <div
                      className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-[#2563EB] to-[#60A5FA] rounded-full transition-all duration-300"
                      style={{ width: `${rangePercent}%` }}
                    />
                  </div>
                </div>

                {/* Market Intelligence Grid (6 metrics tailored for Perps or Spot) */}
                <div className="grid grid-cols-2 gap-2.5 pt-3">
                  {type === "perps" ? (
                    <>
                      {/* Metric 1: Mark & Index */}
                      <div className="p-2.5 rounded-[14px] bg-black/40 backdrop-blur-md border border-white/10 text-left">
                        <span className="text-[11px] text-white/60 font-mono block">
                          Mark / Index Price
                        </span>
                        <span className="text-[13px] font-mono font-bold text-white tabular-nums">
                          ${previewItem.markPrice?.toLocaleString()} / $
                          {previewItem.indexPrice?.toLocaleString()}
                        </span>
                      </div>

                      {/* Metric 2: 24h Volume */}
                      <div className="p-2.5 rounded-[14px] bg-black/40 backdrop-blur-md border border-white/10 text-left">
                        <span className="text-[11px] text-white/60 font-mono block">
                          24h Volume
                        </span>
                        <span className="text-[13px] font-mono font-bold text-white tabular-nums">
                          {previewItem.volume24h}
                        </span>
                      </div>

                      {/* Metric 3: Open Interest */}
                      <div className="p-2.5 rounded-[14px] bg-black/40 backdrop-blur-md border border-white/10 text-left">
                        <span className="text-[11px] text-white/60 font-mono block">
                          Open Interest (OI)
                        </span>
                        <span className="text-[13px] font-mono font-bold text-white tabular-nums">
                          {previewItem.oi}
                        </span>
                      </div>

                      {/* Metric 4: Funding & Countdown */}
                      <div className="p-2.5 rounded-[14px] bg-black/40 backdrop-blur-md border border-white/10 text-left">
                        <span className="text-[11px] text-white/60 font-mono block">
                          Funding Rate
                        </span>
                        <span className="text-[13px] font-mono font-bold text-emerald-400 tabular-nums">
                          {previewItem.funding}{" "}
                          <span className="text-[11px] text-white/60 font-normal">
                            ({previewItem.fundingCountdown})
                          </span>
                        </span>
                      </div>

                      {/* Metric 5: Long / Short Ratio */}
                      <div className="p-2.5 rounded-[14px] bg-black/40 backdrop-blur-md border border-white/10 text-left col-span-2">
                        <div className="flex items-center justify-between text-[11px] font-mono text-white/70 mb-1">
                          <span>Long / Short Lean:</span>
                          <span className="font-bold text-white">
                            {previewItem.longRatio}% Long · {100 - (previewItem.longRatio || 50)}%
                            Short
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-[#FF5C6C] overflow-hidden flex">
                          <div
                            className="h-full bg-[#3DDC97]"
                            style={{ width: `${previewItem.longRatio || 50}%` }}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Spot Metric 1: Orderbook Spread */}
                      <div className="p-2.5 rounded-[14px] bg-black/40 backdrop-blur-md border border-white/10 text-left">
                        <span className="text-[11px] text-white/60 font-mono block">
                          Orderbook Spread
                        </span>
                        <span className="text-[13px] font-mono font-bold text-white tabular-nums">
                          {previewItem.spread}
                        </span>
                      </div>

                      {/* Spot Metric 2: 24h Volume */}
                      <div className="p-2.5 rounded-[14px] bg-black/40 backdrop-blur-md border border-white/10 text-left">
                        <span className="text-[11px] text-white/60 font-mono block">
                          24h Volume
                        </span>
                        <span className="text-[13px] font-mono font-bold text-white tabular-nums">
                          {previewItem.volume24h}
                        </span>
                      </div>

                      {/* Spot Metric 3: Liquidity Depth */}
                      <div className="p-2.5 rounded-[14px] bg-black/40 backdrop-blur-md border border-white/10 text-left">
                        <span className="text-[11px] text-white/60 font-mono block">
                          CLOB Liquidity Depth
                        </span>
                        <span className="text-[13px] font-mono font-bold text-white tabular-nums">
                          {previewItem.depth}
                        </span>
                      </div>

                      {/* Spot Metric 4: Platform Fee */}
                      <div className="p-2.5 rounded-[14px] bg-black/40 backdrop-blur-md border border-white/10 text-left">
                        <span className="text-[11px] text-white/60 font-mono block">
                          Platform Fee
                        </span>
                        <span className="text-[13px] font-mono font-bold text-white tabular-nums">
                          {previewItem.platformFee}
                        </span>
                      </div>

                      {/* Spot Metric 5: Gas & Settlement */}
                      <div className="p-2.5 rounded-[14px] bg-black/40 backdrop-blur-md border border-white/10 text-left col-span-2">
                        <div className="flex items-center justify-between text-[11px] font-mono text-white/80">
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="size-3.5 text-emerald-400" />
                            <span>Hyperliquid L1 Native Gas:</span>
                          </span>
                          <span className="font-bold text-emerald-400">{previewItem.gasFee}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Primary Action Button (Vibrant Electric Blue Pill) */}
              <div className="shrink-0 pt-3">
                <button
                  type="button"
                  onClick={() => handleConfirmSelect(previewItem.symbol)}
                  className="w-full h-[52px] rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-[15px] shadow-[0_8px_28px_-8px_rgba(37,99,235,0.7)] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <Zap className="size-4.5" />
                  <span>
                    {type === "perps"
                      ? `Select & Trade ${previewItem.symbol}`
                      : `Select Pair ${previewItem.symbol}`}
                  </span>
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          </GradientArt>
        </div>
      </div>
    </div>,
    document.body,
  );
}
