import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface PnLTextProps extends HTMLAttributes<HTMLSpanElement> {
  value: number; // raw numeric value
  formatted?: string; // pre-formatted string if provided
  symbol?: string; // e.g. "$" or "%"
  showPrefix?: boolean; // prefix with ▲ / ▼ or + / -
  prefixType?: "arrow" | "sign";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function PnLText({
  value,
  formatted,
  symbol = "$",
  showPrefix = true,
  prefixType = "arrow",
  size = "md",
  className,
  ...props
}: PnLTextProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;

  let prefix = "";
  if (showPrefix) {
    if (prefixType === "arrow") {
      prefix = isPositive ? "▲ " : isNegative ? "▼ " : "";
    } else {
      prefix = isPositive ? "+" : isNegative ? "-" : "";
    }
  }

  const absValue = Math.abs(value);
  const displayContent =
    formatted ||
    (symbol === "%"
      ? `${absValue.toFixed(2)}%`
      : `${symbol}${absValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

  const sizeClasses = {
    sm: "text-[12px] font-medium",
    md: "text-[13px] font-semibold",
    lg: "text-[16px] font-semibold",
    xl: "text-[20px] font-bold",
  }[size];

  const colorClass = isPositive
    ? "text-[#3DDC97]"
    : isNegative
      ? "text-[#FF5C6C]"
      : "text-[#A8A8B3]";

  return (
    <span
      className={cn(
        "inline-flex items-center tabular-nums tracking-tight",
        sizeClasses,
        colorClass,
        className,
      )}
      {...props}
    >
      <span>{prefix}</span>
      <span>{displayContent}</span>
    </span>
  );
}
