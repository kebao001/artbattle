"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useArtworks } from "@/hooks/use-artworks";
import { useArtwork } from "@/hooks/use-artwork";
import type { Artwork, ArtworkDetail } from "@/lib/types";

type SortCol = "artworks" | "votes" | "date";
type SortDir = "asc" | "desc";
const FILTERS = ["All", "Live Now", "Ending Soon", "Completed"];

function initials(name: string) {
  return name.trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}
function fmtDate(d: string) {
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, "0")}.${String(dt.getMonth() + 1).padStart(2, "0")}.${String(dt.getFullYear()).slice(2)}`;
}

// ── Animated pill (same as ContendersSection) ────────────────────────────────
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

// ── Sort header ───────────────────────────────────────────────────────────────
function SortHeader({ col, label, sortCol, sortDir, onSort }: {
  col: SortCol; label: string; sortCol: SortCol; sortDir: SortDir;
  onSort: (c: SortCol) => void;
}) {
  const active = sortCol === col;
  return (
    <button
      className="flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-[0.1em] py-4 text-left whitespace-nowrap"
      style={{ opacity: active ? 1 : 0.35, transition: "opacity 0.3s" }}
      onClick={() => onSort(col)}
    >
      {label}
      <span
        style={{
          display: "inline-block",
          opacity: active ? 1 : 0,
          transform: active
            ? sortDir === "asc" ? "rotate(180deg)" : "rotate(0deg)"
            : "rotate(-90deg)",
          transition: "opacity 0.45s, transform 0.45s",
          fontSize: "10px",
          lineHeight: 1,
        }}
      >
        ▾
      </span>
    </button>
  );
}

// ── Art panel (extracted to avoid component-in-render) ───────────────────────
function ArtPanel({ detail, loading, art }: { detail: ArtworkDetail | undefined; loading: boolean; art: Artwork }) {
  return (
    <div className="flex-1 min-w-0 flex flex-col gap-4">
      <div className="bg-white/5 flex items-center justify-center" style={{ minHeight: 160, aspectRatio: "16/9" }}>
        {loading ? (
          <div className="w-full h-full bg-white/5 animate-pulse" />
        ) : detail?.image ? (
          <img src={`data:${detail.image.mimeType};base64,${detail.image.data}`} alt={art.name} className="max-h-[320px] max-w-full object-contain" />
        ) : (
          <span className="font-black text-white/15 text-4xl">{initials(art.name)}</span>
        )}
      </div>
      <div>
        <p className="text-[18px] font-black text-[#f3efef] truncate">{art.name}</p>
        {detail?.artist_name && (
          <p className="text-[13px] font-bold text-white/35 uppercase tracking-wider mt-0.5">{detail.artist_name}</p>
        )}
        <div className="flex gap-4 mt-2 text-[16px] font-bold text-[#f3efef]">
          <span>★ {art.averageScore.toFixed(1)}</span>
          <span className="text-white/30">{art.totalVotes} votes</span>
        </div>
        <Link
          href={`/art/${art.id}`}
          className="inline-block text-[13px] font-bold uppercase tracking-[0.12em] text-white/35 hover:text-white transition-colors mt-2"
          onClick={(e) => e.stopPropagation()}
        >
          View →
        </Link>
      </div>
    </div>
  );
}

// ── Expanded battle detail ────────────────────────────────────────────────────
function ExpandedBattle({ artA, artB }: { artA: Artwork; artB: Artwork }) {
  const { data: detailA, isLoading: loadA } = useArtwork(artA.id);
  const { data: detailB, isLoading: loadB } = useArtwork(artB.id);

  return (
    <div className="bg-black p-6 sm:p-8 flex flex-col sm:flex-row gap-6 sm:gap-10">
      <ArtPanel detail={detailA} loading={loadA} art={artA} />
      <div className="flex items-center justify-center shrink-0 text-[40px] font-black text-white/15 self-start sm:self-center pt-4 sm:pt-0">VS</div>
      <ArtPanel detail={detailB} loading={loadB} art={artB} />
    </div>
  );
}

// ── Battle row ────────────────────────────────────────────────────────────────
type Pair = { artA: Artwork; artB: Artwork; isLive: boolean };

function BattleRow({ pair, expanded, onToggle }: { pair: Pair; expanded: boolean; onToggle: () => void }) {
  const [hovered, setHovered] = useState(false);
  const active = expanded || hovered;
  const totalVotes = pair.artA.totalVotes + pair.artB.totalVotes;

  const fillTx  = "transform 0.1s cubic-bezier(0.2, 0.6, 0.4, 1)";
  const colorTx = "color 0.3s, opacity 0.3s";
  const moveTx  = "color 0.3s, transform 0.3s";

  return (
    <div>
      <div
        className="relative grid items-center cursor-pointer border-b border-black/10 select-none"
        style={{ gridTemplateColumns: "1fr 100px 90px 90px 48px", gap: "0 16px" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={onToggle}
      >
        {/* Fill */}
        <div
          className="absolute inset-0 bg-black pointer-events-none"
          style={{
            transform: active ? "scaleY(1)" : "scaleY(0)",
            transformOrigin: expanded ? "center bottom" : "center top",
            transition: fillTx,
          }}
        />

        {/* Battle name */}
        <div
          className="relative z-10 py-5 pl-2 flex items-center gap-3"
          style={{
            color: active ? "#f3efef" : "#000",
            transform: active ? "translateX(15px)" : "translateX(0)",
            transition: moveTx,
          }}
        >
          {pair.isLive && (
            <span
              className="w-2 h-2 rounded-full shrink-0 animate-pulse"
              style={{ backgroundColor: active ? "#f3efef" : "#000" }}
            />
          )}
          <span className="text-[17px] sm:text-[19px] font-medium truncate">
            {pair.artA.name.split(" ")[0]} vs {pair.artB.name.split(" ")[0]}
          </span>
        </div>

        {/* Status */}
        <div
          className="relative z-10 py-5 text-[15px] font-bold hidden sm:block"
          style={{ color: active ? "#f3efef" : "#000", opacity: active ? 0.8 : 0.5, transition: colorTx }}
        >
          {pair.isLive ? "Live" : "Open"}
        </div>

        {/* Votes */}
        <div
          className="relative z-10 py-5 text-[15px] font-medium tabular-nums hidden sm:block"
          style={{ color: active ? "#f3efef" : "#000", opacity: active ? 0.7 : 0.4, transition: colorTx }}
        >
          {totalVotes}
        </div>

        {/* Date */}
        <div
          className="relative z-10 py-5 text-[15px] font-medium tabular-nums hidden md:block"
          style={{ color: active ? "#f3efef" : "#000", opacity: active ? 0.6 : 0.35, transition: colorTx }}
        >
          {fmtDate(pair.artA.created_at)}
        </div>

        {/* Toggle */}
        <div
          className="relative z-10 py-5 pr-2 text-[20px] font-bold text-right"
          style={{
            color: active ? "#f3efef" : "#000",
            transform: active ? "translateX(-15px)" : "translateX(0)",
            transition: moveTx,
          }}
        >
          {expanded ? "–" : "+"}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            key={`bexp-${pair.artA.id}`}
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ overflow: "hidden" }}
          >
            <ExpandedBattle artA={pair.artA} artB={pair.artB} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function BattlesSection() {
  const [filter, setFilter]       = useState("All");
  const [sortCol, setSortCol]     = useState<SortCol>("votes");
  const [sortDir, setSortDir]     = useState<SortDir>("desc");
  const [expandedId, setExpanded] = useState<string | null>(null);
  const { data } = useArtworks(1, 20);

  const pairs = useMemo((): Pair[] => {
    const list = [...(data?.artworks ?? [])].sort(
      (a, b) => {
        let cmp = 0;
        if (sortCol === "votes") cmp = a.totalVotes - b.totalVotes;
        else if (sortCol === "artworks") cmp = a.name.localeCompare(b.name);
        else cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        return sortDir === "asc" ? cmp : -cmp;
      }
    );
    const out: Pair[] = [];
    for (let i = 0; i + 1 < list.length; i += 2)
      out.push({ artA: list[i], artB: list[i + 1], isLive: i === 0 });
    return out;
  }, [data, sortCol, sortDir]);

  function handleSort(col: SortCol) {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("desc"); }
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => (prev === id ? null : id));
  }

  return (
    <section>
    <div className="max-w-[1800px] mx-auto px-8 sm:px-12 lg:px-16 pt-8 sm:pt-10 lg:pt-12 pb-10 sm:pb-12">

      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 mb-5 sm:mb-7 flex-wrap">
        <h2 className="font-black text-black tracking-tight shrink-0 mr-2" style={{ fontSize: "clamp(1.25rem, 3vw, 2.25rem)" }}>
          Active Battles
        </h2>
        <span className="text-[14px] font-bold text-black/35 uppercase tracking-wide shrink-0">
          {pairs.length * 2} works
        </span>
        <div className="flex items-center gap-1 ml-auto flex-wrap justify-end">
          {FILTERS.map((f) => (
            <Pill key={f} label={f} active={filter === f} onClick={() => setFilter(f)} />
          ))}
        </div>
      </div>

      {/* Column headers */}
      <div
        className="grid border-b-2 border-black"
        style={{ gridTemplateColumns: "1fr 100px 90px 90px 48px", gap: "0 16px" }}
      >
        <div className="pl-2">
          <SortHeader col="artworks" label="Battle" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
        </div>
        <div className="hidden sm:block">
          <SortHeader col="votes" label="Status" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
        </div>
        <div className="hidden sm:block">
          <SortHeader col="votes" label="Votes" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
        </div>
        <div className="hidden md:block">
          <SortHeader col="date" label="Date" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
        </div>
        <div />
      </div>

      {/* Rows */}
      {pairs.length === 0
        ? Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-[70px] border-b border-black/10 bg-black/[0.015] animate-pulse" />
          ))
        : pairs.map((pair) => (
            <BattleRow
              key={pair.artA.id}
              pair={pair}
              expanded={expandedId === pair.artA.id}
              onToggle={() => toggleExpand(pair.artA.id)}
            />
          ))}
    </div>
    </section>
  );
}
