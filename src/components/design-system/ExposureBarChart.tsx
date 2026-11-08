import { cn } from "@/lib/utils";

export interface ExposureBarItem {
  label: string;
  value: number; // e.g. 12000
  displayValue: string; // e.g. "$12,450"
  color?: string; // default to brand lime or product color
  subLabel?: string;
}

export function ExposureBarChart({
  items,
  height = 120,
  className,
}: {
  items: ExposureBarItem[];
  height?: number;
  className?: string;
}) {
  const maxValue = Math.max(...items.map((i) => Math.abs(i.value)), 1);

  return (
    <div className={cn("flex items-end justify-between gap-3 w-full pt-4", className)}>
      {items.map((item, idx) => {
        const barHeight = Math.max(12, Math.round((Math.abs(item.value) / maxValue) * height));
        const color = item.color || "#2563EB";

        return (
          <div key={idx} className="flex flex-col items-center flex-1 min-w-0 gap-2 group">
            {/* Big number above bar (Financia reference style) */}
            <div className="text-[18px] sm:text-[20px] leading-[24px] font-semibold text-[#F5F5F6] tabular-nums tracking-tight truncate">
              {item.displayValue}
            </div>

            {/* Vertical Bar Column */}
            <div
              className="w-full flex items-end justify-center rounded-full bg-[#1E1E22] p-1"
              style={{ height: `${height}px` }}
            >
              <div
                className="w-2.5 rounded-full transition-all duration-300 group-hover:scale-y-105"
                style={{
                  height: `${barHeight}px`,
                  backgroundColor: color,
                  boxShadow: `0 0 12px ${color}33`,
                }}
              />
            </div>

            {/* Label below */}
            <div className="text-[12px] font-medium text-[#A8A8B3] text-center truncate">
              {item.label}
            </div>
            {item.subLabel ? (
              <div className="text-[12px] text-[#8A8A96] text-center -mt-1 tabular-nums">
                {item.subLabel}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
