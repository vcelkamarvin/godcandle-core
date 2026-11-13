import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
  className?: string;
  wrapperClassName?: string;
}

export function Input({
  leftSlot,
  rightSlot,
  className,
  wrapperClassName,
  disabled,
  ...props
}: InputProps) {
  return (
    <div
      className={cn(
        "relative flex h-12 w-full items-center rounded-[14px] bg-[#1E1E22] border border-white/[0.06] transition-all duration-150 ease-out focus-within:ring-2 focus-within:ring-[#2563EB]/40 focus-within:border-[#2563EB]/40",
        disabled && "opacity-50 cursor-not-allowed",
        wrapperClassName,
      )}
    >
      {leftSlot ? (
        <span className="flex items-center pl-3 text-[#8A8A96] select-none text-[13px] shrink-0">
          {leftSlot}
        </span>
      ) : null}
      <input
        disabled={disabled}
        className={cn(
          "h-full w-full bg-transparent px-3 text-[14px] text-[#F5F5F6] placeholder:text-[#8A8A96] outline-none tabular-nums",
          leftSlot && "pl-2",
          rightSlot && "pr-2",
          className,
        )}
        {...props}
      />
      {rightSlot ? (
        <span className="flex items-center pr-3 text-[#8A8A96] select-none text-[13px] shrink-0">
          {rightSlot}
        </span>
      ) : null}
    </div>
  );
}
