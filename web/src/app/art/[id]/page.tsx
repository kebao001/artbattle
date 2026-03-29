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
    <div className="flex-1 overflow-y-auto bg-[#f3efef]">
      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[13px] font-bold text-black/40 hover:text-black transition-colors mb-8 uppercase tracking-wider"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Arena
        </Link>

        <ArtworkDetail artworkId={id} />
      </div>
    </div>
  );
}
