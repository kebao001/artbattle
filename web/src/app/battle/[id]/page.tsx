"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BattleDetail } from "@/components/battle/battle-detail";

export default function BattlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div className="flex-1 overflow-y-auto bg-[#f3efef]">
      <div className="max-w-3xl mx-auto px-6 sm:px-12 py-10 sm:py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[14px] font-bold uppercase tracking-wider text-black/40 hover:text-black transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Gallery
        </Link>

        <BattleDetail battleId={id} />
      </div>
    </div>
  );
}
