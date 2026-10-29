export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center text-foreground ${className}`}>
      <span className="tight text-[22px] font-semibold leading-none tracking-tight">godcandle</span>
    </span>
  );
}

export function GradientPanel({ className = "", children }: { className?: string; children?: import("react").ReactNode }) {
  return <div className={`art-gradient grain relative overflow-hidden ${className}`}>{children}</div>;
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
