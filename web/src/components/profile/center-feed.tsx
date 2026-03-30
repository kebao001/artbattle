"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Swords, ThumbsUp } from "lucide-react";
import { useArtworks } from "@/hooks/use-artworks";
import type { Artwork } from "@/lib/types";

function initials(name: string) {
  return name.trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function timeAgo(dateStr: string) {
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function ActiveBattle({ artA, artB }: { artA: Artwork; artB: Artwork }) {
  const totalVotes = artA.totalVotes + artB.totalVotes;
  const pctA = totalVotes > 0 ? Math.round((artA.averageScore / (artA.averageScore + artB.averageScore + 0.001)) * 100) : 50;
  const pctB = 100 - pctA;

  return (
    <div className="bg-white/[0.02] border border-white/[0.05] rounded-[14px] overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.04] bg-arena-accent/[0.04]">
        <Swords className="w-4.5 h-4.5 text-arena-accent" />
        <span className="text-base font-black text-arena-accent uppercase tracking-wide">Active Battle</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-arena-green animate-pulse" />
          <span className="text-sm font-bold text-arena-green">LIVE</span>
        </div>
      </div>

      <div className="px-5 py-3">
        <div className="text-base font-black text-arena-text">
          {artA.name} <span className="text-arena-muted font-normal text-sm">vs.</span> {artB.name}
        </div>
      </div>

      <div className="flex gap-0 px-5 pb-4">
        <Link href={`/art/${artA.id}`} className="flex-1 flex flex-col gap-3 p-4 rounded-xl bg-arena-accent/[0.04] border border-arena-accent/10 hover:border-arena-accent/30 transition-all group">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-arena-accent to-arena-accent2 flex items-center justify-center text-xs font-extrabold text-white shrink-0">
              {initials(artA.name)}
            </div>
            <span className="text-sm font-bold truncate group-hover:text-arena-accent transition-colors">{artA.name}</span>
          </div>
          <p className="text-sm text-[#666] leading-relaxed line-clamp-3 italic">&ldquo;{artA.pitch}&rdquo;</p>
          <div className="flex items-center gap-2 mt-auto">
            <ThumbsUp className="w-4 h-4 text-arena-green" />
            <span className="text-sm font-bold text-arena-green">{artA.averageScore.toFixed(1)}</span>
          </div>
        </Link>

        <div className="flex flex-col items-center justify-center px-4 gap-1 shrink-0">
          <span className="text-lg font-black text-arena-muted">VS</span>
          <div className="w-px h-10 bg-white/[0.06]" />
        </div>

        <Link href={`/art/${artB.id}`} className="flex-1 flex flex-col gap-3 p-4 rounded-xl bg-arena-cyan/[0.04] border border-arena-cyan/10 hover:border-arena-cyan/30 transition-all group">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-arena-cyan to-arena-accent flex items-center justify-center text-xs font-extrabold text-white shrink-0">
              {initials(artB.name)}
            </div>
            <span className="text-sm font-bold truncate group-hover:text-arena-cyan transition-colors">{artB.name}</span>
          </div>
          <p className="text-sm text-[#666] leading-relaxed line-clamp-3 italic">&ldquo;{artB.pitch}&rdquo;</p>
          <div className="flex items-center gap-2 mt-auto">
            <ThumbsUp className="w-4 h-4 text-arena-cyan" />
            <span className="text-sm font-bold text-arena-cyan">{artB.averageScore.toFixed(1)}</span>
          </div>
        </Link>
      </div>

      <div className="px-5 pb-5">
        <div className="flex justify-between text-sm font-bold mb-2">
          <span className="text-arena-accent">{artA.name.split(" ")[0]} {pctA}%</span>
          <span className="text-arena-cyan">{artB.name.split(" ")[0]} {pctB}%</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden flex bg-white/[0.05]">
          <div className="h-full bg-gradient-to-r from-arena-accent to-arena-accent/70 transition-all duration-500" style={{ width: `${pctA}%` }} />
          <div className="h-full bg-gradient-to-l from-arena-cyan to-arena-cyan/70 flex-1 transition-all duration-500" />
        </div>
      </div>
    </div>
  );
}

export function CenterFeed() {
  const { data } = useArtworks(1, 20);

  const { battlePair, recent } = useMemo(() => {
    const list = data?.artworks ?? [];
    const byActivity = [...list].sort((a, b) => b.totalVotes - a.totalVotes);
    return {
      battlePair: byActivity.length >= 2 ? ([byActivity[0], byActivity[1]] as [Artwork, Artwork]) : null,
      recent: byActivity.slice(2, 8),
    };
  }, [data]);

  if (!data) {
    return <div className="flex items-center justify-center py-16 text-arena-muted">Loading battles…</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {battlePair && <ActiveBattle artA={battlePair[0]} artB={battlePair[1]} />}

      {/* Recent Battles */}
      {recent.length > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-[14px] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.04]">
            <span className="text-sm font-bold uppercase tracking-widest text-arena-muted">Recent Battles</span>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {recent.map((art) => {
              const net = art.averageScore;
              const won = net >= 0;
              return (
                <Link key={art.id} href={`/art/${art.id}`}>
                  <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors group">
                    <span className={`text-xs font-black px-2.5 py-1 rounded shrink-0 ${won ? "bg-arena-green/10 text-arena-green border border-arena-green/20" : "bg-arena-red/10 text-arena-red border border-arena-red/20"}`}>
                      {won ? "WIN" : "LOSS"}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-arena-accent to-arena-accent2 flex items-center justify-center text-xs font-extrabold text-white shrink-0">
                      {initials(art.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate group-hover:text-arena-accent transition-colors">{art.name}</div>
                      <div className="text-xs text-arena-muted mt-0.5">{timeAgo(art.created_at)}</div>
                    </div>
                    <span className={`text-sm font-bold tabular-nums shrink-0 ${net >= 0 ? "text-arena-green" : "text-arena-red"}`}>
                      {net > 0 ? "+" : ""}{net}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
