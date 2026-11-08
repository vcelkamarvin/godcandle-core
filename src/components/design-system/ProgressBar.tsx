import { cn } from "@/lib/utils";

export interface Segment {
  label: string;
  pct: number;
  color: string;
  value?: string;
}

export function ProgressBar({
  segments,
  className,
  showLegend = true,
}: {
  segments: Segment[];
  className?: string;
  showLegend?: boolean;
}) {
  const total = segments.reduce((sum, s) => sum + Math.max(0, s.pct), 0) || 100;

  return (
    <div className={cn("flex flex-col gap-3 w-full", className)}>
      {/* Segmented bar */}
      <div className="h-3 w-full flex rounded-full overflow-hidden bg-[#1E1E22] p-0.5 gap-0.5">
        {segments.map((seg, idx) => {
          const widthPct = (Math.max(0, seg.pct) / total) * 100;
          if (widthPct <= 0) return null;
          return (
            <div
              key={idx}
              style={{
                width: `${widthPct}%`,
                backgroundColor: seg.color,
              }}
              className="h-full rounded-full transition-all duration-300"
              title={`${seg.label}: ${seg.pct}%`}
            />
          );
        })}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px]">
          {segments.map((seg, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <span
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-[#A8A8B3]">{seg.label}</span>
              <span className="text-[#F5F5F6] font-semibold tabular-nums">
                {seg.value || `${seg.pct}%`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
