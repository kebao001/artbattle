"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useSWRConfig } from "swr";
import { useArtworks } from "@/hooks/use-artworks";
import { ArtworkRow } from "./artwork-row";
import { PaginationNav } from "@/components/ui/pagination-nav";
import { useGalleryRealtimeStore } from "@/stores/gallery-realtime-store";

type SortMode = "newest" | "most_votes" | "top_rated";
type ColId = "name" | "score" | "votes" | "battles" | "date";

const PAGE_SIZE = 8;

const SORT_OPTIONS: { label: string; value: SortMode; col: ColId }[] = [
  { label: "Top Rated",  value: "top_rated",  col: "score" },
  { label: "Most Voted", value: "most_votes", col: "votes" },
  { label: "Newest",     value: "newest",     col: "date"  },
];

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative overflow-hidden rounded-full border-2 border-black px-5 py-2.5 shrink-0"
      style={{
        backgroundColor: active ? "#000" : "transparent",
        transition: "background-color 0.3s cubic-bezier(0.165, 0.84, 0.44, 1)",
      }}
    >
      <span className="relative block overflow-hidden" style={{ lineHeight: "1.4em" }}>
        <span
          className="block text-black font-bold text-[15px] whitespace-nowrap"
          style={{
            transform: active ? "translateY(100%)" : "translateY(0)",
            transition: "transform 0.45s cubic-bezier(0.165, 0.84, 0.44, 1)",
          }}
        >
          {label}
        </span>
        <span
          className="absolute inset-0 text-[#f3efef] font-bold text-[15px] whitespace-nowrap"
          style={{
            transform: active ? "translateY(0)" : "translateY(-100%)",
            transition: "transform 0.45s cubic-bezier(0.165, 0.84, 0.44, 1)",
          }}
        >
          {label}
        </span>
      </span>
    </button>
  );
}

function ColHeader({
  label,
  highlighted,
  desc,
}: {
  label: string;
  highlighted: boolean;
  /** When set, always show descending-order marker (e.g. Battles: most → least). */
  desc?: boolean;
}) {
  const showChevron = highlighted || desc;
  const emphasis = highlighted || desc;
  return (
    <span
      className="text-[13px] font-bold uppercase tracking-[0.1em] py-4 block text-left whitespace-nowrap"
      style={{ opacity: emphasis ? 1 : 0.35, transition: "opacity 0.3s" }}
    >
      {label}
      {showChevron && (
        <span className="ml-1.5 inline-block text-[10px] leading-none">▾</span>
      )}
    </span>
  );
}

export function GalleryFeed() {
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [page, setPage] = useState(1);
  const [expandedId, setExpanded] = useState<string | null>(null);
  const { data, isLoading, isValidating } = useArtworks(page, PAGE_SIZE, sortMode);
  const { mutate } = useSWRConfig();
  const artworksStale = useGalleryRealtimeStore((s) => s.artworksStale);
  const clearArtworksStale = useGalleryRealtimeStore((s) => s.clearArtworksStale);

  const list = data?.artworks ?? [];
  const totalWorks = data?.total ?? 0;
  const loading = isLoading || isValidating;
  const activeCol = SORT_OPTIONS.find((o) => o.value === sortMode)!.col;

  function handleSortChange(mode: SortMode) {
    if (mode === sortMode) return;
    setExpanded(null);
    setPage(1);
    setSortMode(mode);
  }

  function handlePageChange(newPage: number) {
    setExpanded(null);
    setPage(newPage);
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => (prev === id ? null : id));
  }

  async function handleRefreshGallery() {
    await mutate(
      (key) => typeof key === "string" && key.startsWith("/api/artworks"),
      undefined,
      { revalidate: true },
    );
    clearArtworksStale();
  }

  return (
    <section>
    <div className="max-w-[1800px] mx-auto px-8 sm:px-12 lg:px-16 pt-8 sm:pt-10 lg:pt-12 pb-10 sm:pb-12">

      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 mb-5 sm:mb-7 flex-wrap">
        <h2 className="font-black text-black tracking-tight shrink-0 mr-2" style={{ fontSize: "clamp(1rem, 2.5vw, 2.25rem)" }}>
          Top Artwork for Gallery Presence
        </h2>
        {artworksStale && (
          <button
            type="button"
            onClick={() => void handleRefreshGallery()}
            aria-label="Load latest gallery artworks"
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-black px-3 py-1.5 text-[13px] font-bold uppercase tracking-wide text-black bg-[#f3efef] hover:bg-black hover:text-[#f3efef] transition-colors shrink-0"
          >
            <RefreshCw className="size-3.5 shrink-0" aria-hidden />
            Fresh
          </button>
        )}
        <span className="text-[14px] font-bold text-black/35 uppercase tracking-wide shrink-0">
          {totalWorks} works
        </span>
        <div className="flex items-center gap-1 ml-auto flex-wrap justify-end">
          {SORT_OPTIONS.map((opt) => (
            <Pill key={opt.value} label={opt.label} active={sortMode === opt.value} onClick={() => handleSortChange(opt.value)} />
          ))}
        </div>
      </div>

      {/* Column headers */}
      <div
        className="grid border-b-2 border-black"
        style={{ gridTemplateColumns: "1fr 100px 90px 80px 90px 48px", gap: "0 16px" }}
      >
        <div className="pl-2">
          <ColHeader label="Artwork" highlighted={false} />
        </div>
        <div className="hidden sm:block">
          <ColHeader label="Score" highlighted={activeCol === "score"} />
        </div>
        <div className="hidden sm:block">
          <ColHeader label="Votes" highlighted={activeCol === "votes"} />
        </div>
        <div className="hidden md:block">
          <ColHeader label="Battles" highlighted={false} desc />
        </div>
        <div className="hidden md:block">
          <ColHeader label="Date" highlighted={activeCol === "date"} />
        </div>
        <div />
      </div>

      {/* Rows */}
      {loading && list.length === 0
        ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <div key={i} className="h-[70px] border-b border-black/10 bg-black/[0.015] animate-pulse" />
          ))
        : (
          <div className="relative">
            {loading && list.length > 0 && (
              <div className="absolute inset-0 bg-white/60 z-20 pointer-events-none" style={{ transition: "opacity 0.2s" }} />
            )}
            {list.map((art, i) => (
              <ArtworkRow
                key={art.id}
                art={art}
                isLead={i === 0 && page === 1}
                expanded={expandedId === art.id}
                onToggle={() => toggleExpand(art.id)}
              />
            ))}
          </div>
        )}

      {/* Pagination */}
      {data && (
        <PaginationNav
          page={page}
          pageSize={PAGE_SIZE}
          total={data.total}
          onPageChange={handlePageChange}
        />
      )}
    </div>
    </section>
  );
}
