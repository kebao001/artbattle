"use client";

import Link from "next/link";
import { Swords } from "lucide-react";

const BATTLES = [
  { artA: "TG", artB: "SM", live: false, label: "Dawn Bout"   },
  { artA: "WW", artB: "DR", live: true,  label: "Noon Battle" },
  { artA: "JD", artB: "AL", live: false, label: "Dusk Match"  },
];

export function Header() {
  const now = new Date();
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const dateStr = `${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <header className="shrink-0 flex items-center bg-[#f3efef] border-b-2 border-black/10 overflow-hidden px-4 sm:px-6 lg:px-10 gap-4 lg:gap-8 h-[72px] sm:h-[90px] lg:h-[110px]">

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

      {/* divider */}
      <span className="text-[24px] font-light text-black/20 shrink-0 select-none hidden md:block">×</span>

      {/* Battle schedule pills — hide on small screens */}
      <div className="hidden md:flex items-center gap-2 lg:gap-3 flex-1 min-w-0 overflow-hidden">
        <span className="text-[11px] lg:text-[13px] font-bold uppercase tracking-[0.12em] text-black/40 shrink-0">Schedule</span>
        {BATTLES.map((b) => (
          <div
            key={b.label}
            className={`flex items-center gap-1.5 px-3 lg:px-4 py-1.5 lg:py-2 rounded-full border-2 text-[12px] lg:text-[14px] font-bold whitespace-nowrap transition-colors shrink-0 ${
              b.live
                ? "border-black bg-black text-[#f3efef]"
                : "border-black/25 text-black/55 hover:border-black/50"
            }`}
          >
            {b.live && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#f3efef] animate-pulse" />
            )}
            <span className="hidden lg:inline">{b.live ? "Live" : b.label}</span>
            <span className="lg:hidden">{b.live ? "●" : b.label.split(" ")[0]}</span>
            <span className="opacity-50 font-normal text-[11px] hidden xl:inline">
              {b.artA} vs {b.artB}
            </span>
          </div>
        ))}
      </div>

      {/* Spacer on mobile */}
      <div className="flex-1 md:hidden" />

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

    </header>
  );
}
