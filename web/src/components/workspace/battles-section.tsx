"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useArtworks } from "@/hooks/use-artworks";
import { useArtwork } from "@/hooks/use-artwork";
import { ArtworkImage } from "@/components/artwork/artwork-image";
import type { Artwork } from "@/lib/types";

type SortCol = "name" | "score" | "votes" | "battles" | "date";
type SortDir = "asc" | "desc";
const FILTERS = ["All", "Top Rated", "Most Voted", "Newest"];

function initials(name: string) {
  return name.trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}
function fmtDate(d: string) {
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, "0")}.${String(dt.getMonth() + 1).padStart(2, "0")}.${String(dt.getFullYear()).slice(2)}`;
}

// ── Pill ─────────────────────────────────────────────────────────────────────
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

// ── Layer 2 + 3: Expanded preview with image, pitch, and CTA ─────────────────
function ExpandedPreview({ art }: { art: Artwork }) {
  const { data, isLoading } = useArtwork(art.id);

  return (
    <div className="bg-black flex flex-col sm:flex-row gap-0">
      {/* Image — left panel */}
      <div className="flex-1 min-w-0">
        {isLoading ? (
          <div className="w-full bg-black/60" style={{ minHeight: 240 }}>
            <div className="w-full h-full bg-white/5 animate-pulse" style={{ minHeight: 240 }} />
          </div>
        ) : (
          <Link href={`/art/${art.id}`} onClick={(e) => e.stopPropagation()} className="block hover:opacity-90 transition-opacity">
            <ArtworkImage image={data?.image} alt={art.name} maxHeight="420px" />
          </Link>
        )}
      </div>

      {/* Info — right panel */}
      <div className="sm:w-[380px] shrink-0 flex flex-col gap-5 p-6 sm:p-10 border-l border-white/[0.06]">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.15em] text-white/30 mb-2">Artwork</p>
          <h3
            className="font-black text-[#f3efef] leading-tight"
            style={{ fontSize: "clamp(1.25rem, 2vw, 1.75rem)" }}
          >
            {data?.name ?? art.name}
          </h3>
          {data?.artist_name && (
            <p className="text-[13px] font-bold text-white/35 uppercase tracking-wider mt-1.5">
              {data.artist_name}
            </p>
          )}
        </div>

        {data?.pitch && (
          <p className="text-[16px] sm:text-[17px] text-white/60 leading-relaxed border-l-2 border-white/15 pl-4 flex-1">
            &ldquo;{data.pitch}&rdquo;
          </p>
        )}

        <div className="flex gap-5 text-[15px] font-bold text-[#f3efef]">
          <span>★ {art.averageScore.toFixed(1)}</span>
          <span className="text-white/30">{art.totalVotes} votes</span>
          <span className="text-white/30">{art.totalBattles} battles</span>
        </div>

        {/* Layer 3 — CTA */}
        <Link
          href={`/art/${art.id}`}
          className="flex items-center justify-between px-5 py-4 bg-white text-black font-black text-[15px] uppercase tracking-wide hover:bg-[#f3efef] transition-colors group"
          onClick={(e) => e.stopPropagation()}
        >
          Enter Battle Room
          <span
            className="text-[18px]"
            style={{ transform: "translateX(0)", transition: "transform 0.2s" }}
          >
            →
          </span>
        </Link>
      </div>
    </div>
  );
}

// ── Layer 1: Individual artwork row ──────────────────────────────────────────
function ArtworkRow({ art, isLead, expanded, onToggle }: {
  art: Artwork; isLead: boolean; expanded: boolean; onToggle: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const active = expanded || hovered;

  const fillTx  = "transform 0.1s cubic-bezier(0.2, 0.6, 0.4, 1)";
  const colorTx = "color 0.3s, opacity 0.3s";
  const moveTx  = "color 0.3s, transform 0.3s";

  return (
    <div>
      <div
        className="relative grid items-center cursor-pointer border-b border-black/10 select-none"
        style={{ gridTemplateColumns: "1fr 100px 90px 80px 90px 48px", gap: "0 16px" }}
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

        {/* Artwork name */}
        <div
          className="relative z-10 py-5 pl-2 flex items-center gap-3"
          style={{
            color: active ? "#f3efef" : "#000",
            transform: active ? "translateX(15px)" : "translateX(0)",
            transition: moveTx,
          }}
        >
          {isLead && (
            <span
              className="w-2 h-2 rounded-full shrink-0 animate-pulse"
              style={{ backgroundColor: active ? "#f3efef" : "#000" }}
            />
          )}
          <span className="text-[17px] sm:text-[19px] font-medium truncate">
            {art.name}
          </span>
        </div>

        {/* Score */}
        <div
          className="relative z-10 py-5 text-[15px] font-bold tabular-nums hidden sm:block"
          style={{ color: active ? "#f3efef" : "#000", opacity: active ? 0.9 : 0.55, transition: colorTx }}
        >
          {art.totalVotes > 0 ? `★ ${art.averageScore.toFixed(1)}` : "—"}
        </div>

        {/* Votes */}
        <div
          className="relative z-10 py-5 text-[15px] font-medium tabular-nums hidden sm:block"
          style={{ color: active ? "#f3efef" : "#000", opacity: active ? 0.7 : 0.4, transition: colorTx }}
        >
          {art.totalVotes}
        </div>

        {/* Battles */}
        <div
          className="relative z-10 py-5 text-[15px] font-medium tabular-nums hidden md:block"
          style={{ color: active ? "#f3efef" : "#000", opacity: active ? 0.7 : 0.4, transition: colorTx }}
        >
          {art.totalBattles}
        </div>

        {/* Date */}
        <div
          className="relative z-10 py-5 text-[15px] font-medium tabular-nums hidden md:block"
          style={{ color: active ? "#f3efef" : "#000", opacity: active ? 0.6 : 0.35, transition: colorTx }}
        >
          {fmtDate(art.created_at)}
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
            key={`preview-${art.id}`}
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ overflow: "hidden" }}
          >
            <ExpandedPreview art={art} />
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

  const list = useMemo((): Artwork[] => {
    let raw = [...(data?.artworks ?? [])];
    if (filter === "Top Rated") return raw.sort((a, b) => b.averageScore - a.averageScore);
    if (filter === "Most Voted") return raw.sort((a, b) => b.totalVotes - a.totalVotes);
    if (filter === "Newest")    return raw.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return raw.sort((a, b) => {
      let cmp = 0;
      if (sortCol === "name")  cmp = a.name.localeCompare(b.name);
      else if (sortCol === "score") cmp = a.averageScore - b.averageScore;
      else if (sortCol === "votes") cmp = a.totalVotes - b.totalVotes;
      else if (sortCol === "battles") cmp = a.totalBattles - b.totalBattles;
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
    <section>
    <div className="max-w-[1800px] mx-auto px-8 sm:px-12 lg:px-16 pt-8 sm:pt-10 lg:pt-12 pb-10 sm:pb-12">

      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 mb-5 sm:mb-7 flex-wrap">
        <h2 className="font-black text-black tracking-tight shrink-0 mr-2" style={{ fontSize: "clamp(1rem, 2.5vw, 2.25rem)" }}>
          Top Artwork for Gallery Presence
        </h2>
        <span className="text-[14px] font-bold text-black/35 uppercase tracking-wide shrink-0">
          {list.length} works
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
        style={{ gridTemplateColumns: "1fr 100px 90px 80px 90px 48px", gap: "0 16px" }}
      >
        <div className="pl-2">
          <SortHeader col="name" label="Artwork" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
        </div>
        <div className="hidden sm:block">
          <SortHeader col="score" label="Score" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
        </div>
        <div className="hidden sm:block">
          <SortHeader col="votes" label="Votes" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
        </div>
        <div className="hidden md:block">
          <SortHeader col="battles" label="Battles" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
        </div>
        <div className="hidden md:block">
          <SortHeader col="date" label="Date" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
        </div>
        <div />
      </div>

      {/* Rows */}
      {list.length === 0
        ? Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-[70px] border-b border-black/10 bg-black/[0.015] animate-pulse" />
          ))
        : list.map((art, i) => (
            <ArtworkRow
              key={art.id}
              art={art}
              isLead={i === 0}
              expanded={expandedId === art.id}
              onToggle={() => toggleExpand(art.id)}
            />
          ))}
    </div>
    </section>
  );
}
