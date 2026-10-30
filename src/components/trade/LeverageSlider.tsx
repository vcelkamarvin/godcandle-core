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
      <div className="flex items-center justify-between text-subtle">
        <span className="tracking-wider">DISCRETE LEVERAGE</span>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-bold text-accent tabular">{value}×</span>
          <span className="text-[10px] text-subtle">/ {maxLeverage}×</span>
        </div>
      </div>

      {/* Preset Chips */}
      <div className="grid grid-cols-6 gap-1.5">
        {availablePresets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            className={`py-1 text-center text-[11px] border transition-all ${
              value === preset
                ? 'border-accent bg-surface-elevated text-accent font-bold shadow-sm'
                : 'border-border text-subtle hover:text-accent hover:border-border-active'
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
          className="w-full accent-accent bg-border h-1.5 appearance-none cursor-pointer rounded-none"
        />
        <div className="flex justify-between text-[10px] text-subtle pt-1 font-mono">
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
