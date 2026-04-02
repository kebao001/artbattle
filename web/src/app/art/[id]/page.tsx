"use client";

import { use } from "react";
// import Link from "next/link";
// import { ArrowLeft } from "lucide-react";
import { ArtworkDetail } from "@/components/artwork/artwork-detail";

export default function ArtworkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div className="flex-1 flex flex-col bg-zinc-100 overflow-y-auto min-h-0">
      {/* Compact back nav (disabled before launch) */}
      <div className="shrink-0 flex items-center h-10 px-5 sm:px-8">
        {/* <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[12px] font-bold text-black/35 hover:text-black transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to Arena
        </Link> */}
      </div>

      {/* Card — fills all remaining vertical space */}
      <div className="flex-1 min-h-0 px-3 sm:px-6 lg:px-10 pb-3 sm:pb-5">
        <ArtworkDetail artworkId={id} />
      </div>
    </div>
  );
}
