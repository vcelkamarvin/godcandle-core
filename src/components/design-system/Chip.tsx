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
          ? "bg-[#0A0A0A] text-white font-semibold shadow-xs"
          : "bg-[#F0F2F5] text-[#737887] hover:bg-[#E4E7EC] hover:text-[#0A0A0A]",
        className,
      )}
      {...props}
    >
      {icon ? <span className="shrink-0">{icon}</span> : null}
      <span>{children}</span>
    </button>
  );
}
