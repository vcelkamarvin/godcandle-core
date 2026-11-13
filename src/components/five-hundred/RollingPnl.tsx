import { useEffect, useRef, useState } from "react";
import { formatPnl, formatPct } from "@/lib/five-hundred";

interface RollingPnlProps {
  pnl: number;
  stake: number;
  isLiquidated?: boolean;
  className?: string;
}

export function RollingPnl({ pnl, stake, isLiquidated = false, className = "" }: RollingPnlProps) {
  const prevPnlRef = useRef(pnl);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (isLiquidated) {
      setFlash("down");
      const t = setTimeout(() => setFlash(null), 800);
      return () => clearTimeout(t);
    }

    if (pnl !== prevPnlRef.current) {
      const dir = pnl > prevPnlRef.current ? "up" : "down";
      prevPnlRef.current = pnl;
      setFlash(dir);
      const timer = setTimeout(() => {
        setFlash(null);
      }, 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [pnl, isLiquidated]);

  const pnlPercent = stake > 0 ? (pnl / stake) * 100 : 0;
  const isPositive = pnl > 0;
  const isNegative = pnl < 0;

  // Flash background and text accents
  const textColor = isLiquidated
    ? "text-[#FF3B30]"
    : isPositive
      ? "text-[#00D964]"
      : isNegative
        ? "text-[#FF3B30]"
        : "text-foreground";

  const flashBg =
    flash === "up"
      ? "bg-[#00D964]/15 shadow-[0_0_20px_rgba(0,217,100,0.25)]"
      : flash === "down"
        ? "bg-[#FF3B30]/15 shadow-[0_0_20px_rgba(255,59,48,0.25)]"
        : "bg-transparent";

  return (
    <div
      className={`inline-flex items-baseline gap-2.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${flashBg} ${className}`}
    >
      <span
        className={`font-mono tabular-nums text-[34px] sm:text-[40px] font-bold tracking-tight leading-none ${textColor}`}
      >
        {isLiquidated ? "−$" + Math.round(stake).toLocaleString("en-US") : formatPnl(pnl)}
      </span>
      <span
        className={`font-mono tabular-nums text-[14px] sm:text-[16px] font-medium ${textColor} opacity-85`}
      >
        ({isLiquidated ? "−100.00%" : formatPct(pnlPercent)})
      </span>
    </div>
  );
}
