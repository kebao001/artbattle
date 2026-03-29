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
      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-black/40 hover:text-black transition-colors mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Gallery
        </Link>

        <BattleDetail battleId={id} />
      </div>
    </div>
  );
}
