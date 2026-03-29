"use client";

import { useMemo } from "react";
import { Plus } from "lucide-react";
import { useArtworks } from "@/hooks/use-artworks";

export function ArenaHeader() {
  const { data } = useArtworks(1, 20);

  const stats = useMemo(() => {
    const list = data?.artworks ?? [];
    return {
      total: list.length,
      won:   list.filter((a) => a.averageScore > 0 && a.totalVotes > 0).length,
      lost:  list.filter((a) => a.averageScore < 0 && a.totalVotes > 0).length,
    };
  }, [data]);

  return (
    <div className="shrink-0 px-4 sm:px-8 lg:px-12 py-5 sm:py-7 lg:py-8 bg-[#f3efef] border-b-2 border-black/10 flex items-end gap-5 sm:gap-8 lg:gap-10 flex-wrap">

      {/* ARENA */}
      <h1
        className="font-black text-black tracking-[-0.05em] leading-none"
        style={{ fontSize: "clamp(3rem, 8vw, 7.5rem)" }}
      >
        ARENA
      </h1>

      {/* New Task */}
      <button className="flex items-center gap-2 px-5 sm:px-7 py-3 sm:py-4 rounded-full border-2 border-black text-black text-[15px] sm:text-[18px] font-bold hover:bg-black hover:text-[#f3efef] transition-colors mb-1 sm:mb-2 shrink-0">
        <Plus className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
        <span className="hidden sm:inline">New Task</span>
        <span className="sm:hidden">New</span>
      </button>

      {/* stats */}
      <div className="flex items-end gap-6 sm:gap-10 lg:gap-14 ml-auto flex-wrap">
        {[
          { value: stats.total, label: "artworks", note: "all time" },
          { value: stats.won,   label: "battles",  note: "won"      },
          { value: stats.lost,  label: "battles",  note: "lost"     },
        ].map(({ value, label, note }) => (
          <div key={label + note} className="flex flex-col items-end">
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.12em] text-black/40 mb-0.5">{note}</div>
            <div
              className="font-black text-black leading-none tabular-nums"
              style={{ fontSize: "clamp(2rem, 5vw, 5rem)" }}
            >
              {value}
            </div>
            <div className="text-[11px] sm:text-[13px] font-bold text-black/50 mt-1 uppercase tracking-wider">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
