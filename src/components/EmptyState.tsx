import { type LucideIcon } from "lucide-react";
import { GradientArt, type GradientVariant } from "./GradientArt";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: LucideIcon;
  variant?: GradientVariant;
  className?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon,
  variant = "sapphire",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "relative rounded-[20px] overflow-hidden border border-white/[0.08] bg-[#111113] p-6 sm:p-8 flex flex-col items-center justify-center text-center select-none shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]",
        className,
      )}
    >
      {/* Generative Gradient Background layer with low opacity */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <GradientArt variant={variant} animated={false} grainOpacity={0.06} />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 flex flex-col items-center max-w-sm">
        {Icon && (
          <div className="size-12 rounded-full bg-[#1E1E22] border border-white/10 flex items-center justify-center mb-3.5 shadow-md">
            <Icon className="size-5 text-[#60A5FA]" />
          </div>
        )}

        <h3 className="font-display text-[16px] font-semibold text-[#F5F5F6] tracking-tight">
          {title}
        </h3>
        <p className="mt-1.5 text-[12px] leading-relaxed text-[#8A8A96]">{description}</p>

        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="mt-4 h-9 px-5 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-[12px] shadow-[0_4px_20px_-6px_rgba(37,99,235,0.4)] transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
