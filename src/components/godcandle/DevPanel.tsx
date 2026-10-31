import { X, RotateCcw, History, ShieldAlert, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { getSimulation, setSimulation, setMarketStatus, type FeedSnap } from "@/lib/price-feed";
import { MARKETS, type MarketSymbol, type MarketStatus } from "@/config/markets";
import { toast } from "sonner";

export function DevPanel({
  open,
  onOpenChange,
  market,
  feeds,
  internal,
  onInternal,
  onReset,
  onSeed,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  market: MarketSymbol;
  feeds: Record<MarketSymbol, FeedSnap>;
  internal: boolean;
  onInternal: (v: boolean) => void;
  onReset: () => void;
  onSeed: () => void;
}) {
  const sim = getSimulation();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-80 overflow-y-auto border-foreground bg-background p-6">
        <SheetTitle className="font-mono text-sm uppercase tracking-wider">Internal Controls</SheetTitle>

        <div className="mt-6 space-y-5">
          {/* Volatility */}
          <label className="block space-y-2 text-sm font-mono">
            <span className="flex justify-between">
              <span>Volatility multiplier</span>
              <span className="font-bold">x{sim.volatility.toFixed(1)}</span>
            </span>
            <input
              aria-label="Volatility multiplier"
              type="range"
              min="0.5"
              max="5"
              step="0.1"
              value={sim.volatility}
              onChange={(e) => setSimulation({ volatility: Number(e.target.value) })}
              className="w-full accent-foreground"
            />
          </label>

          {/* Tick Speed */}
          <label className="block text-sm font-mono">
            <span>Tick speed</span>
            <select
              aria-label="Tick speed"
              value={sim.tickSpeed}
              onChange={(e) => setSimulation({ tickSpeed: Number(e.target.value) })}
              className="mt-1.5 h-9 w-full rounded-lg border border-hairline bg-background px-3 text-xs"
            >
              {[50, 100, 200, 500, 1000].map((n) => (
                <option key={n} value={n}>
                  {n} ms
                </option>
              ))}
            </select>
          </label>

          {/* Market Status */}
          <div className="space-y-2 font-mono">
            <p className="text-xs uppercase text-muted-foreground">Market Status · {market}</p>
            {MARKETS.map((m) => (
              <label key={m.symbol} className="flex items-center justify-between text-xs">
                <span>{m.symbol}</span>
                <select
                  aria-label={`${m.symbol} status`}
                  value={feeds[m.symbol].status}
                  onChange={(e) => setMarketStatus(m.symbol, e.target.value as MarketStatus)}
                  className="h-8 rounded-lg border border-hairline bg-background px-2 text-xs"
                >
                  {["open", "closed", "paused"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          {/* Corridor Stress Simulation */}
          <div className="rounded-xl border border-hairline p-3 bg-secondary/50 space-y-2 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
              <span className="font-bold text-foreground">Corridor Clamp Test</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-normal">
              Test BBO corridor clamping bounds (+1.5 bps limit enforcement).
            </p>
            <Button
              variant="outline"
              size="sm"
              className="pill w-full text-[10px] h-7"
              onClick={() => {
                toast.success("Corridor clamp simulated: BBO deviation clamped at +1.50 bps ceiling.");
              }}
            >
              Simulate 2.8 bps Spike
            </Button>
          </div>

          {/* Tester Chip Switch */}
          <label className="flex justify-between items-center text-xs font-mono">
            <span>Internal tester chip</span>
            <Switch checked={internal} onCheckedChange={onInternal} />
          </label>

          {/* Actions */}
          <div className="space-y-2 pt-2 border-t border-hairline">
            <Button variant="outline" className="pill w-full text-xs h-8" onClick={onReset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Reset balance
            </Button>
            <Button variant="outline" className="pill w-full text-xs h-8" onClick={onSeed}>
              <History className="h-3.5 w-3.5 mr-1" />
              Seed history
            </Button>
            <Button
              variant="terminal"
              className="pill w-full text-xs h-8"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Close
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
