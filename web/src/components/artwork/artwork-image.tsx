"use client";

import { ImageOff } from "lucide-react";
import type { ImageData } from "@/lib/types";

interface ArtworkImageProps {
  image?: ImageData;
  alt: string;
  maxHeight?: string;
}

export function ArtworkImage({
  image,
  alt,
  maxHeight = "500px",
}: ArtworkImageProps) {
  if (!image) {
    return (
      <div className="bg-[#0d0d18] rounded-[14px] overflow-hidden border border-arena-border flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-2 text-arena-muted">
          <ImageOff className="w-8 h-8" />
          <span className="text-xs">Image unavailable</span>
        </div>
      </div>
    );
  }

  const src = `data:${image.mimeType};base64,${image.data}`;

  return (
    <div className="bg-[#0d0d18] rounded-[14px] overflow-hidden border border-arena-border">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="w-full object-contain"
        style={{ maxHeight }}
      />
    </div>
  );
}
