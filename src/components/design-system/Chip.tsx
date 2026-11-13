import type { ReactNode, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  active?: boolean;
  variant?: "lime" | "white";
  className?: string;
  icon?: ReactNode;
}

export function Chip({
  children,
  active = false,
  variant = "white",
  className,
  icon,
  ...props
}: ChipProps) {
  return (
    <button
      type="button"
      className={cn(
        "relative inline-flex h-9 min-w-[40px] items-center justify-center gap-1.5 rounded-full px-3.5 text-[12px] font-medium leading-[16px] transition-all duration-150 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40",
        active
          ? variant === "lime"
            ? "bg-[#2563EB] text-white font-semibold shadow-[0_4px_20px_rgba(37,99,235,0.4)]"
            : "bg-[#F5F5F6] text-[#0B0B0C] font-semibold shadow-sm"
          : "bg-[#1E1E22] text-[#A8A8B3] hover:bg-[#26262B] hover:text-[#F5F5F6]",
        className,
      )}
      {...props}
    >
      {icon ? <span className="shrink-0">{icon}</span> : null}
      <span>{children}</span>
    </button>
  );
}
