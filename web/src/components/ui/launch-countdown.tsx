"use client";

import { useLaunchCountdown } from "@/hooks/use-launch-countdown";

function pad(n: number): string {
  return String(n);
}

export function LaunchCountdown({
  children,
}: {
  children: React.ReactNode;
}) {
  const { days, hours, minutes, seconds, isLaunched } = useLaunchCountdown();

  if (isLaunched) return <>{children}</>;

  return (
    <span className="inline-flex items-center gap-3 px-8 py-5 bg-black/20 text-black/50 text-[15px] font-bold uppercase tracking-widest tabular-nums cursor-default select-none">
      {pad(days)}d:{pad(hours)}h:{pad(minutes)}m:{pad(seconds)}s
    </span>
  );
}
