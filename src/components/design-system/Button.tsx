import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "buy" | "sell" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  className?: string;
}

export function Button({
  children,
  variant = "secondary",
  size = "md",
  fullWidth = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const sizeStyles = {
    sm: "h-9 px-3 text-[12px] rounded-full", // 36px
    md: "h-10 px-4 text-[13px] rounded-full",
    lg: "h-[52px] px-6 text-[14px] rounded-full", // Primary CTA height 52, radius 999
  }[size];

  const variantStyles = {
    // Primary non-trade CTA: Revolut obsidian black, crisp white text
    primary:
      "bg-[#0A0A0A] text-white font-semibold hover:bg-[#1A1A1A] active:scale-[0.98] shadow-xs border border-transparent",
    // Buy / Long: Revolut neon mint (#00D964), dark text
    buy: "bg-[#00D964] text-[#0A0A0A] font-semibold hover:bg-[#05C168] active:scale-[0.98] border border-transparent",
    // Sell / Short: Revolut electric crimson (#FF3B30), white text
    sell: "bg-[#FF3B30] text-white font-semibold hover:bg-[#F04438] active:scale-[0.98] border border-transparent",
    // Secondary: soft track #F0F2F5 with dark text
    secondary:
      "bg-[#F0F2F5] text-[#0A0A0A] font-medium hover:bg-[#E4E7EC] border border-black/[0.04] active:scale-[0.98]",
    // Ghost: transparent, hover soft track
    ghost:
      "bg-transparent text-[#737887] hover:text-[#0A0A0A] hover:bg-[#F0F2F5] border border-transparent",
    // Danger: soft red pill
    danger:
      "bg-[#FEECEB] text-[#FF3B30] hover:bg-[#FCD8D6] border border-[#FF3B30]/20 active:scale-[0.98]",
  }[variant];

  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 ease-out select-none cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40",
        fullWidth && "w-full",
        sizeStyles,
        variantStyles,
        disabled && "opacity-40 cursor-not-allowed active:scale-100 hover:bg-current",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
