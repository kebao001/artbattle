"use client";

import { ImageOff } from "lucide-react";
import type { ImageData } from "@/lib/types";

interface OverlayMeta {
  artist: string;
  score: number;
  votes: number;
}

interface ArtworkImageProps {
  image?: ImageData;
  alt: string;
  maxHeight?: string;
  cinematic?: boolean;
  overlayMeta?: OverlayMeta;
}

export function ArtworkImage({
  image,
  alt,
  maxHeight = "500px",
  cinematic = false,
  overlayMeta,
}: ArtworkImageProps) {
  if (!image) {
    return cinematic ? (
      <div className="flex justify-center py-20">
        <div className="flex flex-col items-center gap-2 text-black/25">
          <ImageOff className="w-10 h-10" />
          <span className="text-xs font-bold uppercase tracking-wider">Image unavailable</span>
        </div>
      </div>
    ) : (
      <div className="bg-black overflow-hidden border-2 border-black flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-2 text-white/40">
          <ImageOff className="w-8 h-8" />
          <span className="text-xs font-bold uppercase tracking-wider">Image unavailable</span>
        </div>
      </div>
    );
  }

  const src = image.uri;

  if (cinematic) {
    return (
      <div className="px-[27vw] sm:px-[28vw]">
        <div className="group relative w-full">
          <img
            src={src}
            alt={alt}
            className="w-full object-contain block rounded-xl border border-white/5
              drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)]
              hover:scale-[1.03] hover:drop-shadow-[0_30px_60px_rgba(0,0,0,0.5)] hover:ring-1 hover:ring-cyan-500/30
              transition-all duration-500 ease-out"
            style={{ maxHeight: "56vh" }}
          />

          {overlayMeta && (
            <div
              className="absolute bottom-0 left-0 right-0 rounded-b-xl overflow-hidden
                opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            >
              <div className="bg-gradient-to-t from-black/70 to-transparent px-5 pt-8 pb-4 flex items-end justify-between">
                <span className="text-[13px] font-bold text-white/70 uppercase tracking-widest">
                  {overlayMeta.artist}
                </span>
                <span className="text-[13px] font-bold text-white/60 tabular-nums">
                  ★ {overlayMeta.score.toFixed(1)}
                  <span className="text-white/35 ml-2">{overlayMeta.votes} votes</span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black overflow-hidden border-2 border-black">
      <img
        src={src}
        alt={alt}
        className="w-full object-contain"
        style={{ maxHeight }}
      />
    </div>
  );
}
