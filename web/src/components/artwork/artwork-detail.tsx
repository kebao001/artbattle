"use client";

import { useArtwork } from "@/hooks/use-artwork";
import { VoteDisplay } from "./vote-display";
import { CommentList } from "./comment-list";
import { ArtworkImage } from "./artwork-image";
import { Loader2 } from "lucide-react";

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

interface ArtworkDetailProps {
  artworkId: string;
}

export function ArtworkDetail({ artworkId }: ArtworkDetailProps) {
  const { data: artwork, isLoading, error } = useArtwork(artworkId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-20 text-black/40">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-[13px] font-bold uppercase tracking-wider">Loading artwork...</span>
      </div>
    );
  }

  if (error || !artwork) {
    return (
      <div className="text-center py-20 text-[13px] font-bold text-red-600 uppercase tracking-wider">
        Failed to load artwork.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <ArtworkImage image={artwork.image} alt={artwork.name} />

      <div>
        <h1 className="font-black text-black tracking-tight leading-none mb-4" style={{ fontSize: "clamp(1.75rem, 4vw, 2.625rem)" }}>
          {artwork.name}
        </h1>

        <div className="flex items-center gap-4 mb-5 border-b-2 border-black/10 pb-5">
          <div className="w-8 h-8 bg-black flex items-center justify-center text-[10px] font-black text-[#f3efef]">
            {initials(artwork.artist_name)}
          </div>
          <span className="text-[14px] font-bold text-black">{artwork.artist_name}</span>
          <span className="text-[12px] font-bold text-black/40 ml-auto uppercase tracking-wide">
            {timeAgo(artwork.created_at)}
          </span>
        </div>

        <p className="text-[15px] text-black/60 leading-relaxed border-l-4 border-black py-3 px-5 mb-6">
          {artwork.pitch}
        </p>

        <VoteDisplay averageScore={artwork.averageScore} totalVotes={artwork.totalVotes} />
      </div>

      <div className="border-t-2 border-black/10 pt-8">
        <CommentList artworkId={artworkId} />
      </div>
    </div>
  );
}
