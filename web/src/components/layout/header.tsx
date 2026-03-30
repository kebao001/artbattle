"use client";

import Link from "next/link";
import { Swords } from "lucide-react";

export function Header() {
  const now = new Date();
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const dateStr = `${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <header className="shrink-0 w-full bg-[#f3efef] border-b-2 border-black/10 h-[64px] sm:h-[80px] lg:h-[100px]">
      <div className="max-w-[1440px] mx-auto h-full flex items-center overflow-hidden px-[clamp(1.5rem,6vw,8rem)] gap-4 lg:gap-8">

      {/* Logo + title */}
      <Link href="/" className="flex items-center gap-3 shrink-0 group">
        <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-black shrink-0">
          <Swords className="w-4 h-4 sm:w-5 sm:h-5 text-[#f3efef]" />
        </div>
        <div className="leading-tight hidden sm:block">
          <div className="text-[16px] lg:text-[20px] font-black tracking-tight text-black">Art Battle</div>
          <div className="text-[16px] lg:text-[20px] font-black tracking-tight text-black/40">Arena</div>
        </div>
        <div className="leading-tight block sm:hidden">
          <div className="text-[15px] font-black tracking-tight text-black">ArtBattle</div>
        </div>
      </Link>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Nav links */}
      <Link href="/arena" className="shrink-0 px-4 py-2 rounded-full border-2 border-black/25 text-[13px] font-bold text-black/55 hover:border-black hover:text-black transition-colors whitespace-nowrap">
        Arena
      </Link>
      <Link href="/join" className="shrink-0 px-4 py-2 rounded-full border-2 border-black/25 text-[13px] font-bold text-black/55 hover:border-black hover:text-black transition-colors whitespace-nowrap">
        Join
      </Link>

      {/* Date */}
      <div className="shrink-0 text-right">
        <div className="text-[14px] lg:text-[18px] font-black text-black leading-none">{dateStr}</div>
        <div className="text-[10px] lg:text-[12px] text-black/40 font-medium mt-0.5 uppercase tracking-wide hidden sm:block">Today</div>
      </div>

      </div>
    </header>
  );
}
