"use client";

import { useArtwork } from "@/hooks/use-artwork";
import { BattleThread } from "./battle-thread";
import { Loader2, Flame, Users } from "lucide-react";

import type { ImageData } from "@/lib/types";

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

function CardImage({ image, alt }: { image?: ImageData; alt: string }) {
  if (!image) {
    return (
      <div className="flex flex-col items-center gap-2 text-zinc-300">
        <span className="text-xs font-bold uppercase tracking-wider">No image</span>
      </div>
    );
  }
  return (
    <img
      src={`data:${image.mimeType};base64,${image.data}`}
      alt={alt}
      className="w-full h-full object-contain drop-shadow-[0_16px_48px_rgba(0,0,0,0.18)]"
    />
  );
}

interface ArtworkDetailProps {
  artworkId: string;
}

export function ArtworkDetail({ artworkId }: ArtworkDetailProps) {
  const { data: artwork, isLoading, error } = useArtwork(artworkId);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center gap-2 text-black/40">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-[13px] font-bold uppercase tracking-wider">Loading artwork...</span>
      </div>
    );
  }

  if (error || !artwork) {
    return (
      <div className="h-full flex items-center justify-center text-[13px] font-bold text-red-500 uppercase tracking-wider">
        Failed to load artwork.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {/* ── Shareable card ─────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto w-full" style={{ height: "calc(100vh - 160px)" }}>
        <div
          className="h-full bg-white border border-zinc-100 rounded-2xl overflow-hidden
            shadow-[0_4px_32px_rgba(0,0,0,0.08)] grid grid-cols-1 md:grid-cols-5"
        >
          {/* Left — image (3/5) */}
          <div className="md:col-span-3 h-full bg-zinc-50 flex items-center justify-center p-6 sm:p-10 min-h-[200px]">
            <CardImage image={artwork.image} alt={artwork.name} />
          </div>

          {/* Right — metadata (2/5) */}
          <div className="md:col-span-2 flex flex-col px-10 sm:px-14 py-10 sm:py-12 border-t border-zinc-100 md:border-t-0 md:border-l overflow-hidden">

            {/* Content block — vertically centered */}
            <div className="flex-1 flex flex-col justify-center gap-7 min-h-0">

              {/* Title */}
              <h1
                className="font-black text-black tracking-tight leading-[1.1]"
                style={{ fontSize: "clamp(2rem, 3.5vw, 2.75rem)" }}
              >
                {artwork.name}
              </h1>

              {/* Stats row */}
              <div className="flex items-center gap-6 border-y border-zinc-100 py-4">
                <div className="flex items-center gap-2.5">
                  <Flame className="w-5 h-5 text-orange-400 shrink-0" strokeWidth={2} />
                  <span className="text-xl font-black text-black tabular-nums">{(artwork.hotScore ?? 0).toFixed(1)}</span>
                </div>
                <div className="w-[1px] h-5 bg-zinc-200 shrink-0" />
                <div className="flex items-center gap-2.5">
                  <Users className="w-5 h-5 text-zinc-400 shrink-0" strokeWidth={2} />
                  <span className="text-xl font-bold text-zinc-500 tabular-nums">{artwork.totalVotes} <span className="text-lg uppercase tracking-wide">votes</span></span>
                </div>
              </div>

              {/* Artist + date */}
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-black flex items-center justify-center text-[12px] font-black text-white shrink-0">
                  {initials(artwork.artist_name)}
                </div>
                <div>
                  <div className="text-xl font-bold text-black leading-tight">{artwork.artist_name}</div>
                  <div className="text-sm font-bold text-zinc-400 uppercase tracking-wider">{timeAgo(artwork.created_at)}</div>
                </div>
              </div>

              {/* Pitch — h-auto vertical bar */}
              <div className="border-l-4 border-black pl-6">
                <p className="text-xl text-zinc-500 leading-relaxed">{artwork.pitch}</p>
              </div>

              {/* Technical metadata grid */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 pt-5 border-t border-zinc-100">
                {([
                  { label: "Submitted", value: new Date(artwork.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) },
                  { label: "Ref", value: `#${artwork.id.slice(0, 8).toUpperCase()}` },
                  { label: "Votes Cast", value: String(artwork.totalVotes) },
                  { label: "Hot Score", value: (artwork.hotScore ?? 0).toFixed(1) },
                ] as const).map(({ label, value }) => (
                  <div key={label}>
                    <div className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">{label}</div>
                    <div className="text-base font-bold text-zinc-600 tabular-nums">{value}</div>
                  </div>
                ))}
              </div>

            </div>

            {/* Footer watermark */}
            <div className="shrink-0 pt-6 mt-6 border-t border-zinc-50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.15em] text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-zinc-300" />
                Art Battle Arena
              </div>
              <span className="text-xs font-bold text-zinc-300 tabular-nums">artbattle.arena</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Below-card: battle thread ──────────────────────────────── */}
      <div className="max-w-[900px] mx-auto w-full px-4 sm:px-8 pb-20">
        <div className="border-t-2 border-black/10 pt-10">
          <BattleThread artworkId={artworkId} />
        </div>
      </div>
    </div>
  );
}
