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
    // Primary non-trade CTA: electric blue fill, white text
    primary:
      "bg-[#2563EB] text-white font-semibold hover:bg-[#1D4ED8] active:scale-[0.98] shadow-[0_4px_20px_rgba(37,99,235,0.35)] border border-[#2563EB]",
    // Buy / Long: profit fill (#3DDC97), dark text
    buy: "bg-[#3DDC97] text-[#0B0B0C] font-semibold hover:bg-[#34c987] active:scale-[0.98] border border-[#3DDC97]",
    // Sell / Short: loss fill (#FF5C6C), white text
    sell: "bg-[#FF5C6C] text-white font-semibold hover:bg-[#e64c5c] active:scale-[0.98] border border-[#FF5C6C]",
    // Secondary: surface-2 with border-default
    secondary:
      "bg-[#1E1E22] text-[#F5F5F6] font-medium hover:bg-[#26262B] border border-white/10 active:scale-[0.98]",
    // Ghost: transparent, hover surface-3
    ghost:
      "bg-transparent text-[#A8A8B3] hover:text-[#F5F5F6] hover:bg-[#26262B] border border-transparent",
    // Danger: subtle red
    danger:
      "bg-[rgba(255,92,108,0.12)] text-[#FF5C6C] hover:bg-[rgba(255,92,108,0.2)] border border-[rgba(255,92,108,0.25)]",
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
