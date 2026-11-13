import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card } from "./Card";
import { Badge } from "./Badge";

export interface KPIItem {
  label: string;
  value: ReactNode;
  subValue?: ReactNode;
  delta?: {
    text: string;
    direction: "up" | "down" | "neutral";
  };
  icon?: ReactNode;
}

export interface KPIStripProps {
  items: KPIItem[];
  className?: string;
}

export function KPIStrip({ items, className }: KPIStripProps) {
  return (
    <Card className={cn("p-0 overflow-hidden", className)}>
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/[0.06]">
        {items.map((item, idx) => (
          <div key={idx} className="p-5 flex flex-col justify-between gap-2 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12px] leading-[16px] font-medium text-[#A8A8B3]">
                {item.label}
              </span>
              {item.icon ? (
                <span className="text-[#8A8A96]">{item.icon}</span>
              ) : item.delta ? (
                <Badge
                  variant={
                    item.delta.direction === "up"
                      ? "profit"
                      : item.delta.direction === "down"
                        ? "loss"
                        : "neutral"
                  }
                >
                  {item.delta.direction === "up"
                    ? "▲ "
                    : item.delta.direction === "down"
                      ? "▼ "
                      : ""}
                  {item.delta.text}
                </Badge>
              ) : null}
            </div>

            <div className="flex items-baseline gap-2 flex-wrap">
              <div className="text-[28px] leading-[32px] font-semibold text-[#F5F5F6] tracking-tight tabular-nums">
                {item.value}
              </div>
              {item.subValue ? (
                <div className="text-[12px] text-[#8A8A96] tabular-nums font-medium">
                  {item.subValue}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function HeroMetric({
  label,
  value,
  subValue,
  delta,
  className,
}: {
  label: string;
  value: ReactNode;
  subValue?: ReactNode;
  delta?: {
    text: string;
    direction: "up" | "down" | "neutral";
  };
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] leading-[16px] font-medium text-[#A8A8B3]">{label}</span>
        {delta ? (
          <Badge
            variant={
              delta.direction === "up" ? "profit" : delta.direction === "down" ? "loss" : "neutral"
            }
          >
            {delta.direction === "up" ? "▲ " : delta.direction === "down" ? "▼ " : ""}
            {delta.text}
          </Badge>
        ) : null}
      </div>
      <div className="text-[48px] leading-[52px] font-semibold tracking-[-0.02em] text-[#F5F5F6] tabular-nums">
        {value}
      </div>
      {subValue ? (
        <div className="text-[12px] leading-[16px] text-[#A8A8B3] tabular-nums">{subValue}</div>
      ) : null}
    </div>
  );
}
