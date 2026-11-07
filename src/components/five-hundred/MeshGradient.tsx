import { useId } from "react";
import { cn } from "@/lib/utils";

export interface MeshGradientProps {
  className?: string;
  children?: React.ReactNode;
  animated?: boolean;
  grainOpacity?: number; // default ~0.08
  subtle?: boolean;
}

export function MeshGradient({
  className,
  children,
  animated = true,
  grainOpacity = 0.08,
  subtle = false,
}: MeshGradientProps) {
  const rawId = useId();
  const filterId = rawId.replace(/[^a-zA-Z0-9_-]/g, "");

  return (
    <div
      data-mesh-gradient="true"
      className={cn(
        "relative w-full h-full overflow-hidden isolate select-none bg-[#091124]",
        className,
      )}
      aria-hidden="true"
    >
      {/* Drifting blurred blobs with sampled iridescent rainbow palette */}
      <div
        className={cn(
          "absolute inset-0 overflow-hidden pointer-events-none transform-gpu",
          subtle ? "opacity-60" : "opacity-95",
        )}
      >
        {/* Blob 1: Vibrant Sky Blue (#6FB2F7) */}
        <div
          className={cn(
            "absolute rounded-full blur-[70px] w-[340px] h-[340px] -top-[15%] -left-[10%] bg-[#6FB2F7] opacity-80 transform-gpu",
            animated && "motion-safe:animate-gradient-drift",
          )}
          style={{ animationDuration: "24s", animationDelay: "0s" }}
        />

        {/* Blob 2: Deep Rich Royal Blue (#2B4FA0) */}
        <div
          className={cn(
            "absolute rounded-full blur-[80px] w-[380px] h-[380px] -bottom-[20%] -right-[10%] bg-[#2B4FA0] opacity-90 transform-gpu",
            animated && "motion-safe:animate-gradient-drift",
          )}
          style={{ animationDuration: "28s", animationDelay: "-6s" }}
        />

        {/* Blob 3: Pale Periwinkle Highlight (#A9C4E6) */}
        <div
          className={cn(
            "absolute rounded-full blur-[60px] w-[280px] h-[280px] top-[20%] right-[10%] bg-[#A9C4E6] opacity-75 transform-gpu",
            animated && "motion-safe:animate-gradient-drift",
          )}
          style={{ animationDuration: "22s", animationDelay: "-12s" }}
        />

        {/* Blob 4: Intense Cobalt Accent (#3A63E6) */}
        <div
          className={cn(
            "absolute rounded-full blur-[90px] w-[400px] h-[400px] bottom-[10%] left-[5%] bg-[#3A63E6] opacity-70 transform-gpu",
            animated && "motion-safe:animate-gradient-drift",
          )}
          style={{ animationDuration: "26s", animationDelay: "-18s" }}
        />
      </div>

      {/* Film Grain Noise Overlay (feTurbulence) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none mix-blend-overlay"
        style={{ opacity: grainOpacity }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id={`mesh-grain-${filterId}`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.75"
            numOctaves="4"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#mesh-grain-${filterId})`} />
      </svg>

      {/* Optional Children */}
      {children && <div className="relative z-10 w-full h-full">{children}</div>}
    </div>
  );
}
