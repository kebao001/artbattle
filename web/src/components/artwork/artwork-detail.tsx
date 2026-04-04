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
      <div className="max-w-7xl mx-auto w-full">
        <div
          className="bg-white border border-zinc-100 rounded-2xl overflow-hidden
            shadow-[0_4px_32px_rgba(0,0,0,0.08)] flex flex-col lg:flex-row lg:h-[calc(100vh-200px)]"
        >
          {/* Image panel — full width on mobile, 3/5 on desktop */}
          <div className="lg:w-3/5 bg-zinc-50 flex items-center justify-center p-6 sm:p-10 min-h-[260px] lg:min-h-0 lg:h-full shrink-0">
            <CardImage image={artwork.image} alt={artwork.name} />
          </div>

          {/* Metadata panel — full width on mobile, 2/5 + scrollable on desktop */}
          <div
            className="lg:w-2/5 flex flex-col border-t lg:border-t-0 lg:border-l border-zinc-100 overflow-y-auto
              p-6 sm:p-8 lg:px-14 lg:pt-12 lg:pb-10"
          >
            {/* Main content — flows from top */}
            <div className="flex flex-col gap-6">

              {/* Title */}
              <h1
                className="font-black text-black tracking-tight leading-[1.1] text-3xl sm:text-4xl lg:text-5xl"
                style={{ overflowWrap: "break-word", hyphens: "auto" }}
              >
                {artwork.name}
              </h1>

              {/* Stats row */}
              <div className="flex items-center gap-5 border-y border-zinc-100 py-4">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-400 shrink-0" strokeWidth={2} />
                  <span className="text-xl font-black text-black tabular-nums">
                    {(artwork.hotScore ?? 0).toFixed(1)}
                  </span>
                </div>
                <div className="w-[1px] h-5 bg-zinc-200 shrink-0" />
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-zinc-400 shrink-0" strokeWidth={2} />
                  <span className="text-xl font-bold text-zinc-500 tabular-nums">
                    {artwork.totalVotes}{" "}
                    <span className="text-base uppercase tracking-wide">votes</span>
                  </span>
                </div>
              </div>

              {/* Artist + date */}
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-black flex items-center justify-center text-[12px] font-black text-white shrink-0">
                  {initials(artwork.artistName)}
                </div>
                <div>
                  <div
                    className="text-lg font-bold text-black leading-tight"
                    style={{ overflowWrap: "break-word" }}
                  >
                    {artwork.artistName}
                  </div>
                  <div className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
                    {timeAgo(artwork.createdAt)}
                  </div>
                </div>
              </div>

              {/* Pitch */}
              <div className="border-l-4 border-black pl-5">
                <p
                  className="text-base lg:text-lg text-zinc-500 leading-relaxed"
                  style={{ overflowWrap: "break-word" }}
                >
                  {artwork.pitch}
                </p>
              </div>

              {/* Technical metadata grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-5 pt-5 border-t border-zinc-100">
                {([
                  {
                    label: "Submitted",
                    value: new Date(artwork.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }),
                  },
                  { label: "Ref", value: `#${artwork.id.slice(0, 8).toUpperCase()}` },
                  { label: "Votes Cast", value: String(artwork.totalVotes) },
                  { label: "Hot Score", value: (artwork.hotScore ?? 0).toFixed(1) },
                ] as const).map(({ label, value }) => (
                  <div key={label} className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                      {label}
                    </div>
                    <div
                      className="text-sm font-bold text-zinc-600 tabular-nums truncate"
                    >
                      {value}
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* Footer watermark — pushed to bottom on desktop via mt-auto */}
            <div className="mt-8 lg:mt-auto pt-5 border-t border-zinc-100 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.15em] text-zinc-300 shrink-0">
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
