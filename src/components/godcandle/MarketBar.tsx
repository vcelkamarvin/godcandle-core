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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MARKETS, getMarket, type MarketSymbol, type Market } from "@/config/markets";
import { useTrading } from "./TradingProvider";
import { MarketLogo } from "./MarketLogo";
import { fmtUsd } from "@/lib/engine";
import { cn } from "@/lib/utils";

const FILTERS = ["Favorites", "All", "1000x", "Gainers", "Losers"] as const;

const VOLUMES_24H: Record<MarketSymbol, string> = {
  BTC: "$1.84B",
  ETH: "$924.5M",
  SOL: "$412.8M",
  HYPE: "$168.2M",
  SPX: "$3.42B",
  DOGE: "$84.6M",
};

const FUNDING_RATES: Record<MarketSymbol, string> = {
  BTC: "+0.0100% / 1h",
  ETH: "+0.0085% / 1h",
  SOL: "+0.0125% / 1h",
  HYPE: "+0.0150% / 1h",
  SPX: "+0.0050% / 1h",
  DOGE: "+0.0100% / 1h",
};

export function MarketBar({
  market,
  onSelect,
  compact = false,
}: {
  market: MarketSymbol;
  onSelect: (s: MarketSymbol) => void;
  compact?: boolean;
}) {
  const { feeds } = useTrading();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [favorites, setFavorites] = useState<MarketSymbol[]>(["BTC", "ETH", "HYPE"]);
  const [previewSymbol, setPreviewSymbol] = useState<MarketSymbol>(market);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
    return MARKETS.filter((m) =>
      `${m.symbol} ${m.name}`.toLowerCase().includes(query.trim().toLowerCase())
    ).filter((m) => {
      if (filter === "Favorites") return favorites.includes(m.symbol);
      if (filter === "1000x") return m.maxLeverage === 1000;
      if (filter === "Gainers") return change(m.symbol) >= 0;
      if (filter === "Losers") return change(m.symbol) < 0;
      return true;
    });
  }, [query, filter, favorites, feeds]);

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

  return (
    <>
      <nav
        aria-label="Markets"
        className="flex items-center gap-2 overflow-x-auto border-b border-border bg-white px-5 py-2.5 lg:px-7"
      >
        {/* Active Market Button */}
        <Button
          variant="terminal"
          onClick={() => setOpen(true)}
          aria-label="Choose market"
          className="pill pill-ink h-11 shrink-0 rounded-xl px-3.5 gap-2.5 hover:opacity-90 transition-opacity"
        >
          <MarketLogo symbol={market} size={20} />
          <span className="text-left">
            <span className="block text-xs font-semibold">{market}-USD</span>
            {!compact && (
              <span className="block text-[9px] opacity-60">
                Perpetual
              </span>
            )}
          </span>
          <span className="tabular ml-1.5 text-xs font-semibold">
            ${fmtUsd(feeds[market]?.price ?? 0, getMarket(market).decimals)}
          </span>
          <ChevronDown className="size-3.5 opacity-60" />
        </Button>

        {/* Search Markets Button */}
        {!compact && (
          <Button
            variant="terminal"
            className="h-10 shrink-0 justify-start rounded-xl bg-secondary hover:bg-secondary/80 px-3.5 text-xs text-muted-foreground gap-2 border border-border/60 transition-colors"
            onClick={() => setOpen(true)}
          >
            <Search className="size-3.5 text-muted-foreground" />
            <span>Search markets</span>
            <kbd className="ml-8 rounded bg-card border border-border px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground">
              ⌘K
            </kbd>
          </Button>
        )}

        {/* Quick Market Ticker Buttons */}
        {MARKETS.filter((m) => m.symbol !== market).map((m) => {
          const ch = change(m.symbol);
          return (
            <Button
              key={m.symbol}
              variant="terminal"
              onClick={() => onSelect(m.symbol)}
              className="h-10 shrink-0 rounded-xl bg-secondary hover:bg-secondary/80 px-3.5 text-xs gap-2 border border-transparent hover:border-border transition-colors"
            >
              <MarketLogo symbol={m.symbol} size={15} />
              <span className="font-semibold text-foreground">{m.symbol}</span>
              <span
                className={`tabular text-[10px] font-semibold ${
                  ch >= 0 ? "text-gain" : "text-loss"
                }`}
              >
                {ch >= 0 ? "+" : ""}
                {ch.toFixed(2)}%
              </span>
            </Button>
          );
        })}
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
                  className="rounded-md bg-secondary border border-border px-2 py-0.5 text-[10px] font-mono font-medium text-muted-foreground shrink-0 hover:bg-secondary/80 hover:text-foreground cursor-pointer transition-colors"
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

              {/* Table Column Labels */}
              <div className="grid grid-cols-[30px_1fr_80px_65px] sm:grid-cols-[32px_1fr_95px_70px_50px] items-center px-2 text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
                <span />
                <span>Market</span>
                <span className="text-right">Price</span>
                <span className="text-right">24h</span>
                <span className="hidden sm:inline text-right">Max</span>
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
                    onClick={() => {
                      onSelect(m.symbol);
                      setOpen(false);
                    }}
                    className={cn(
                      "grid grid-cols-[30px_1fr_80px_65px] sm:grid-cols-[32px_1fr_95px_70px_50px] items-center h-[50px] px-2 rounded-2xl border transition-all cursor-pointer group select-none",
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
                        "size-7 rounded-lg transition-colors cursor-pointer",
                        isFav
                          ? "text-[#FFD60A]"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Star
                        className="size-3.5"
                        fill={isFav ? "currentColor" : "none"}
                      />
                    </Button>

                    {/* Market logo, symbol and name */}
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 pr-1">
                      <MarketLogo symbol={m.symbol} size={24} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-foreground leading-tight">
                            {m.symbol}
                          </span>
                          {isSelected && (
                            <span className="px-1.5 py-0.2 rounded bg-[#E3F8EC] text-[9px] font-mono font-bold text-[#06964A]">
                              Active
                            </span>
                          )}
                        </div>
                        <span className="block text-[10px] text-muted-foreground leading-tight truncate">
                          {m.name}
                        </span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <span className="tabular text-xs font-semibold text-foreground">
                        ${fmtUsd(feeds[m.symbol]?.price ?? m.basePrice, m.decimals)}
                      </span>
                    </div>

                    {/* 24h Change */}
                    <div className="text-right">
                      <span
                        className={cn(
                          "tabular text-[10px] font-semibold px-1.5 py-0.5 rounded-md inline-block",
                          ch >= 0
                            ? "bg-[#E3F8EC] text-[#06964A]"
                            : "bg-[#FFECEA] text-[#FF3B30]"
                        )}
                      >
                        {ch >= 0 ? "+" : ""}
                        {ch.toFixed(2)}%
                      </span>
                    </div>

                    {/* Max Leverage */}
                    <div className="hidden sm:flex justify-end pr-1">
                      <span
                        className={cn(
                          "tabular text-[10px] font-mono px-1.5 py-0.5 rounded-md font-semibold",
                          m.maxLeverage === 1000
                            ? "bg-foreground text-background"
                            : "bg-secondary text-foreground/80 font-medium"
                        )}
                      >
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
                  <p className="text-[11px]">
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
            <div className="shrink-0 pt-2 border-t border-border flex items-center justify-between text-[10px] font-mono text-muted-foreground">
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
                <span className="rounded-full bg-white border border-border px-2.5 py-0.5 text-[9px] font-mono font-semibold tracking-wider uppercase text-muted-foreground shadow-2xs">
                  {previewMarket.maxLeverage === 1000 ? "1000x Synthetic Perp" : "Perpetual Futures"}
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-mono font-medium text-[#06964A]">
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
                    <span className="rounded bg-foreground text-background px-1.5 py-0.2 text-[9px] font-mono font-bold">
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
                <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
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
                  <span className="text-[9px] font-mono uppercase text-muted-foreground block">
                    24h Volume
                  </span>
                  <span className="text-xs font-mono font-semibold text-foreground">
                    {VOLUMES_24H[previewMarket.symbol]}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-border shadow-2xs">
                  <span className="text-[9px] font-mono uppercase text-muted-foreground block">
                    Funding Rate
                  </span>
                  <span className="text-xs font-mono font-semibold text-[#06964A]">
                    {FUNDING_RATES[previewMarket.symbol]}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-border shadow-2xs">
                  <span className="text-[9px] font-mono uppercase text-muted-foreground block">
                    Index Price
                  </span>
                  <span className="text-xs font-mono font-semibold text-foreground">
                    ${fmtUsd(previewPrice, previewMarket.decimals)}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-border shadow-2xs">
                  <span className="text-[9px] font-mono uppercase text-muted-foreground block">
                    Order Type
                  </span>
                  <span className="text-xs font-mono font-semibold text-[#06964A]">
                    Market / Limit
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-border shadow-2xs">
                  <span className="text-[9px] font-mono uppercase text-muted-foreground block">
                    Taker Fee
                  </span>
                  <span className="text-xs font-mono font-semibold text-foreground">
                    0.035%
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-border shadow-2xs">
                  <span className="text-[9px] font-mono uppercase text-muted-foreground block">
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