export function CandleGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 20" className={className} aria-hidden>
      <rect x="5.25" y="0" width="1.5" height="20" rx="0.75" fill="currentColor" />
      <rect x="1.5" y="4.5" width="9" height="11" rx="2" fill="currentColor" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="inline-flex items-center gap-2 text-foreground">
      <CandleGlyph className="h-5 w-3" />
      <span className="tight text-[22px] font-medium leading-none">godcandle</span>
    </span>
  );
}

export function LiqBar({ health }: { health: number }) {
  const danger = health < 0.25;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full rounded-full transition-[width] duration-200 ${danger ? "animate-liq-pulse bg-loss" : health < 0.5 ? "bg-loss" : "bg-foreground"}`}
        style={{ width: `${Math.max(2, health * 100)}%` }}
      />
    </div>
  );
}
