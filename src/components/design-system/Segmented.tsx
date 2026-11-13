import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
}

export interface SegmentedProps<T extends string = string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  variant?: "white" | "lime";
  className?: string;
  size?: "sm" | "md";
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  variant = "white",
  className,
  size = "md",
}: SegmentedProps<T>) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-xl bg-[#F0F2F5] p-1 border border-black/[0.04] select-none h-9",
        className,
      )}
      role="tablist"
    >
      {options.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative flex items-center justify-center gap-1.5 rounded-lg px-3.5 text-[12px] font-medium transition-all duration-150 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-black/10 h-7 active:scale-[0.98]",
              isSelected
                ? "bg-white text-[#0A0A0A] font-semibold shadow-xs"
                : "text-[#737887] hover:text-[#0A0A0A] hover:bg-white/60",
            )}
          >
            {opt.icon ? <span className="shrink-0">{opt.icon}</span> : null}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
