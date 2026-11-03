import { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  Star,
  ChevronDown,
  Check,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Zap,
  Activity,
  Layers,
  ShieldCheck,
  X,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MARKETS, getMarket, type MarketSymbol, type Market } from "@/config/markets";
import { useTrading } from "./TradingProvider";
import { MarketLogo } from "./MarketLogo";
import { fmtUsd } from "@/lib/engine";
import { cn } from "@/lib/utils";

const FILTERS = ["Favorites", "Majors", "Memes", "New", "All"] as const;

const VOLUMES_24H: Record<MarketSymbol, string> = {
  BTC: "$1.84B",
  ETH: "$924.5M",
  SOL: "$412.8M",
  HYPE: "$168.2M",
  SPX: "$3.42B",
  DOGE: "$84.6M",
};

const VOLUME_NUMERIC: Record<MarketSymbol, number> = {
  BTC: 1840000000,
  ETH: 924500000,
  SOL: 412800000,
  HYPE: 168200000,
  SPX: 3420000000,
  DOGE: 84600000,
};

const OPEN_INTERESTS: Record<MarketSymbol, string> = {
  BTC: "$2.1B",
  ETH: "$980M",
  SOL: "$340M",
  HYPE: "$85M",
  SPX: "$1.4B",
  DOGE: "$42M",
};

const OI_NUMERIC: Record<MarketSymbol, number> = {
  BTC: 2100000000,
  ETH: 980000000,
  SOL: 340000000,
  HYPE: 85000000,
  SPX: 1400000000,
  DOGE: 42000000,
};

const FUNDING_RATES: Record<MarketSymbol, string> = {
  BTC: "+0.0100% / 1h",
  ETH: "+0.0085% / 1h",
  SOL: "+0.0125% / 1h",
  HYPE: "+0.0150% / 1h",
  SPX: "+0.0050% / 1h",
  DOGE: "+0.0100% / 1h",
};

export interface MarketBarProps {
  market: MarketSymbol;
  onSelect: (s: MarketSymbol) => void;
  compact?: boolean;
  price?: number;
  open24h?: number;
  corridorBps?: number;
  showReset?: boolean;
  resetLabel?: string;
  onReset?: () => void;
}

type SortCol = 'symbol' | 'price' | 'change' | 'volume' | 'oi' | 'funding' | 'maxLev';

export function MarketBar({
  market,
  onSelect,
  compact = false,
  price: propPrice,
  open24h: propOpen24h,
  corridorBps,
  showReset = false,
  resetLabel = "Reset ($10k)",
  onReset,
}: MarketBarProps) {
  const trading = useTrading();
  const feeds = trading.feeds;
  const is1000x = trading.mode === "paper1000x";
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [sortCol, setSortCol] = useState<SortCol>('volume');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [recents, setRecents] = useState<MarketSymbol[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("godcandle_recent_markets");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return ["BTC", "ETH", "SOL"];
  });
  const [favorites, setFavorites] = useState<MarketSymbol[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("godcandle_favorite_markets");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return ["BTC", "ETH", "HYPE"];
  });
  const [previewSymbol, setPreviewSymbol] = useState<MarketSymbol>(market);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("godcandle_favorite_markets", JSON.stringify(favorites));
      } catch {}
    }
  }, [favorites]);

  const handleSelectMarket = (sym: MarketSymbol) => {
    const updated = [sym, ...recents.filter((s) => s !== sym)].slice(0, 5);
    setRecents(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("godcandle_recent_markets", JSON.stringify(updated));
      } catch {}
    }
    onSelect(sym);
    setOpen(false);
  };

  const toggleSort = (col: SortCol) => {
    if (sortCol === col) {
      setSortAsc((prev) => !prev);
    } else {
      setSortCol(col);
      setSortAsc(false);
    }
  };

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Reset state on open
  useEffect(() => {
    if (open) {
      setPreviewSymbol(market);
      setQuery("");
      setFilter("All");
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [open, market]);

  const change = (s: MarketSymbol) => {
    const feed = feeds[s];
    if (!feed || !feed.open24) return 0;
    return (feed.price / feed.open24 - 1) * 100;
  };

  const rows = useMemo(() => {
    const filtered = MARKETS.filter((m) =>
      `${m.symbol} ${m.name}`.toLowerCase().includes(query.trim().toLowerCase())
    ).filter((m) => {
      if (filter === "Favorites") return favorites.includes(m.symbol);
      if (filter === "Majors") return ["BTC", "ETH", "SOL", "SPX"].includes(m.symbol);
      if (filter === "Memes") return ["DOGE"].includes(m.symbol);
      if (filter === "New") return ["HYPE"].includes(m.symbol);
      return true;
    });

    return filtered.sort((a, b) => {
      let diff = 0;
      if (sortCol === 'symbol') diff = a.symbol.localeCompare(b.symbol);
      else if (sortCol === 'price') diff = (feeds[a.symbol]?.price || a.basePrice) - (feeds[b.symbol]?.price || b.basePrice);
      else if (sortCol === 'change') diff = change(a.symbol) - change(b.symbol);
      else if (sortCol === 'volume') diff = (VOLUME_NUMERIC[a.symbol] || 0) - (VOLUME_NUMERIC[b.symbol] || 0);
      else if (sortCol === 'oi') diff = (OI_NUMERIC[a.symbol] || 0) - (OI_NUMERIC[b.symbol] || 0);
      else if (sortCol === 'funding') diff = a.symbol.localeCompare(b.symbol);
      else if (sortCol === 'maxLev') diff = a.maxLeverage - b.maxLeverage;
      return sortAsc ? diff : -diff;
    });
  }, [query, filter, favorites, feeds, sortCol, sortAsc]);

  // Current previewed market fallback
  const previewMarket: Market = useMemo(() => {
    const found = rows.find((r) => r.symbol === previewSymbol);
    if (found) return found;
    if (rows.length > 0) return rows[0]!;
    return getMarket(market);
  }, [rows, previewSymbol, market]);

  // Keyboard navigation through filtered rows
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (rows.length === 0) return;
    const currentIndex = rows.findIndex((r) => r.symbol === previewMarket.symbol);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIdx = (currentIndex + 1) % rows.length;
      setPreviewSymbol(rows[nextIdx]!.symbol);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevIdx = (currentIndex - 1 + rows.length) % rows.length;
      setPreviewSymbol(rows[prevIdx]!.symbol);
    } else if (e.key === "Enter") {
      e.preventDefault();
      onSelect(previewMarket.symbol);
      setOpen(false);
    }
  };

  // Preview item calculations
  const previewFeed = feeds[previewMarket.symbol];
  const previewPrice = previewFeed?.price ?? previewMarket.basePrice;
  const previewOpen = previewFeed?.open24 ?? previewPrice * 0.985;
  const previewChange = ((previewPrice / previewOpen) - 1) * 100;
  const previewLow = Math.min(previewPrice, previewOpen) * 0.985;
  const previewHigh = Math.max(previewPrice, previewOpen) * 1.015;
  const previewRangeSpan = Math.max(0.0001, previewHigh - previewLow);
  const previewRangeOffset = Math.max(0, previewPrice - previewLow);
  const previewRangePercent = Math.min(100, Math.max(0, (previewRangeOffset / previewRangeSpan) * 100));

  // Active market metrics
  const activeFeed = feeds[market];
  const activePrice = propPrice ?? activeFeed?.price ?? getMarket(market).basePrice;
  const activeOpen = propOpen24h ?? activeFeed?.open24 ?? activePrice * 0.985;
  const activeChange = activeOpen ? ((activePrice - activeOpen) / activeOpen) * 100 : 0;
  const isPositive = activeChange >= 0;

  // Real-time market telemetry (Hyperliquid style)
  const markPx = activePrice * (1 + 0.00005);
  const midPx = activePrice;
  const high24h = activeOpen ? Math.max(activePrice, activeOpen) * 1.012 : activePrice * 1.012;
  const low24h = activeOpen ? Math.min(activePrice, activeOpen) * 0.988 : activePrice * 0.988;
  const volume24h = VOLUMES_24H[market] || "$100.0M";
  const fundingRate = FUNDING_RATES[market] || "+0.0100% / 1h";

  return (
    <>
      <nav
        aria-label="Markets"
        className="relative overflow-hidden rounded-2xl border border-border bg-white shadow-xs"
      >
        {/* Subtle iridescent top highlight */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#CDC3F0] via-[#FFDAC8] to-[#A0D4CA] opacity-80" />

        <div className="flex items-center justify-between gap-3 px-3.5 py-2 sm:px-4.5 overflow-x-auto no-scrollbar">
          {/* Left: Unified Pair Selector Dropdown + Live Price + Telemetry Stats */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* The single, professional Market Selector Dropdown */}
            <Button
              variant="terminal"
              onClick={() => setOpen(true)}
              aria-label="Choose market"
              className="pill pill-ink h-9.5 shrink-0 rounded-xl px-3 gap-2 hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
            >
              <MarketLogo symbol={market} size={18} />
              <div className="flex items-center gap-1.5 text-left">
                <span className="text-xs font-bold tracking-tight">{market}-USD</span>
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-xs font-mono font-bold uppercase",
                    is1000x
                      ? "bg-[#FFD60A]/20 border border-[#FFD60A]/40 text-[#FFD60A]"
                      : "bg-white/20 border border-white/30 text-white"
                  )}
                >
                  {is1000x ? "1000X" : "PERP"}
                </span>
              </div>
              <ChevronDown className="size-3.5 opacity-60 ml-0.5" />
            </Button>

            {/* Current Price & 24h Change */}
            <div className="flex items-baseline gap-2 pl-2 border-l border-border/70">
              <span className="tabular text-sm sm:text-base font-bold font-mono tracking-tight text-foreground">
                ${fmtUsd(activePrice, getMarket(market).decimals)}
              </span>
              <span
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-semibold",
                  isPositive ? "bg-[#E3F8EC] text-[#06964A]" : "bg-[#FFECEA] text-[#FF3B30]"
                )}
              >
                {isPositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                <span>
                  {isPositive ? "+" : ""}
                  {activeChange.toFixed(2)}%
                </span>
              </span>
            </div>

            {/* Inline Market Telemetry: Clean Minimalist Strip */}
            <div className="hidden md:flex items-center gap-3 lg:gap-4 text-xs font-mono pl-3 border-l border-border/70 text-foreground select-none">
              <div className="hidden lg:block" title={`Oracle / Index: $${fmtUsd(midPx, getMarket(market).decimals)}`}>
                <span className="block text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Mark</span>
                <span className="tabular font-semibold text-foreground text-xs">
                  ${fmtUsd(markPx, getMarket(market).decimals)}
                </span>
              </div>
              <div className="hidden xl:block">
                <span className="block text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Index</span>
                <span className="tabular font-semibold text-foreground text-xs">
                  ${fmtUsd(midPx, getMarket(market).decimals)}
                </span>
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Funding</span>
                <span className="tabular font-semibold text-[#06964A] text-xs">
                  {fundingRate.replace(' / 1h', '')} <span className="text-[10px] text-muted-foreground font-normal">({Math.floor(60 - (Date.now() / 60000) % 60)}m)</span>
                </span>
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-muted-foreground font-medium">24h Vol</span>
                <span className="tabular font-semibold text-foreground text-xs">{volume24h}</span>
              </div>
              <div className="hidden lg:block">
                <span className="block text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Open Interest</span>
                <span className="tabular font-semibold text-foreground text-xs">{OPEN_INTERESTS[market] || "$120M"}</span>
              </div>
              <div className="hidden xl:block">
                <span className="block text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Max Leverage</span>
                <span className="tabular font-semibold text-foreground text-xs">
                  {is1000x ? '1000×' : `${getMarket(market).maxLeverage}×`}
                </span>
              </div>
              <div className="hidden 2xl:block">
                <span className="block text-[10px] uppercase tracking-wider text-muted-foreground font-medium">24h Low / High</span>
                <span className="tabular font-semibold text-foreground text-xs">
                  ${fmtUsd(low24h, 1)} / ${fmtUsd(high24h, 1)}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Search & Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="terminal"
              onClick={() => setOpen(true)}
              className="h-8.5 rounded-lg bg-secondary hover:bg-secondary/80 px-3 text-xs font-medium text-foreground gap-1.5 border border-border/60 transition-colors cursor-pointer"
            >
              <Search className="size-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="rounded bg-card border border-border px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
                ⌘K
              </kbd>
            </Button>

            {showReset && onReset && (
              <Button
                variant="terminal"
                onClick={onReset}
                className="h-8.5 rounded-lg bg-[#F6F6F4] hover:bg-[#EAEAE8] border border-border px-3 text-xs font-mono font-medium text-foreground hover:text-foreground gap-1.5 transition-colors cursor-pointer"
                title="Reset paper balance to $10,000 USDC"
              >
                <RotateCcw className="size-3.5" />
                <span>{resetLabel}</span>
              </Button>
            )}
          </div>
        </div>
      </nav>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          hideClose
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100vw-32px)] sm:max-w-[890px] h-[90vh] sm:h-[600px] rounded-3xl bg-white border border-border shadow-2xl p-0 gap-0 flex flex-col sm:flex-row overflow-hidden outline-none m-0"
          onKeyDown={handleKeyDown}
        >
          {/* Signature Delicate Rainbow Iridescent Top Bar */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#CDC3F0] via-[#FFDAC8] to-[#A0D4CA] z-30" />
          <DialogTitle className="sr-only">Choose a market</DialogTitle>
          <DialogDescription className="sr-only">
            Search and select a trading market
          </DialogDescription>

          {/* ============================================================== */}
          {/* LEFT PANE: Search, Categories, Scrollable Pair List (52%)      */}
          {/* ============================================================== */}
          <div className="flex-1 sm:w-[54%] h-full p-4 sm:p-5 flex flex-col justify-between overflow-hidden border-b sm:border-b-0 sm:border-r border-border">
            {/* Header & Search Bar */}
            <div className="shrink-0 space-y-3">
              {/* Search Input Box */}
              <div className="flex items-center gap-2.5 rounded-2xl border-2 border-foreground bg-white px-3.5 py-1 focus-within:ring-2 focus-within:ring-foreground/10 transition-all">
                <Search className="size-4 shrink-0 text-foreground" />
                <input
                  ref={searchInputRef}
                  autoFocus
                  aria-label="Search markets"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-10 sm:h-11 w-full min-w-0 bg-transparent text-sm font-sans placeholder:text-muted-foreground outline-none"
                  placeholder="Search markets (BTC, ETH, SOL...)"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                    aria-label="Clear query"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close dialog"
                  className="rounded-md bg-secondary border border-border px-2.5 py-1 text-xs font-mono font-medium text-muted-foreground shrink-0 hover:bg-secondary/80 hover:text-foreground cursor-pointer transition-colors"
                  title="Close (Esc)"
                >
                  Esc
                </button>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1 rounded-full bg-secondary p-1 overflow-x-auto no-scrollbar">
                {FILTERS.map((f) => (
                  <Button
                    key={f}
                    variant="terminal"
                    onClick={() => setFilter(f)}
                    className={cn(
                      "pill h-7.5 flex-1 px-3 text-xs font-medium transition-all shrink-0 sm:shrink cursor-pointer",
                      filter === f
                        ? "pill-ink shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/60"
                    )}
                  >
                    {f === "Favorites" && (
                      <Star
                        className="size-3 mr-1"
                        fill={filter === f ? "currentColor" : "none"}
                      />
                    )}
                    {f}
                  </Button>
                ))}
              </div>

              {/* Recents strip */}
              {recents.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground px-1 overflow-x-auto no-scrollbar">
                  <span className="uppercase text-xs font-bold text-muted-foreground/70 shrink-0">Recents:</span>
                  {recents.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleSelectMarket(r)}
                      className="px-2 py-0.5 rounded-md bg-secondary hover:bg-secondary/80 text-foreground font-semibold cursor-pointer border border-border/50 shrink-0"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}

              {/* Table Column Labels with Click-to-Sort */}
              <div className="grid grid-cols-[24px_1fr_75px_60px] md:grid-cols-[24px_85px_75px_60px_65px_60px_65px_45px] items-center px-2 text-xs uppercase font-mono tracking-wider text-muted-foreground select-none">
                <span />
                <button
                  type="button"
                  onClick={() => toggleSort('symbol')}
                  className="text-left hover:text-foreground cursor-pointer flex items-center gap-0.5"
                >
                  <span>Symbol</span>
                  {sortCol === 'symbol' && <span>{sortAsc ? '↑' : '↓'}</span>}
                </button>
                <button
                  type="button"
                  onClick={() => toggleSort('price')}
                  className="text-right hover:text-foreground cursor-pointer flex items-center justify-end gap-0.5"
                >
                  <span>Price</span>
                  {sortCol === 'price' && <span>{sortAsc ? '↑' : '↓'}</span>}
                </button>
                <button
                  type="button"
                  onClick={() => toggleSort('change')}
                  className="text-right hover:text-foreground cursor-pointer flex items-center justify-end gap-0.5"
                >
                  <span>24h%</span>
                  {sortCol === 'change' && <span>{sortAsc ? '↑' : '↓'}</span>}
                </button>
                <button
                  type="button"
                  onClick={() => toggleSort('volume')}
                  className="hidden md:flex text-right hover:text-foreground cursor-pointer items-center justify-end gap-0.5"
                >
                  <span>Vol</span>
                  {sortCol === 'volume' && <span>{sortAsc ? '↑' : '↓'}</span>}
                </button>
                <button
                  type="button"
                  onClick={() => toggleSort('oi')}
                  className="hidden md:flex text-right hover:text-foreground cursor-pointer items-center justify-end gap-0.5"
                >
                  <span>OI</span>
                  {sortCol === 'oi' && <span>{sortAsc ? '↑' : '↓'}</span>}
                </button>
                <button
                  type="button"
                  onClick={() => toggleSort('funding')}
                  className="hidden md:flex text-right hover:text-foreground cursor-pointer items-center justify-end gap-0.5"
                >
                  <span>Funding</span>
                  {sortCol === 'funding' && <span>{sortAsc ? '↑' : '↓'}</span>}
                </button>
                <button
                  type="button"
                  onClick={() => toggleSort('maxLev')}
                  className="hidden md:flex text-right hover:text-foreground cursor-pointer items-center justify-end gap-0.5"
                >
                  <span>Max</span>
                  {sortCol === 'maxLev' && <span>{sortAsc ? '↑' : '↓'}</span>}
                </button>
              </div>
            </div>

            {/* Scrollable Market Rows */}
            <div className="flex-1 overflow-y-auto space-y-1 my-2 pr-1 min-h-0 no-scrollbar">
              {rows.map((m) => {
                const ch = change(m.symbol);
                const isSelected = m.symbol === market;
                const isPreviewed = m.symbol === previewMarket.symbol;
                const isFav = favorites.includes(m.symbol);

                return (
                  <div
                    key={m.symbol}
                    onMouseEnter={() => setPreviewSymbol(m.symbol)}
                    onClick={() => handleSelectMarket(m.symbol)}
                    className={cn(
                      "grid grid-cols-[24px_1fr_75px_60px] md:grid-cols-[24px_85px_75px_60px_65px_60px_65px_45px] items-center h-[48px] px-2 rounded-xl border transition-all cursor-pointer group select-none font-mono text-xs",
                      isPreviewed
                        ? "border-foreground bg-secondary font-medium shadow-xs ring-1 ring-foreground/15"
                        : "border-transparent hover:border-border hover:bg-secondary/50"
                    )}
                  >
                    {/* Star Favorite Button */}
                    <Button
                      variant="terminal"
                      size="icon"
                      aria-label={`Favorite ${m.symbol}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFavorites((a) =>
                          a.includes(m.symbol)
                            ? a.filter((s) => s !== m.symbol)
                            : [...a, m.symbol]
                        );
                      }}
                      className={cn(
                        "size-6 rounded transition-colors cursor-pointer",
                        isFav
                          ? "text-[#FFD60A]"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Star
                        className="size-3"
                        fill={isFav ? "currentColor" : "none"}
                      />
                    </Button>

                    {/* Market logo, symbol and name */}
                    <div className="flex items-center gap-1.5 min-w-0 pr-1">
                      <MarketLogo symbol={m.symbol} size={18} />
                      <div className="min-w-0">
                        <span className="font-bold text-foreground font-sans block leading-tight text-xs">
                          {m.symbol}
                        </span>
                        <span className="block text-xs text-muted-foreground truncate leading-tight font-sans">
                          {m.name}
                        </span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <span className="tabular font-semibold text-foreground">
                        ${fmtUsd(feeds[m.symbol]?.price ?? m.basePrice, m.decimals)}
                      </span>
                    </div>

                    {/* 24h Change */}
                    <div className="text-right">
                      <span
                        className={cn(
                          "tabular text-xs font-semibold px-1 py-0.2 rounded-md inline-block",
                          ch >= 0
                            ? "bg-[#E3F8EC] text-[#06964A]"
                            : "bg-[#FFECEA] text-[#FF3B30]"
                        )}
                      >
                        {ch >= 0 ? "+" : ""}
                        {ch.toFixed(1)}%
                      </span>
                    </div>

                    {/* Volume */}
                    <div className="hidden md:block text-right text-muted-foreground">
                      {VOLUMES_24H[m.symbol] || '$50M'}
                    </div>

                    {/* OI */}
                    <div className="hidden md:block text-right text-muted-foreground">
                      {OPEN_INTERESTS[m.symbol] || '$20M'}
                    </div>

                    {/* Funding */}
                    <div className="hidden md:block text-right text-[#06964A] font-medium text-xs">
                      {FUNDING_RATES[m.symbol]?.replace(' / 1h', '') || '0.01%'}
                    </div>

                    {/* Max Leverage */}
                    <div className="hidden md:flex justify-end pr-0.5">
                      <span className="tabular font-bold text-foreground text-xs">
                        {m.maxLeverage}x
                      </span>
                    </div>
                  </div>
                );
              })}

              {!rows.length && (
                <div className="py-12 text-center text-muted-foreground space-y-2">
                  <Activity className="size-7 mx-auto opacity-40" />
                  <p className="text-xs font-medium text-foreground">No markets found</p>
                  <p className="text-xs">
                    No assets match &ldquo;{query}&rdquo; {filter !== "All" && `in ${filter}`}
                  </p>
                  {filter !== "All" && (
                    <button
                      type="button"
                      onClick={() => setFilter("All")}
                      className="text-xs text-foreground underline font-medium cursor-pointer"
                    >
                      View all markets
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Footer Navigation Tip */}
            <div className="shrink-0 pt-2 border-t border-border flex items-center justify-between text-xs font-mono text-muted-foreground">
              <span>Press ↑ ↓ to preview · Enter to select</span>
              <span>ESC to close</span>
            </div>
          </div>

          {/* ============================================================== */}
          {/* RIGHT PANE: Rich Detail Preview Card & Real-Time Stats (48%)   */}
          {/* ============================================================== */}
          <div className="hidden sm:flex sm:w-[46%] h-full bg-[#FBFBFA] p-5 sm:p-6 flex-col justify-between overflow-y-auto no-scrollbar select-none relative">
            {/* Top Close Button for the Modal */}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 size-7 flex items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 border border-border text-muted-foreground hover:text-foreground cursor-pointer transition-colors z-20"
              aria-label="Close dialog"
            >
              <X className="size-3.5" />
            </button>

            {/* Preview Card Inner */}
            <div className="space-y-4">
              {/* Header Status Bar */}
              <div className="flex items-center justify-between pr-8">
                <span className="rounded-full bg-white border border-border px-2.5 py-0.5 text-xs font-mono font-semibold tracking-wider uppercase text-muted-foreground shadow-2xs">
                  {previewMarket.maxLeverage === 1000 ? "1000x Synthetic Perp" : "Perpetual Futures"}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-mono font-medium text-[#06964A]">
                  <span className="size-1.5 rounded-full bg-[#00D964] animate-pulse" />
                  Live Feed
                </span>
              </div>

              {/* Headline Symbol, Name, and Large Logo */}
              <div className="flex items-center gap-3 pt-1">
                <MarketLogo symbol={previewMarket.symbol} size={38} />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-sans text-xl font-bold tracking-tight text-foreground">
                      {previewMarket.symbol}-USD
                    </h3>
                    <span className="rounded bg-foreground text-background px-2 py-0.5 text-xs font-mono font-bold">
                      {previewMarket.maxLeverage}x
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{previewMarket.name} Perpetual Market</p>
                </div>
              </div>

              {/* Big Live Price & 24h Change */}
              <div className="flex items-baseline gap-3 pt-1">
                <span className="tabular text-3xl font-bold font-mono tracking-tight text-foreground">
                  ${fmtUsd(previewPrice, previewMarket.decimals)}
                </span>
                <span
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border",
                    previewChange >= 0
                      ? "bg-[#E3F8EC] text-[#06964A] border-[#A0D4CA]/50"
                      : "bg-[#FFECEA] text-[#FF3B30] border-[#FFDAC8]/50"
                  )}
                >
                  {previewChange >= 0 ? (
                    <TrendingUp className="size-3.5" />
                  ) : (
                    <TrendingDown className="size-3.5" />
                  )}
                  <span>
                    {previewChange >= 0 ? "+" : ""}
                    {previewChange.toFixed(2)}%
                  </span>
                </span>
              </div>

              {/* 24h High/Low Range Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span>24h Low: ${fmtUsd(previewLow, previewMarket.decimals)}</span>
                  <span>24h High: ${fmtUsd(previewHigh, previewMarket.decimals)}</span>
                </div>
                <div className="relative h-2 w-full rounded-full bg-secondary border border-border/80 overflow-hidden">
                  <div
                    className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-[#CDC3F0] via-[#FFDAC8] to-[#A0D4CA] rounded-full transition-all duration-300"
                    style={{ width: `${previewRangePercent}%` }}
                  />
                </div>
              </div>

              {/* Market Intelligence Grid (6 key metrics) */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="p-2.5 rounded-xl bg-white border border-border shadow-2xs">
                  <span className="text-xs font-mono uppercase text-muted-foreground block font-medium">
                    24h Volume
                  </span>
                  <span className="text-xs font-mono font-semibold text-foreground">
                    {VOLUMES_24H[previewMarket.symbol]}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-border shadow-2xs">
                  <span className="text-xs font-mono uppercase text-muted-foreground block font-medium">
                    Funding Rate
                  </span>
                  <span className="text-xs font-mono font-semibold text-[#06964A]">
                    {FUNDING_RATES[previewMarket.symbol]}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-border shadow-2xs">
                  <span className="text-xs font-mono uppercase text-muted-foreground block font-medium">
                    Index Price
                  </span>
                  <span className="text-xs font-mono font-semibold text-foreground">
                    ${fmtUsd(previewPrice, previewMarket.decimals)}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-border shadow-2xs">
                  <span className="text-xs font-mono uppercase text-muted-foreground block font-medium">
                    Order Type
                  </span>
                  <span className="text-xs font-mono font-semibold text-[#06964A]">
                    Market / Limit
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-border shadow-2xs">
                  <span className="text-xs font-mono uppercase text-muted-foreground block font-medium">
                    Taker Fee
                  </span>
                  <span className="text-xs font-mono font-semibold text-foreground">
                    0.035%
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-border shadow-2xs">
                  <span className="text-xs font-mono uppercase text-muted-foreground block font-medium">
                    Settlement
                  </span>
                  <span className="text-xs font-mono font-semibold text-[#06964A]">
                    Instant Block FIFO
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Primary Confirm / Switch Button */}
            <div className="pt-4 border-t border-border">
              <Button
                variant="terminal"
                onClick={() => {
                  onSelect(previewMarket.symbol);
                  setOpen(false);
                }}
                className="pill pill-ink w-full h-11 text-xs font-semibold gap-2 shadow-sm hover:opacity-95 cursor-pointer"
              >
                <span>Switch to {previewMarket.symbol}-USD</span>
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}