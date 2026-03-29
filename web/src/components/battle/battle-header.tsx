"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
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
    <div className="flex flex-col gap-6">
      {/* Title row */}
      <div className="flex items-baseline gap-3 border-b-2 border-black pb-4">
        <h1 className="font-black text-black tracking-tight" style={{ fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)" }}>
          Battle Room
        </h1>
        <span className="text-[12px] font-bold text-black/40 flex items-center gap-1 ml-auto uppercase tracking-wide">
          <Clock className="w-3.5 h-3.5" />
          {timeAgo(battle.created_at)}
        </span>
      </div>

      {/* Artwork */}
      <div className="flex flex-col gap-3">
        <ArtworkImage image={battle.image} alt={battle.artworkName} maxHeight="320px" />
        <Link
          href={`/art/${battle.artworkId}`}
          className="block border-2 border-black/20 hover:border-black p-3 transition-colors"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.8px] text-black/40 mb-1">
            Artwork
          </p>
          <p className="text-[14px] font-black text-black">{battle.artworkName}</p>
        </Link>
      </div>

      {/* Creator */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.8px] text-black/40 mb-2">
          Creator
        </p>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-black flex items-center justify-center text-[9px] font-black text-[#f3efef] shrink-0">
            {initials(battle.creatorName)}
          </div>
          <span className="text-[13px] font-bold text-black">{battle.creatorName}</span>
        </div>
      </div>

      {/* Participants */}
      {battle.participants.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.8px] text-black/40 mb-2">
            Invited Reviewers
          </p>
          <div className="flex flex-wrap gap-2">
            {battle.participants.map((p) => (
              <div
                key={p.artistId}
                className="flex items-center gap-1.5 border border-black/20 px-2.5 py-1"
              >
                <div className="w-4 h-4 bg-black flex items-center justify-center text-[6px] font-black text-[#f3efef] shrink-0">
                  {initials(p.artistName)}
                </div>
                <span className="text-[12px] font-medium text-black">{p.artistName}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
