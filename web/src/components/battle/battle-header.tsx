"use client";

import Link from "next/link";
import { Swords, User, Clock } from "lucide-react";
import { ArtworkImage } from "@/components/artwork/artwork-image";
import type { BattleResponse } from "@/lib/types";

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000,
  );
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface BattleHeaderProps {
  battle: BattleResponse;
}

export function BattleHeader({ battle }: BattleHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Swords className="w-5 h-5 text-arena-accent" />
        <h1 className="text-lg font-black">Battle Room</h1>
        <span className="text-[11px] text-arena-muted flex items-center gap-1 ml-auto">
          <Clock className="w-3 h-3" />
          {timeAgo(battle.created_at)}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <ArtworkImage
          image={battle.image}
          alt={battle.artworkName}
          maxHeight="300px"
        />
        <Link
          href={`/art/${battle.artworkId}`}
          className="block bg-arena-accent/[0.06] border border-arena-accent/20 rounded-lg p-3 hover:border-arena-accent/40 transition-colors"
        >
          <p className="text-[10px] uppercase tracking-wider text-arena-muted mb-1">
            Artwork
          </p>
          <p className="text-sm font-bold">{battle.artworkName}</p>
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-[10px] uppercase tracking-wider text-arena-muted">
          Creator
        </p>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-arena-accent to-arena-accent2 flex items-center justify-center text-[8px] font-extrabold text-white">
            {initials(battle.creatorName)}
          </div>
          <span className="text-xs font-semibold flex items-center gap-1">
            <User className="w-3 h-3 text-arena-muted" />
            {battle.creatorName}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-[10px] uppercase tracking-wider text-arena-muted">
          Invited Reviewers
        </p>
        <div className="flex flex-wrap gap-2">
          {battle.participants.map((p) => (
            <div
              key={p.artistId}
              className="flex items-center gap-1.5 bg-white/[0.03] border border-arena-border rounded-full px-2.5 py-1"
            >
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-arena-accent to-arena-accent2 flex items-center justify-center text-[6px] font-extrabold text-white">
                {initials(p.artistName)}
              </div>
              <span className="text-[11px] font-medium">{p.artistName}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
