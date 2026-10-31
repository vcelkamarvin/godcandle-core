import React, { useMemo } from 'react';

interface LeverageSliderProps {
  value: number;
  onChange: (value: number) => void;
  maxLeverage?: number;
}

export function LeverageSlider({
  value,
  onChange,
  maxLeverage = 1000,
}: LeverageSliderProps) {
  // Generate presets dynamically based on maxLeverage
  const presets = useMemo(() => {
    if (maxLeverage >= 1000) {
      return [50, 100, 250, 500, 1000];
    }
    // Dynamic generation: 1x, ~10%, ~25%, ~50%, max
    const p1 = 1;
    const p2 = Math.max(2, Math.round(maxLeverage * 0.1));
    const p3 = Math.max(p2 + 1, Math.round(maxLeverage * 0.25));
    const p4 = Math.max(p3 + 1, Math.round(maxLeverage * 0.5));
    const p5 = maxLeverage;
    const set = Array.from(new Set([p1, p2, p3, p4, p5])).filter((x) => x <= maxLeverage);
    return set;
  }, [maxLeverage]);

  // Ensure current value does not exceed maxLeverage
  const clampedValue = Math.min(Math.max(value, 1), maxLeverage);

  return (
    <div className="space-y-3 font-mono text-xs">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="tracking-wider text-[11px]">DISCRETE LEVERAGE</span>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold text-foreground tabular">{clampedValue}×</span>
          <span className="text-[10px] text-muted-foreground">/ {maxLeverage}× max</span>
        </div>
      </div>

      {/* Preset Chips */}
      <div className={`grid gap-1.5`} style={{ gridTemplateColumns: `repeat(${presets.length}, minmax(0, 1fr))` }}>
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            className={`h-7 rounded-sm text-center text-xs font-mono font-medium transition-all ${
              clampedValue === preset
                ? 'bg-foreground text-background font-bold shadow-xs'
                : 'border border-border bg-[#F6F6F4] text-muted-foreground hover:text-foreground hover:bg-[#F0F0EE]'
            }`}
          >
            {preset}×
          </button>
        ))}
      </div>

      {/* Tactile Ruler Slider */}
      <div className="pt-2">
        <input
          type="range"
          min="1"
          max={maxLeverage}
          step="1"
          value={clampedValue}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-foreground bg-[#E6E6E3] h-1.5 appearance-none cursor-pointer rounded-xs"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground pt-1 font-mono">
          <span>1×</span>
          {maxLeverage >= 1000 ? (
            <>
              <span>100×</span>
              <span>250×</span>
              <span>500×</span>
              <span>1000×</span>
            </>
          ) : (
            <>
              <span>{Math.round(maxLeverage * 0.25)}×</span>
              <span>{Math.round(maxLeverage * 0.5)}×</span>
              <span>{maxLeverage}×</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
