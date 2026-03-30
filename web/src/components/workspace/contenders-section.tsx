"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useArtworks } from "@/hooks/use-artworks";
import { useArtwork } from "@/hooks/use-artwork";
import type { Artwork } from "@/lib/types";

type ViewMode = "List" | "Grid";
type SortCol = "artwork" | "score" | "votes" | "date";
type SortDir = "asc" | "desc";
const FILTERS = ["All", "Top Rated", "Rising", "New", "Trending", "No Vote"];

function initials(name: string) {
  return name.trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}
function fmtScore(s: number, total: number): string | null {
  return total === 0 ? null : s.toFixed(1);
}
function fmtDate(d: string) {
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, "0")}.${String(dt.getMonth() + 1).padStart(2, "0")}.${String(dt.getFullYear()).slice(2)}`;
}

// ── Animated pill (slide-in text, exact reference animation) ─────────────────
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
      {/* Wrapper clips the two text layers */}
      <span className="relative block overflow-hidden" style={{ lineHeight: "1.4em" }}>
        {/* Layer 1: dark text — slides down & out when active */}
        <span
          className="block text-black font-bold text-[15px] whitespace-nowrap"
          style={{
            transform: active ? "translateY(100%)" : "translateY(0)",
            transition: "transform 0.45s cubic-bezier(0.165, 0.84, 0.44, 1)",
          }}
        >
          {label}
        </span>
        {/* Layer 2: light text — slides in from top when active */}
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

// ── Sort column header ────────────────────────────────────────────────────────
function SortHeader({
  col, label, sortCol, sortDir, onSort,
}: {
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

// ── Expanded artwork (loaded on demand) ──────────────────────────────────────
function ExpandedArtwork({ id }: { id: string }) {
  const { data, isLoading } = useArtwork(id);

  return (
    <div className="bg-black flex flex-col sm:flex-row gap-6 p-6 sm:p-8" style={{ minHeight: 200 }}>
      {/* Image */}
      <div className="flex-1 min-w-0">
        {isLoading ? (
          <div className="w-full h-48 bg-white/5 animate-pulse" />
        ) : data?.image ? (
          <img src={`data:${data.image.mimeType};base64,${data.image.data}`} alt={data?.name} className="max-h-[420px] max-w-full object-contain" />
        ) : (
          <div className="w-full max-w-sm aspect-video bg-white/5 flex items-center justify-center font-black text-white/15 text-5xl">
            {data ? initials(data.name) : "…"}
          </div>
        )}
      </div>
      {/* Info */}
      {data && (
        <div className="sm:w-64 shrink-0 flex flex-col gap-4">
          <h3 className="text-[22px] font-black text-[#f3efef] leading-tight">{data.name}</h3>
          {data.artist_name && (
            <p className="text-[14px] font-bold text-white/40 uppercase tracking-wider">{data.artist_name}</p>
          )}
          <p className="text-[16px] text-white/55 leading-relaxed border-l-2 border-white/15 pl-3 flex-1">
            {data.pitch}
          </p>
          <div className="flex gap-5 text-[16px] font-black text-[#f3efef]">
            <span>★ {data.averageScore.toFixed(1)}</span>
            <span className="text-white/30">{data.totalVotes} votes</span>
          </div>
          <Link
            href={`/art/${id}`}
            className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/35 hover:text-white transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            Full view →
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Individual list row ───────────────────────────────────────────────────────
function ListRow({ art, expanded, onToggle }: { art: Artwork; expanded: boolean; onToggle: () => void }) {
  const [hovered, setHovered] = useState(false);
  const active = expanded || hovered;
  const score = fmtScore(art.averageScore, art.totalVotes);

  // Shared transition strings
  const colorTx = "color 0.3s, opacity 0.3s";
  const moveTx  = "color 0.3s, transform 0.3s";
  const fillTx  = "transform 0.1s cubic-bezier(0.2, 0.6, 0.4, 1)";

  return (
    <div>
      <div
        className="relative grid items-center cursor-pointer border-b border-black/10 select-none"
        style={{ gridTemplateColumns: "1fr 90px 70px 90px 48px", gap: "0 16px" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={onToggle}
      >
        {/* Black fill — snaps in 100ms, origin differs: hover=top, open=bottom */}
        <div
          className="absolute inset-0 bg-black pointer-events-none"
          style={{
            transform: active ? "scaleY(1)" : "scaleY(0)",
            transformOrigin: expanded ? "center bottom" : "center top",
            transition: fillTx,
          }}
        />

        {/* Artwork name — slides right when active */}
        <div
          className="relative z-10 py-5 pl-2 text-[17px] sm:text-[19px] font-medium truncate"
          style={{
            color: active ? "#f3efef" : "#000",
            transform: active ? "translateX(15px)" : "translateX(0)",
            transition: moveTx,
          }}
        >
          {art.name}
        </div>

        {/* Score */}
        <div
          className="relative z-10 py-5 text-[15px] sm:text-[16px] font-bold tabular-nums hidden sm:block"
          style={{
            color: active ? "#f3efef" : "#000",
            opacity: active ? 0.9 : 0.55,
            transition: colorTx,
          }}
        >
          {score ?? "—"}
        </div>

        {/* Votes */}
        <div
          className="relative z-10 py-5 text-[15px] sm:text-[16px] font-medium tabular-nums hidden md:block"
          style={{
            color: active ? "#f3efef" : "#000",
            opacity: active ? 0.7 : 0.4,
            transition: colorTx,
          }}
        >
          {art.totalVotes}
        </div>

        {/* Date */}
        <div
          className="relative z-10 py-5 text-[15px] sm:text-[16px] font-medium tabular-nums hidden sm:block"
          style={{
            color: active ? "#f3efef" : "#000",
            opacity: active ? 0.6 : 0.35,
            transition: colorTx,
          }}
        >
          {fmtDate(art.created_at)}
        </div>

        {/* Toggle +/– — slides left when active */}
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

      {/* Inline expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            key={`exp-${art.id}`}
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ overflow: "hidden" }}
          >
            <ExpandedArtwork id={art.id} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Grid card with hover scale + dim ─────────────────────────────────────────
function GridCard({ art, dimmed }: { art: Artwork; dimmed: boolean }) {
  const hasScore = art.totalVotes > 0;
  return (
    <Link href={`/art/${art.id}`}>
      <div
        className="border-2 border-black/15 p-4 hover:border-black cursor-pointer"
        style={{
          opacity: dimmed ? 0.2 : 1,
          transform: dimmed ? "scale(0.97)" : "scale(1)",
          transition: dimmed
            ? "opacity 1s cubic-bezier(0.2, 0.6, 0.4, 1), transform 1s cubic-bezier(0.2, 0.6, 0.4, 1)"
            : "opacity 0.3s cubic-bezier(0.2, 0.6, 0.4, 1), transform 0.3s cubic-bezier(0.2, 0.6, 0.4, 1), border-color 0.2s",
        }}
      >
        <div className="bg-black flex items-center justify-center font-black text-[#f3efef] mb-3 aspect-square w-12 text-lg">
          {initials(art.name)}
        </div>
        <p className="text-[13px] font-black text-black truncate">{art.name}</p>
        {hasScore && (
          <p className="text-[10px] font-bold text-black/35 mt-2 uppercase tracking-wide">
            ★ {art.averageScore.toFixed(1)} · {art.totalVotes}v
          </p>
        )}
      </div>
    </Link>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function ContendersSection() {
  const [view, setView]           = useState<ViewMode>("List");
  const [filter, setFilter]       = useState("All");
  const [sortCol, setSortCol]     = useState<SortCol>("date");
  const [sortDir, setSortDir]     = useState<SortDir>("desc");
  const [expandedId, setExpanded] = useState<string | null>(null);
  const [hoveredCard, setHovered] = useState<string | null>(null);
  const { data } = useArtworks(1, 20);

  const list = useMemo(() => {
    let raw = [...(data?.artworks ?? [])];
    if (filter === "Top Rated") return raw.sort((a, b) => b.averageScore - a.averageScore);
    if (filter === "New")       return raw.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (filter === "Trending")  return raw.sort((a, b) => b.totalVotes - a.totalVotes);
    if (filter === "Rising")    raw = raw.filter((a) => a.averageScore > 0 && a.totalVotes > 0);
    if (filter === "No Vote")   raw = raw.filter((a) => a.totalVotes === 0);
    // Apply column sort when on "All" (or after slice filters)
    return raw.sort((a, b) => {
      let cmp = 0;
      if (sortCol === "artwork") cmp = a.name.localeCompare(b.name);
      else if (sortCol === "score") cmp = a.averageScore - b.averageScore;
      else if (sortCol === "votes") cmp = a.totalVotes - b.totalVotes;
      else cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, filter, sortCol, sortDir]);

  function handleSort(col: SortCol) {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("desc"); }
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => (prev === id ? null : id));
  }

  return (
    <section className="border-b-2 border-black/10">
    <div className="max-w-[1800px] mx-auto px-8 sm:px-12 lg:px-16 pt-8 sm:pt-10 lg:pt-12 pb-8">

      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 mb-5 sm:mb-7 flex-wrap">
        <h2 className="font-black text-black tracking-tight shrink-0 mr-2" style={{ fontSize: "clamp(1.25rem, 3vw, 2.25rem)" }}>
          New Contenders
        </h2>
        <span className="text-[14px] font-bold text-black/35 uppercase tracking-wide shrink-0">
          {list.length} works
        </span>

        {/* List / Grid toggle */}
        <div className="flex items-center gap-1">
          {(["List", "Grid"] as ViewMode[]).map((v) => (
            <Pill key={v} label={v} active={view === v} onClick={() => setView(v)} />
          ))}
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1 ml-auto flex-wrap justify-end">
          {FILTERS.map((f) => (
            <Pill key={f} label={f} active={filter === f} onClick={() => setFilter(f)} />
          ))}
        </div>
      </div>

      {/* ── LIST VIEW ─────────────────────────────────────── */}
      {view === "List" && (
        <div>
          {/* Column headers */}
          <div
            className="grid border-b-2 border-black"
            style={{ gridTemplateColumns: "1fr 90px 70px 90px 48px", gap: "0 16px" }}
          >
            <div className="pl-2">
              <SortHeader col="artwork" label="Artwork" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
            </div>
            <div className="hidden sm:block">
              <SortHeader col="score" label="Score" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
            </div>
            <div className="hidden md:block">
              <SortHeader col="votes" label="Votes" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
            </div>
            <div className="hidden sm:block">
              <SortHeader col="date" label="Date" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
            </div>
            <div />
          </div>

          {/* Rows */}
          {list.length === 0
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-[70px] border-b border-black/10 bg-black/[0.015] animate-pulse" />
              ))
            : list.map((art) => (
                <ListRow
                  key={art.id}
                  art={art}
                  expanded={expandedId === art.id}
                  onToggle={() => toggleExpand(art.id)}
                />
              ))}
        </div>
      )}

      {/* ── GRID VIEW ─────────────────────────────────────── */}
      {view === "Grid" && (
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}
        >
          {list.length === 0
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-[160px] border-2 border-black/10 animate-pulse" />
              ))
            : list.map((art) => (
                <div
                  key={art.id}
                  onMouseEnter={() => setHovered(art.id)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <GridCard art={art} dimmed={hoveredCard !== null && hoveredCard !== art.id} />
                </div>
              ))}
        </div>
      )}
    </div>
    </section>
  );
}
