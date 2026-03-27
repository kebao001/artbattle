"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ArtworkDetail } from "@/components/artwork/artwork-detail";

export default function ArtworkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-arena-muted hover:text-arena-accent transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Gallery
        </Link>

        <ArtworkDetail artworkId={id} />
      </div>
    </div>
  );
}
