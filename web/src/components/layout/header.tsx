"use client";

import Image from "next/image";
import Link from "next/link";
import { Circle, Info, GalleryHorizontalEnd } from "lucide-react";
import { useLaunchCountdown } from "@/hooks/use-launch-countdown";

export function Header() {
  const { isLaunched } = useLaunchCountdown();
  const now = new Date();
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const dateStr = `${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <header className="shrink-0 w-full bg-[#f3efef] border-b-2 border-black/10 h-[64px] sm:h-[80px] lg:h-[100px]">
      <div className="max-w-[1800px] mx-auto h-full flex items-center overflow-hidden px-8 sm:px-12 lg:px-16 gap-4 lg:gap-8">

      {/* Logo */}
      <div className="shrink-0">
        <Image
          src="/synonym-logo.png"
          alt="Synonym"
          width={56}
          height={56}
          className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 object-contain"
          priority
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Nav buttons — ghost/secondary style, left to right: Home · Exhibition Info · Art Works */}
      <nav className="flex items-center gap-1.5 sm:gap-3">

        {/* Home */}
        <Link
          href="/leaderboard"
          className="shrink-0 flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-2 rounded-full border border-black/30 font-medium text-black/60 hover:text-black hover:border-black/60 transition-colors duration-75 whitespace-nowrap"
        >
          {/* Mobile: text label */}
          <span className="text-[10px] font-mono uppercase tracking-wider sm:hidden">Home</span>
          {/* Desktop: icon + label */}
          <Circle className="hidden sm:block w-3.5 h-3.5 shrink-0" strokeWidth={2} />
          <span className="hidden sm:inline text-[13px]">Home</span>
        </Link>

        {/* Exhibition Info */}
        <Link
          href="/exhibition"
          className="shrink-0 flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-2 rounded-full border border-black/30 font-medium text-black/60 hover:text-black hover:border-black/60 transition-colors duration-75 whitespace-nowrap"
        >
          {/* Mobile: text label */}
          <span className="text-[10px] font-mono uppercase tracking-wider sm:hidden">Info</span>
          {/* Desktop: icon + label */}
          <Info className="hidden sm:block w-3.5 h-3.5 shrink-0" strokeWidth={2} />
          <span className="hidden sm:inline text-[13px]">Exhibition Info</span>
        </Link>

        {/* Art Works */}
        {isLaunched ? (
          <Link
            href="/wall"
            className="shrink-0 flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-2 rounded-full border border-black/30 font-medium text-black/60 hover:text-black hover:border-black/60 transition-colors duration-75 whitespace-nowrap"
          >
            {/* Mobile: text label */}
            <span className="text-[10px] font-mono uppercase tracking-wider sm:hidden">Works</span>
            {/* Desktop: icon + label */}
            <GalleryHorizontalEnd className="hidden sm:block w-3.5 h-3.5 shrink-0" strokeWidth={2} />
            <span className="hidden sm:inline text-[13px]">Art Works</span>
          </Link>
        ) : (
          <span className="shrink-0 flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-2 rounded-full border border-black/15 font-medium text-black/25 cursor-not-allowed whitespace-nowrap">
            {/* Mobile: text label */}
            <span className="text-[10px] font-mono uppercase tracking-wider sm:hidden">Works</span>
            {/* Desktop: icon + label */}
            <GalleryHorizontalEnd className="hidden sm:block w-3.5 h-3.5 shrink-0" strokeWidth={2} />
            <span className="hidden sm:inline text-[13px]">Art Works</span>
          </span>
        )}

      </nav>

      {/* Date */}
      <div className="shrink-0 text-right">
        <div className="text-[14px] lg:text-[18px] font-black text-black leading-none">{dateStr}</div>
        <div className="text-[10px] lg:text-[12px] text-black/40 font-medium mt-0.5 uppercase tracking-wide hidden sm:block">Today</div>
      </div>

      </div>
    </header>
  );
}
