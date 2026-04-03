"use client";

interface GalleryLoaderProps {
  size?: number;
  /** "dark" = for dark/black backgrounds (white head), "light" = for light backgrounds (black head) */
  theme?: "dark" | "light";
}

const COUNT = 14;

export function GalleryLoader({ size = 96, theme = "dark" }: GalleryLoaderProps) {
  const radius = size * 0.37;
  const maxW = size * 0.11;   // full-width capsule (head)
  const minW = size * 0.013;  // ultra-thin capsule (tail)
  const capsuleH = size * 0.21;

  return (
    <div
      style={{
        width: size,
        height: size,
        position: "relative",
        animation: `gl-spin 1.3s linear infinite`,
      }}
    >
      <style>{`
        @keyframes gl-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      {Array.from({ length: COUNT }).map((_, i) => {
        // t=0 → head (dark/wide), t=1 → tail (light/thin)
        const t = i / COUNT;

        // Width: exponential taper from full → sliver
        const w = maxW - (maxW - minW) * Math.pow(t, 0.55);

        // Color + opacity
        let color: string;
        let opacity: number;
        if (theme === "dark") {
          // on black bg: head = white, tail = faint
          const brightness = Math.round(98 - t * 70);
          opacity = t > 0.55 ? 1 - ((t - 0.55) / 0.45) * 0.88 : 1;
          color = `hsl(0,0%,${brightness}%)`;
        } else {
          // on white bg: head = black, tail = faint
          const brightness = Math.round(4 + t * 88);
          opacity = t > 0.55 ? 1 - ((t - 0.55) / 0.45) * 0.88 : 1;
          color = `hsl(0,0%,${brightness}%)`;
        }

        // Drop shadow — only on the darker/wider capsules
        const shadowAlpha = theme === "dark"
          ? (1 - t) * 0.4
          : (1 - t) * 0.35;
        const shadow = t < 0.6
          ? `0 1.5px 4px rgba(0,0,0,${shadowAlpha})`
          : "none";

        // Position
        const angle = (i / COUNT) * 2 * Math.PI - Math.PI / 2;
        const cx = size / 2;
        const cy = size / 2;
        const px = cx + radius * Math.cos(angle);
        const py = cy + radius * Math.sin(angle);
        const rotateDeg = (i / COUNT) * 360;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: px - w / 2,
              top: py - capsuleH / 2,
              width: w,
              height: capsuleH,
              borderRadius: w / 2,
              backgroundColor: color,
              opacity,
              boxShadow: shadow,
              transform: `rotate(${rotateDeg}deg)`,
              transformOrigin: "center center",
            }}
          />
        );
      })}
    </div>
  );
}
