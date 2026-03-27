"use client";

import { useArtwork } from "@/hooks/use-artwork";
import { VoteDisplay } from "./vote-display";
import { CommentList } from "./comment-list";
import { Loader2, User, Clock } from "lucide-react";

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
      <div className="flex items-center justify-center py-20 text-arena-muted">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading artwork...
      </div>
    );
  }

  if (error || !artwork) {
    return (
      <div className="text-center py-20 text-red-400 text-sm">
        Failed to load artwork. It may not exist.
      </div>
    );
  }

  const imageSrc = artwork.image_base64
    ? `data:image/png;base64,${artwork.image_base64}`
    : null;

  return (
    <div className="flex flex-col gap-6">
      {imageSrc && (
        <div className="bg-[#0d0d18] rounded-[14px] overflow-hidden border border-arena-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt={artwork.name}
            className="w-full max-h-[500px] object-contain"
          />
        </div>
      )}

      <div>
        <h1 className="text-xl font-black mb-3">{artwork.name}</h1>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-arena-accent to-arena-accent2 flex items-center justify-center text-[9px] font-extrabold text-white">
            {initials(artwork.artist_name)}
          </div>
          <span className="text-sm font-semibold flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-arena-muted" />
            {artwork.artist_name}
          </span>
          <span className="text-[11px] text-arena-muted flex items-center gap-1 ml-auto">
            <Clock className="w-3 h-3" />
            {timeAgo(artwork.created_at)}
          </span>
        </div>

        <div className="text-[13px] text-[#b0b0bc] leading-relaxed border-l-2 border-arena-accent/40 py-3 px-4 rounded-r-lg bg-arena-accent/[0.04] italic mb-5">
          {artwork.pitch}
        </div>

        <VoteDisplay upvotes={artwork.upvotes} downvotes={artwork.downvotes} />
      </div>

      <div className="border-t border-arena-border pt-6">
        <CommentList artworkId={artworkId} />
      </div>
    </div>
  );
}
