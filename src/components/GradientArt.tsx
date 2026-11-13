import { useId } from "react";
import { cn } from "@/lib/utils";

export type GradientVariant = "orb" | "midnight" | "aurora" | "sapphire";

export interface GradientArtProps {
  variant?: GradientVariant;
  className?: string;
  children?: React.ReactNode;
  animated?: boolean;
  grainOpacity?: number; // 0.06 - 0.10 recommended
  backgroundImage?: string;
}

export function GradientArt({
  variant = "orb",
  className,
  children,
  animated = true,
  grainOpacity = 0.08,
  backgroundImage,
}: GradientArtProps) {
  const rawId = useId();
  // Strip non-alphanumeric characters (like colons in React 19 :r0:) so SVG url(#id) resolves safely
  const filterId = rawId.replace(/[^a-zA-Z0-9_-]/g, "");

  // Palette definitions
  const palettes = {
    orb: {
      base: "#0B0B0C",
      blobs: [
        {
          color: "#3DDC97",
          size: "w-[340px] h-[340px]",
          pos: "top-[-10%] left-[-15%]",
          delay: "0s",
          duration: "24s",
        },
        {
          color: "#D7FF3F",
          size: "w-[380px] h-[380px]",
          pos: "bottom-[-10%] right-[-10%]",
          delay: "-6s",
          duration: "28s",
        },
        {
          color: "#A78BFA",
          size: "w-[320px] h-[320px]",
          pos: "top-[25%] right-[5%]",
          delay: "-12s",
          duration: "22s",
        },
        {
          color: "#17171A",
          size: "w-[420px] h-[420px]",
          pos: "bottom-[15%] left-[10%]",
          delay: "-18s",
          duration: "26s",
        },
      ],
    },
    midnight: {
      base: "#031327",
      blobs: [
        {
          color: "#CFE6FF",
          size: "w-[320px] h-[320px]",
          pos: "top-[-5%] left-[-10%]",
          delay: "0s",
          duration: "25s",
        },
        {
          color: "#1F5FA8",
          size: "w-[400px] h-[400px]",
          pos: "bottom-[-15%] right-[-15%]",
          delay: "-7s",
          duration: "30s",
        },
        {
          color: "#0A2540",
          size: "w-[360px] h-[360px]",
          pos: "top-[30%] right-[10%]",
          delay: "-14s",
          duration: "24s",
        },
        {
          color: "#5B9DFF",
          size: "w-[300px] h-[300px]",
          pos: "bottom-[20%] left-[5%]",
          delay: "-20s",
          duration: "28s",
        },
      ],
    },
    aurora: {
      base: "#08080C",
      blobs: [
        {
          color: "#10B981",
          size: "w-[340px] h-[340px]",
          pos: "top-[-10%] left-[5%]",
          delay: "0s",
          duration: "26s",
        },
        {
          color: "#8B5CF6",
          size: "w-[380px] h-[380px]",
          pos: "bottom-[-10%] left-[-10%]",
          delay: "-8s",
          duration: "24s",
        },
        {
          color: "#F43F5E",
          size: "w-[320px] h-[320px]",
          pos: "top-[20%] right-[-10%]",
          delay: "-15s",
          duration: "28s",
        },
        {
          color: "#06B6D4",
          size: "w-[300px] h-[300px]",
          pos: "bottom-[25%] right-[15%]",
          delay: "-21s",
          duration: "22s",
        },
      ],
    },
    sapphire: {
      base: "#030A16",
      blobs: [
        {
          color: "#1E69FF",
          size: "w-[360px] h-[360px]",
          pos: "top-[-10%] left-[-10%]",
          delay: "0s",
          duration: "24s",
        },
        {
          color: "#2563EB",
          size: "w-[420px] h-[420px]",
          pos: "bottom-[-15%] right-[-10%]",
          delay: "-6s",
          duration: "28s",
        },
        {
          color: "#60A5FA",
          size: "w-[300px] h-[300px]",
          pos: "top-[25%] right-[5%]",
          delay: "-12s",
          duration: "22s",
        },
        {
          color: "#0A2540",
          size: "w-[380px] h-[380px]",
          pos: "bottom-[15%] left-[5%]",
          delay: "-18s",
          duration: "26s",
        },
      ],
    },
  };

  const active = palettes[variant] || palettes.orb;

  return (
    <div
      data-gradient-art="true"
      className={cn("relative w-full h-full overflow-hidden isolate select-none", className)}
      style={{
        backgroundColor: active.base,
        ...(backgroundImage
          ? {
              backgroundImage: `url('${backgroundImage}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : {}),
      }}
      aria-hidden="true"
    >
      {/* Dynamic drifting blurred gradient blobs */}
      <div
        className={cn(
          "absolute inset-0 overflow-hidden pointer-events-none",
          backgroundImage && "opacity-40",
        )}
      >
        {active.blobs.map((blob, idx) => (
          <div
            key={idx}
            className={cn(
              "absolute rounded-full blur-[80px] opacity-70 transform-gpu",
              blob.size,
              blob.pos,
              animated && "motion-safe:animate-gradient-drift",
            )}
            style={{
              backgroundColor: blob.color,
              animationDelay: blob.delay,
              animationDuration: blob.duration,
            }}
          />
        ))}
      </div>

      {/* SVG Grain Noise Overlay */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none mix-blend-overlay"
        style={{ opacity: grainOpacity }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id={`grain-${filterId}`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.75"
            numOctaves="4"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${filterId})`} />
      </svg>

      {/* Optional Foreground Slot */}
      {children && <div className="relative z-10 w-full h-full">{children}</div>}
    </div>
  );
}
