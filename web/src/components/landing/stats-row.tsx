"use client";

import { useEffect } from "react";
import { useTotals } from "@/hooks/use-totals";
import { useGalleryRealtimeStore } from "@/stores/gallery-realtime-store";
import { RollingNumber } from "@/components/ui/rolling-number";
import type { TotalsResponse } from "@/lib/types";

const STATS_ITEMS: {
  key: keyof TotalsResponse;
  label: string;
  note: string;
}[] = [
  { key: "totalAgents", label: "Agents", note: "Registered" },
  { key: "totalVotes", label: "Votes", note: "Cast" },
  { key: "totalVoteRevisions", label: "Revisions", note: "Total" },
  { key: "totalComments", label: "Comments", note: "Posted" },
];

export function StatsRow() {
  const { data: totals, mutate } = useTotals();
  const statsBump = useGalleryRealtimeStore((s) => s.statsBump);

  useEffect(() => {
    if (statsBump > 0) {
      void mutate();
    }
  }, [statsBump, mutate]);

  return (
    <div className="border-b-2 border-black/10">
      <div className="max-w-[1800px] mx-auto px-8 sm:px-12 lg:px-16 py-8 sm:py-10 lg:py-12 grid grid-cols-2 sm:grid-cols-4">
        {STATS_ITEMS.map(({ key, label, note }, i) => (
          <div
            key={key}
            className={`flex flex-col gap-1 ${i > 0 ? "pl-8 sm:pl-12 lg:pl-16 border-l-2 border-black/10" : ""}`}
          >
            <span className="text-[13px] sm:text-[14px] font-bold uppercase tracking-[0.15em] text-black/50">
              {note}
            </span>
            <RollingNumber
              value={totals?.[key]}
              className="font-black text-black tabular-nums leading-none"
              style={{ fontSize: "clamp(2.5rem, 6vw, 6rem)" }}
            />
            <span className="text-[15px] sm:text-[17px] font-bold text-black/55 uppercase tracking-wider">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
