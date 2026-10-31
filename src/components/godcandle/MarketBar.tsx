import { useState, useEffect } from "react";
import { Search, Star, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MARKETS, getMarket, type MarketSymbol } from "@/config/markets";
import { useTrading } from "./TradingProvider";
import { MarketLogo } from "./MarketLogo";
import { fmtUsd } from "@/lib/engine";
import { cn } from "@/lib/utils";

const FILTERS = ["Favorites", "All", "1000x", "Gainers", "Losers"] as const;

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

  const change = (s: MarketSymbol) => {
    const feed = feeds[s];
    if (!feed || !feed.open24) return 0;
    return (feed.price / feed.open24 - 1) * 100;
  };

  const rows = MARKETS.filter((m) =>
    `${m.symbol} ${m.name}`.toLowerCase().includes(query.trim().toLowerCase())
  ).filter((m) => {
    if (filter === "Favorites") return favorites.includes(m.symbol);
    if (filter === "1000x") return m.maxLeverage === 1000;
    if (filter === "Gainers") return change(m.symbol) >= 0;
    if (filter === "Losers") return change(m.symbol) < 0;
    return true;
  });

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
          <MarketLogo symbol={market} />
          <span className="text-left">
            <span className="block text-xs font-semibold">{market}-USD</span>
            {!compact && (
              <span className="block text-[9px] opacity-60">
                Perp · up to {getMarket(market).maxLeverage}x
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
          className="relative w-[calc(100vw-32px)] sm:max-w-[660px] max-h-[85vh] rounded-3xl bg-card border border-border shadow-2xl p-4 sm:p-5 gap-3.5 flex flex-col overflow-hidden outline-none"
        >
          {/* Delicate Rainbow Top Bar */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#CDC3F0] via-[#FFDAC8] to-[#A0D4CA]" />
          <DialogTitle className="sr-only">Choose a market</DialogTitle>
          <DialogDescription className="sr-only">
            Search and select a trading market
          </DialogDescription>

          {/* Top Search Input Box (matching 01b Desktop — Market picker.svg) */}
          <div className="flex items-center gap-2.5 rounded-2xl border-2 border-foreground bg-white px-3.5 py-1 focus-within:ring-2 focus-within:ring-foreground/10 transition-all">
            <Search className="size-4 shrink-0 text-foreground" />
            <input
              autoFocus
              aria-label="Search markets"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 sm:h-11 w-full min-w-0 bg-transparent text-sm font-sans placeholder:text-muted-foreground outline-none"
              placeholder="Search markets"
            />
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
          <div className="flex items-center gap-1 rounded-full bg-secondary p-1 overflow-x-auto">
            {FILTERS.map((f) => (
              <Button
                key={f}
                variant="terminal"
                onClick={() => setFilter(f)}
                className={cn(
                  "pill h-8 flex-1 px-3 text-xs font-medium transition-all shrink-0 sm:shrink",
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
          <div className="grid grid-cols-[32px_1fr_80px_70px] sm:grid-cols-[36px_1fr_110px_80px_55px] items-center px-2 sm:px-3 text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
            <span />
            <span>Market</span>
            <span className="text-right">Price</span>
            <span className="text-right">24h</span>
            <span className="hidden sm:inline text-right">Max</span>
          </div>

          {/* Scrollable Market Rows */}
          <div className="overflow-y-auto max-h-[50vh] space-y-1.5 pr-1">
            {rows.map((m) => {
              const ch = change(m.symbol);
              const isSelected = m.symbol === market;
              const isFav = favorites.includes(m.symbol);

              return (
                <div
                  key={m.symbol}
                  onClick={() => {
                    onSelect(m.symbol);
                    setOpen(false);
                  }}
                  className={cn(
                    "grid grid-cols-[32px_1fr_80px_70px] sm:grid-cols-[36px_1fr_110px_80px_55px] items-center h-[52px] px-2 rounded-2xl border transition-all cursor-pointer group",
                    isSelected
                      ? "border-foreground bg-secondary font-medium shadow-xs"
                      : "border-transparent hover:border-border hover:bg-secondary/60"
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
                      "size-7 rounded-lg transition-colors",
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
                  <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 pr-1 sm:pr-2">
                    <div className="size-7 rounded-full bg-secondary flex items-center justify-center shrink-0 border border-border/40">
                      <MarketLogo symbol={m.symbol} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-foreground leading-tight">
                          {m.symbol}
                        </span>
                        {isSelected && (
                          <Check className="size-3 text-[#06964A] shrink-0" />
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
                      ${fmtUsd(feeds[m.symbol]?.price ?? 0, m.decimals)}
                    </span>
                  </div>

                  {/* 24h Change */}
                  <div className="text-right">
                    <span
                      className={cn(
                        "tabular text-[11px] font-semibold px-2 py-0.5 rounded-md inline-block",
                        ch >= 0
                          ? "bg-[#E3F8EC] text-[#06964A]"
                          : "bg-[#FFECEA] text-[#FF3B30]"
                      )}
                    >
                      {ch >= 0 ? "+" : ""}
                      {ch.toFixed(2)}%
                    </span>
                  </div>

                  {/* Max Leverage (pill badge matching SVG) */}
                  <div className="hidden sm:flex justify-end pr-1">
                    <span
                      className={cn(
                        "tabular text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold",
                        isSelected
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
              <div className="py-10 text-center">
                <p className="text-sm font-medium text-foreground">
                  No markets found
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  No markets match &ldquo;{query}&rdquo; {filter !== "All" && `in ${filter}`}
                </p>
                {filter !== "All" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilter("All")}
                    className="mt-3 text-xs underline text-muted-foreground hover:text-foreground"
                  >
                    View all markets
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}