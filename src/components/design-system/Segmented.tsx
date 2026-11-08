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
        "inline-flex items-center rounded-full bg-[#1E1E22] p-1 border border-white/[0.06] select-none h-9",
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
              "relative flex items-center justify-center gap-1.5 rounded-full px-3.5 text-[12px] font-medium transition-all duration-150 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#2563EB]/40 h-7",
              isSelected
                ? variant === "lime"
                  ? "bg-[#2563EB] text-white font-semibold shadow-[0_4px_20px_rgba(37,99,235,0.4)]"
                  : "bg-[#F5F5F6] text-[#0B0B0C] font-semibold shadow-xs"
                : "text-[#A8A8B3] hover:text-[#F5F5F6]",
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
