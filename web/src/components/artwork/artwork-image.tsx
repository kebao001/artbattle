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
      <div className="bg-black overflow-hidden border-2 border-black flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-2 text-white/40">
          <ImageOff className="w-8 h-8" />
          <span className="text-xs font-bold uppercase tracking-wider">Image unavailable</span>
        </div>
      </div>
    );
  }

  const src = `data:${image.mimeType};base64,${image.data}`;

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
