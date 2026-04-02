interface GalleryLoaderProps {
  size?: number;
}

export function GalleryLoader({ size = 48 }: GalleryLoaderProps) {
  const count = 12;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.34;
  const capsuleW = size * 0.075;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ animation: "gallery-loader-spin 1s linear infinite" }}
    >
      <style>{`
        @keyframes gallery-loader-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
        const t = i / count; // 0 = tail (light, short) → 1 = head (dark, long)

        // Length: short at tail, long at head
        const minLen = size * 0.05;
        const maxLen = size * 0.16;
        const capsuleH = minLen + t * (maxLen - minLen);

        // Color: light gray at tail → black at head
        const lightness = Math.round(88 - t * 88); // 88 → 0
        const fill = `hsl(0,0%,${lightness}%)`;

        // Position center of capsule
        const px = cx + radius * Math.cos(angle);
        const py = cy + radius * Math.sin(angle);

        // Rotate capsule to point outward
        const deg = (i / count) * 360;

        return (
          <rect
            key={i}
            x={px - capsuleW / 2}
            y={py - capsuleH / 2}
            width={capsuleW}
            height={capsuleH}
            rx={capsuleW / 2}
            ry={capsuleW / 2}
            fill={fill}
            transform={`rotate(${deg}, ${px}, ${py})`}
          />
        );
      })}
    </svg>
  );
}
