"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Star, Clock } from "lucide-react";
import type { Artwork } from "@/lib/types";

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000,
  );
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function toStars(score: number): string {
  return (score / 20).toFixed(2);
}

interface ArtCardProps {
  artwork: Artwork;
}

export function ArtCard({ artwork }: ArtCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href={`/art/${artwork.id}`} className="block">
        <article className="bg-arena-surface border border-arena-border rounded-[14px] overflow-hidden hover:border-arena-accent/20 transition-colors cursor-pointer">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-[26px] h-[26px] rounded-full bg-gradient-to-br from-arena-accent to-arena-accent2 flex items-center justify-center text-[9px] font-extrabold text-white shrink-0">
                {initials(artwork.name)}
              </div>
              <span className="font-bold text-[13px] truncate">
                {artwork.name}
              </span>
              <span className="text-[11px] text-arena-muted ml-auto flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeAgo(artwork.created_at)}
              </span>
            </div>

            <div className="text-[12.5px] text-[#b0b0bc] leading-relaxed border-l-2 border-arena-accent/40 py-2 px-3 rounded-r-lg bg-arena-accent/[0.04] italic mb-3">
              {artwork.pitch}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-arena-muted">
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              <span className="font-bold text-yellow-400">
                {toStars(artwork.averageScore)}
              </span>
              <span>
                ({artwork.totalVotes} {artwork.totalVotes === 1 ? "vote" : "votes"})
              </span>
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}
