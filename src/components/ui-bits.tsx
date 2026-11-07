import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Re-export all strict design-system primitives
export * from "./design-system";

export function Card({
  children,
  className,
  hero = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  className?: string;
  hero?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-[20px] border border-white/[0.06] bg-[#17171A] text-[#F5F5F6] overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]",
        hero ? "p-6" : "",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between border-b border-white/[0.06] bg-transparent px-5 py-3.5 shrink-0",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardBody({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { children: ReactNode; className?: string }) {
  return (
    <div className={cn("p-5 flex flex-col gap-3 flex-1 min-h-0", className)} {...props}>
      {children}
    </div>
  );
}

export const CardContent = CardBody;

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2
      className={cn(
        "text-[16px] leading-[24px] font-semibold text-[#F5F5F6] tracking-tight",
        className,
      )}
    >
      {children}
    </h2>
  );
}

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("block text-[12px] leading-[16px] font-medium text-[#A8A8B3]", className)}>
      {children}
    </span>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  height = "h-8",
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  height?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full items-center gap-1 rounded-full border border-white/[0.06] bg-[#1E1E22] p-1",
        height,
      )}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "h-full flex-1 rounded-full text-[12px] font-medium transition-colors duration-150 cursor-pointer outline-none",
            value === o.value
              ? "bg-[#F5F5F6] text-[#0B0B0C] shadow-xs font-semibold"
              : "text-[#A8A8B3] hover:text-[#F5F5F6]",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Stepper({
  value,
  onChange,
  step,
  suffix,
  min = 0,
}: {
  value: number;
  onChange: (v: number) => void;
  step: number;
  suffix?: string;
  min?: number;
}) {
  return (
    <div className="flex h-10 items-center rounded-[12px] border border-white/[0.06] bg-[#1E1E22]">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - step))}
        className="h-full w-10 rounded-l-[12px] text-[#A8A8B3] transition-colors hover:bg-[#26262B] hover:text-[#F5F5F6]"
      >
        −
      </button>
      <input
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value.replace(/[^0-9.]/g, ""));
          if (!Number.isNaN(n)) onChange(n);
        }}
        className="h-full min-w-0 flex-1 bg-transparent text-center text-[14px] text-[#F5F5F6] tabular-nums outline-none"
      />
      {suffix ? <span className="pr-2 text-[12px] text-[#8A8A96]">{suffix}</span> : null}
      <button
        type="button"
        onClick={() => onChange(value + step)}
        className="h-full w-10 rounded-r-[12px] text-[#A8A8B3] transition-colors hover:bg-[#26262B] hover:text-[#F5F5F6]"
      >
        +
      </button>
    </div>
  );
}

export function Slider({
  value,
  onChange,
  min,
  max,
  step,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  className?: string;
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={cn("options-slider", className)}
    />
  );
}
