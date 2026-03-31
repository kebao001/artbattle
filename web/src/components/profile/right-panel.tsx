"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Trophy, Clock } from "lucide-react";
import { useArtworks } from "@/hooks/use-artworks";

function initials(name: string) {
  return name.trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

const MEDALS = ["🥇", "🥈", "🥉"];

export function RightPanel() {
  const { data } = useArtworks(1, 20);

  const { topFive, recentSix } = useMemo(() => {
    const list = data?.artworks ?? [];
    return {
      topFive: [...list].sort((a, b) => b.averageScore - a.averageScore).slice(0, 5),
      recentSix: [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6),
    };
  }, [data]);

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Hall of Fame */}
      <div className="bg-white/[0.02] border border-white/[0.05] rounded-[14px] overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-white/[0.04]">
          <Trophy className="w-4.5 h-4.5 text-arena-yellow" />
          <span className="text-sm font-bold uppercase tracking-widest text-arena-muted">Artist Hall of Fame</span>
        </div>
        {topFive.length === 0 ? (
          <p className="text-sm text-[#444] text-center py-6">Loading…</p>
        ) : (
          <div className="divide-y divide-white/[0.03]">
            {topFive.map((art, i) => {
              const net = art.averageScore;
              const isTop = i === 0;
              return (
                <Link key={art.id} href={`/art/${art.id}`}>
                  <div className={`flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition-colors group ${isTop ? "bg-arena-yellow/[0.03]" : ""}`}>
                    <span className="w-6 text-center text-lg shrink-0 leading-none">
                      {MEDALS[i] ?? <span className="text-sm font-bold text-arena-muted">{i + 1}</span>}
                    </span>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-extrabold text-white shrink-0 ${isTop ? "bg-gradient-to-br from-arena-yellow to-[#f97316] ring-1 ring-arena-yellow/30" : "bg-gradient-to-br from-arena-accent to-arena-accent2"}`}>
                      {initials(art.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate group-hover:text-arena-accent transition-colors">{art.name}</div>
                      <div className={`text-xs font-bold tabular-nums ${net >= 0 ? "text-arena-green" : "text-arena-red"}`}>
                        {net > 0 ? "+" : ""}{net} pts
                      </div>
                    </div>
                    {isTop && <div className="w-2 h-2 rounded-full bg-arena-yellow animate-pulse shrink-0" />}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Latest Creations */}
      <div className="bg-white/[0.02] border border-white/[0.05] rounded-[14px] overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-white/[0.04]">
          <Clock className="w-4.5 h-4.5 text-arena-muted" />
          <span className="text-sm font-bold uppercase tracking-widest text-arena-muted">Latest Creations</span>
        </div>
        {recentSix.length === 0 ? (
          <p className="text-sm text-[#444] text-center py-6">Loading…</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 p-3">
            {recentSix.map((art) => (
              <Link key={art.id} href={`/art/${art.id}`}>
                <div className="aspect-square rounded-lg bg-gradient-to-br from-arena-accent/10 to-arena-cyan/10 border border-white/[0.04] flex flex-col items-center justify-center gap-2 p-2 hover:border-arena-accent/25 transition-all group cursor-pointer">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-arena-accent to-arena-accent2 flex items-center justify-center text-xs font-extrabold text-white">
                    {initials(art.name)}
                  </div>
                  <span className="text-xs text-center text-[#555] line-clamp-2 leading-tight group-hover:text-arena-accent transition-colors">
                    {art.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
