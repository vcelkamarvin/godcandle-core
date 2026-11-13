import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  "profit" | "loss" | "lime" | "warning" | "neutral" | "options" | "perps" | "predict";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
  icon?: ReactNode;
}

export function Badge({ children, variant = "neutral", className, icon, ...props }: BadgeProps) {
  const variantStyles: Record<BadgeVariant, string> = {
    profit: "bg-[#E6F9EE] text-[#00D964] border border-[#00D964]/20",
    loss: "bg-[#FEECEB] text-[#FF3B30] border border-[#FF3B30]/20",
    lime: "bg-[rgba(37,99,235,0.15)] text-[#60A5FA] border border-[rgba(37,99,235,0.3)]",
    warning: "bg-[rgba(255,209,102,0.15)] text-[#FFD166] border border-[rgba(255,209,102,0.3)]",
    neutral: "bg-[#F0F2F5] text-foreground border border-black/[0.06]",
    options: "bg-[#A78BFA]/15 text-[#A78BFA] border border-[#A78BFA]/30",
    perps: "bg-[#5B9DFF]/15 text-[#5B9DFF] border border-[#5B9DFF]/30",
    predict: "bg-[#F472B6]/15 text-[#F472B6] border border-[#F472B6]/30",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-semibold tracking-tight select-none tabular-nums",
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {icon ? <span className="shrink-0">{icon}</span> : null}
      <span>{children}</span>
    </span>
  );
}
