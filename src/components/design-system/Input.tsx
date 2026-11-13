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
        "relative flex h-12 w-full items-center rounded-[14px] bg-[#F0F2F5] border border-black/[0.06] transition-all duration-150 ease-out focus-within:ring-2 focus-within:ring-black/10 focus-within:border-black/20 focus-within:bg-white",
        disabled && "opacity-50 cursor-not-allowed",
        wrapperClassName,
      )}
    >
      {leftSlot ? (
        <span className="flex items-center pl-3 text-[#737887] select-none text-[13px] shrink-0">
          {leftSlot}
        </span>
      ) : null}
      <input
        disabled={disabled}
        className={cn(
          "h-full w-full bg-transparent px-3 text-[14px] text-[#0A0A0A] placeholder:text-[#737887] outline-none tabular-nums",
          leftSlot && "pl-2",
          rightSlot && "pr-2",
          className,
        )}
        {...props}
      />
      {rightSlot ? (
        <span className="flex items-center pr-3 text-[#737887] select-none text-[13px] shrink-0">
          {rightSlot}
        </span>
      ) : null}
    </div>
  );
}
