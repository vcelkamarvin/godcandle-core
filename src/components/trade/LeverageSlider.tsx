import React from 'react';

interface LeverageSliderProps {
  value: number;
  onChange: (value: number) => void;
  maxLeverage?: number;
}

const PRESET_LEVERAGES = [10, 50, 100, 250, 500, 1000];

export function LeverageSlider({
  value,
  onChange,
  maxLeverage = 1000,
}: LeverageSliderProps) {
  const availablePresets = PRESET_LEVERAGES.filter((l) => l <= maxLeverage);

  return (
    <div className="space-y-3 font-mono text-xs">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="tracking-wider text-[11px]">DISCRETE LEVERAGE</span>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold text-foreground tabular">{value}×</span>
          <span className="text-[10px] text-muted-foreground">/ {maxLeverage}×</span>
        </div>
      </div>

      {/* Preset Chips */}
      <div className={`grid gap-1.5 ${availablePresets.length === 5 ? 'grid-cols-5' : 'grid-cols-6'}`}>
        {availablePresets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            className={`h-7 rounded-sm text-center text-xs font-mono font-medium transition-all ${
              value === preset
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
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-foreground bg-[#E6E6E3] h-1.5 appearance-none cursor-pointer rounded-xs"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground pt-1 font-mono">
          <span>1×</span>
          <span>100×</span>
          <span>250×</span>
          <span>500×</span>
          {maxLeverage === 1000 && <span>1000×</span>}
        </div>
      </div>
    </div>
  );
}
