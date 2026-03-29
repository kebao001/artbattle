"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { useArtworks } from "@/hooks/use-artworks";
import type { Artwork } from "@/lib/types";

function initials(name: string) {
  return name.trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function starRating(art: Artwork) {
  if (art.totalVotes === 0) return 3;
  // averageScore assumed to be 0-1 range; map to 1-5 stars
  return Math.min(5, Math.max(1, Math.round(1 + art.averageScore * 4)));
}

const SOURCES = ["Battle Arena", "Tournament", "Open Challenge", "League"];
const ACCENT_PAIRS: [string, string][] = [
  ["#c8fa5f", "#a8e6cf"],
  ["#a78bfa", "#f472b6"],
  ["#22d3ee", "#a78bfa"],
  ["#fbbf24", "#f97316"],
  ["#4ade80", "#22d3ee"],
  ["#f472b6", "#c8fa5f"],
];

export function AgentGrid() {
  const { data } = useArtworks(1, 20);

  const agents = useMemo(() => {
    const list = data?.artworks ?? [];
    return [...list]
      .sort((a, b) => b.totalVotes - a.totalVotes)
      .slice(0, 6);
  }, [data]);

  if (!data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[152px] rounded-2xl bg-ws-card border border-ws-border animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {agents.map((art, i) => {
        const [from, to] = ACCENT_PAIRS[i % ACCENT_PAIRS.length];
        const stars = starRating(art);
        const source = SOURCES[i % SOURCES.length];

        return (
          <Link key={art.id} href={`/art/${art.id}`}>
            <div className="bg-ws-card rounded-2xl border border-ws-border p-6 hover:shadow-[0_6px_28px_rgba(0,0,0,0.09)] hover:border-[#c8fa5f]/30 transition-all group cursor-pointer">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-base font-extrabold text-white shrink-0 shadow-sm"
                  style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                >
                  {initials(art.name)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-ws-text truncate group-hover:text-[#1c1c1e] transition-colors">
                      {art.name}
                    </span>
                    <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#c8fa5f]/15 text-[#1c1c1e] border border-[#c8fa5f]/30 uppercase tracking-wide">
                      Active
                    </span>
                  </div>
                  <div className="text-xs text-ws-muted mb-3 truncate">{source}</div>

                  {/* Stars */}
                  <div className="flex items-center gap-1 mb-1">
                    {Array.from({ length: 5 }).map((_, si) => (
                      <Star
                        key={si}
                        className={`w-3.5 h-3.5 ${si < stars ? "text-[#fbbf24] fill-[#fbbf24]" : "text-ws-border fill-ws-border"}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-3 mt-5 pt-4 border-t border-ws-border">
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-ws-muted" />
                  <span className="text-xs font-bold text-ws-text">{art.averageScore.toFixed(1)}</span>
                </div>
                <div className="ml-auto">
                  <span className="text-xs font-bold text-ws-muted tabular-nums">
                    {art.totalVotes} votes
                  </span>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
