"use client";

interface RollingNumberProps {
  value: number | undefined;
  className?: string;
  style?: React.CSSProperties;
}

const DIGIT_HEIGHT = 1; // in em
const DURATION_MS = 600;

/**
 * Renders each digit in its own vertical "slot machine" strip.
 * When the value changes, the key changes → digits remount and CSS‑animate
 * from 0 to the correct position. No useState / useEffect needed.
 */
export function RollingNumber({ value, className, style }: RollingNumberProps) {
  if (value === undefined) {
    return (
      <span className={className} style={style}>
        —
      </span>
    );
  }

  const digits = String(value).split("");

  return (
    <span
      key={value}
      className={className}
      style={{ ...style, display: "inline-flex", overflow: "hidden" }}
      aria-label={String(value)}
    >
      {digits.map((d, i) => (
        <DigitSlot key={`${i}-${d}`} digit={d} delay={i * 40} />
      ))}
    </span>
  );
}

function DigitSlot({ digit, delay }: { digit: string; delay: number }) {
  if (digit === "," || digit === ".") {
    return (
      <span style={{ height: `${DIGIT_HEIGHT}em`, lineHeight: `${DIGIT_HEIGHT}em` }}>
        {digit}
      </span>
    );
  }

  const n = Number(digit);

  return (
    <span
      style={{
        display: "inline-block",
        height: `${DIGIT_HEIGHT}em`,
        lineHeight: `${DIGIT_HEIGHT}em`,
        overflow: "hidden",
      }}
    >
      <span
        style={{
          display: "flex",
          flexDirection: "column",
          animation: `roll-to-${n} ${DURATION_MS}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms both`,
        }}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            style={{ height: `${DIGIT_HEIGHT}em`, lineHeight: `${DIGIT_HEIGHT}em` }}
            aria-hidden
          >
            {i}
          </span>
        ))}
      </span>

      {/* One @keyframes rule per target digit (0-9), scoped via <style>. */}
      <style>{keyframeFor(n)}</style>
    </span>
  );
}

const keyframeCache = new Map<number, string>();

function keyframeFor(n: number): string {
  let css = keyframeCache.get(n);
  if (!css) {
    css = `@keyframes roll-to-${n} { from { transform: translateY(0); } to { transform: translateY(-${n * DIGIT_HEIGHT}em); } }`;
    keyframeCache.set(n, css);
  }
  return css;
}
