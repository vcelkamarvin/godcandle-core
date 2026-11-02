import React, { useRef, useMemo, useEffect } from 'react';

interface LeverageRulerProps {
  value: number;
  onChange: (value: number) => void;
  maxLeverage?: number;
}

export function LeverageRuler({
  value,
  onChange,
  maxLeverage = 1000,
}: LeverageRulerProps) {
  const rulerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Clamped active leverage
  const clampedValue = Math.max(1, Math.min(maxLeverage, value));

  // Determine key ticks and labels based on maxLeverage
  const keyValues = useMemo(() => {
    if (maxLeverage >= 1000) return [100, 250, 500, 750, 1000];
    if (maxLeverage >= 500) return [50, 100, 250, 375, 500];
    if (maxLeverage >= 100) return [10, 25, 50, 75, 100];
    return [
      Math.max(1, Math.round(maxLeverage * 0.1)),
      Math.max(2, Math.round(maxLeverage * 0.25)),
      Math.max(3, Math.round(maxLeverage * 0.5)),
      Math.max(4, Math.round(maxLeverage * 0.75)),
      maxLeverage,
    ];
  }, [maxLeverage]);

  // Generate 41 ticks for clean visual ruler density
  const totalTicks = 41;
  const keyTickIndices = useMemo(() => {
    return new Set(
      keyValues.map((kv) => Math.round((kv / maxLeverage) * (totalTicks - 1)))
    );
  }, [keyValues, maxLeverage, totalTicks]);

  const ticks = useMemo(() => {
    const list = [];
    for (let i = 0; i < totalTicks; i++) {
      const pct = (i / (totalTicks - 1)) * 100;
      const tickLev = Math.max(1, Math.round((i / (totalTicks - 1)) * maxLeverage));
      const isKey = keyTickIndices.has(i);
      list.push({ index: i, pct, tickLev, isKey });
    }
    return list;
  }, [totalTicks, maxLeverage, keyTickIndices]);

  // Standard presets matching reference: 10x, 50x, 100x, 250x, 500x, 1000x
  const presets = useMemo(() => {
    const defaultList = [10, 50, 100, 250, 500, 1000];
    const filtered = defaultList.filter((l) => l <= maxLeverage);
    if (filtered.length === 0 || (filtered[filtered.length - 1] !== maxLeverage && maxLeverage > 10)) {
      filtered.push(maxLeverage);
    }
    return Array.from(new Set(filtered));
  }, [maxLeverage]);

  const updateFromClientX = (clientX: number) => {
    const targetRef = trackRef.current || rulerRef.current;
    if (!targetRef) return;
    const rect = targetRef.getBoundingClientRect();
    const rawPct = (clientX - rect.left) / rect.width;
    const clampedPct = Math.max(0, Math.min(1, rawPct));
    const newLev = Math.max(1, Math.round(clampedPct * maxLeverage));
    onChange(newLev);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    try {
      target.setPointerCapture(e.pointerId);
    } catch {
      // ignore if pointer capture not supported
    }

    updateFromClientX(e.clientX);

    const handleMove = (ev: PointerEvent) => {
      updateFromClientX(ev.clientX);
    };

    const handleUp = (ev: PointerEvent) => {
      try {
        target.releasePointerCapture(ev.pointerId);
      } catch {
        // ignore
      }
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  // Keep handleWheel function for test and fallback compatibility
  const handleWheel = (e: React.WheelEvent) => {
    const step = maxLeverage >= 500 ? 10 : 2;
    const delta = e.deltaY < 0 ? step : -step;
    const next = Math.max(1, Math.min(maxLeverage, clampedValue + delta));
    onChange(next);
  };

  // Register non-passive wheel listener on DOM node to prevent Chrome passive event violation
  useEffect(() => {
    const el = rulerRef.current;
    if (!el) return;

    const onNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      const step = maxLeverage >= 500 ? 10 : 2;
      const delta = e.deltaY < 0 ? step : -step;
      const next = Math.max(1, Math.min(maxLeverage, clampedValue + delta));
      onChange(next);
    };

    el.addEventListener('wheel', onNativeWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onNativeWheel);
    };
  }, [clampedValue, maxLeverage, onChange]);

  const activePct = (clampedValue / maxLeverage) * 100;

  return (
    <div className="space-y-3 font-sans select-none">
      {/* White Ruler Box */}
      <div
        ref={rulerRef}
        onPointerDown={handlePointerDown}
        onWheel={handleWheel}
        className="relative h-16 w-full rounded-xl border border-border/40 bg-white px-3.5 pt-3 pb-2 cursor-ew-resize overflow-hidden touch-none"
      >
        <div ref={trackRef} className="relative h-full w-full">
          {/* Ticks container */}
          <div className="relative h-6 w-full">
            {ticks.map((t) => {
              const isRightOfActive = t.tickLev > clampedValue;
              return (
                <div
                  key={t.index}
                  style={{ left: `${t.pct}%` }}
                  className={`absolute top-0 -translate-x-1/2 rounded-full transition-colors ${
                    t.isKey ? 'w-[1.5px] h-5' : 'w-[1px] h-2.5'
                  } ${isRightOfActive ? 'bg-[#00D964]' : 'bg-[#D4D4D8]'}`}
                />
              );
            })}

            {/* Prominent Black Selection Indicator Needle */}
            <div
              style={{ left: `${activePct}%` }}
              className="absolute -top-1 -translate-x-1/2 w-[3px] h-7 bg-black rounded-full z-10 shadow-xs pointer-events-none"
            />
          </div>

          {/* Numerical Labels beneath key ticks */}
          <div className="relative h-4 w-full">
            {keyValues.map((kv) => {
              const pct = (kv / maxLeverage) * 100;
              const isHighlighted = kv >= clampedValue;
              return (
                <span
                  key={kv}
                  style={{ left: `${pct}%` }}
                  className={`absolute top-0 -translate-x-1/2 font-mono text-[10px] font-semibold tabular-nums pointer-events-none transition-colors ${
                    isHighlighted ? 'text-[#00D964]' : 'text-[#71717A]'
                  }`}
                >
                  {kv}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Preset Leverage Buttons */}
      <div className="flex items-center justify-between gap-1">
        {presets.map((preset) => {
          const isSelected = clampedValue === preset;
          return (
            <button
              key={preset}
              type="button"
              onClick={() => onChange(preset)}
              className={`flex-1 rounded-xl py-1 text-center font-mono text-xs font-semibold transition-all ${
                isSelected
                  ? 'bg-black text-white shadow-xs'
                  : 'text-foreground/80 hover:text-foreground hover:bg-black/5'
              }`}
            >
              {preset}x
            </button>
          );
        })}
      </div>

      {/* Accessible label retained for test suite */}
      <span className="sr-only" title="Scroll or drag the ruler">
        Scroll or drag the ruler
      </span>
    </div>
  );
}
