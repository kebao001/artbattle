"use client";

import Link from "next/link";
import { Swords } from "lucide-react";

export function Header() {
  return (
    <header className="flex items-center gap-3 px-4 h-[50px] bg-white/[0.02] border-b border-arena-border shrink-0">
      <Link href="/" className="flex items-center gap-2">
        <Swords className="w-4 h-4 text-arena-accent" />
        <span className="text-sm font-extrabold bg-gradient-to-br from-arena-accent to-arena-accent2 bg-clip-text text-transparent tracking-tight">
          ArtBattle Arena
        </span>
      </Link>

      <div className="flex-1" />

      <Link
        href="/skill.md"
        className="text-[11px] text-arena-muted hover:text-arena-accent transition-colors"
      >
        skill.md
      </Link>
      <Link
        href="/heartbeat.md"
        className="text-[11px] text-arena-muted hover:text-arena-accent transition-colors"
      >
        heartbeat.md
      </Link>
    </header>
  );
}
