"use client";

import Link from "next/link";
import { Flame } from "lucide-react";
import { useArtwork } from "@/hooks/use-artwork";
import { ArtworkImage } from "@/components/artwork/artwork-image";
import { GalleryLoader } from "@/components/ui/gallery-loader";
import type { Artwork } from "@/lib/types";

export function ExpandedPreview({ art }: { art: Artwork }) {
  const { data, isLoading } = useArtwork(art.id);

  return (
    <div className="bg-black flex flex-col sm:flex-row gap-0">
      <div className="flex-1 min-w-0">
        {isLoading ? (
          <div
            className="w-full bg-black flex items-center justify-center"
            style={{ minHeight: 240 }}
          >
            <GalleryLoader size={80} />
          </div>
        ) : (
          <Link
            href={`/art/${art.id}`}
            onClick={(e) => e.stopPropagation()}
            className="block hover:opacity-90 transition-opacity"
          >
            <ArtworkImage image={data?.image} alt={art.name} maxHeight="420px" />
          </Link>
        )}
      </div>

      <div className="sm:w-[380px] shrink-0 flex flex-col gap-5 p-6 sm:p-10 border-l border-white/[0.06]">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.15em] text-white/30 mb-2">
            Artwork
          </p>
          <h3
            className="font-black text-[#f3efef] leading-tight"
            style={{ fontSize: "clamp(1.25rem, 2vw, 1.75rem)" }}
          >
            {data?.name ?? art.name}
          </h3>
          {data?.artistName && (
            <p className="text-[13px] font-bold text-white/35 uppercase tracking-wider mt-1.5">
              {data.artistName}
            </p>
          )}
        </div>

        {data?.pitch && (
          <p className="text-[16px] sm:text-[17px] text-white/60 leading-relaxed border-l-2 border-white/15 pl-4 flex-1">
            &ldquo;{data.pitch}&rdquo;
          </p>
        )}

        <div className="flex gap-5 text-[15px] font-bold text-[#f3efef]">
          <span className="inline-flex items-center gap-1.5"><Flame className="w-3.5 h-3.5 text-orange-400 shrink-0" strokeWidth={2.5} />{(art.hotScore ?? 0).toFixed(1)}</span>
          <span className="text-white/30">{art.totalVotes} votes</span>
          <span className="text-white/30">{art.totalBattles} battles</span>
        </div>

        <Link
          href={`/art/${art.id}`}
          className="flex items-center justify-between px-5 py-4 bg-white text-black font-black text-[15px] uppercase tracking-wide hover:bg-[#f3efef] transition-colors group"
          onClick={(e) => e.stopPropagation()}
        >
          Enter Battle Room
          <span
            className="text-[18px]"
            style={{ transform: "translateX(0)", transition: "transform 0.2s" }}
          >
            →
          </span>
        </Link>
      </div>
    </div>
  );
}
