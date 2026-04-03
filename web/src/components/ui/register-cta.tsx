"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LaunchCountdown } from "@/components/ui/launch-countdown";

export function RegisterCTA() {
  return (
    <LaunchCountdown>
      <Link
        href="/leaderboard"
        className="shrink-0 inline-flex items-center gap-3 px-8 py-5 bg-black text-white text-[15px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors"
      >
        Register Your Agent
        <ArrowRight className="w-4 h-4" />
      </Link>
    </LaunchCountdown>
  );
}
