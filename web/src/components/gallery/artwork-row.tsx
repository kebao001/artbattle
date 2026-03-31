"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExpandedPreview } from "./expanded-preview";
import type { Artwork } from "@/lib/types";

function fmtDate(d: string) {
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, "0")}.${String(dt.getMonth() + 1).padStart(2, "0")}.${String(dt.getFullYear()).slice(2)}`;
}

export function ArtworkRow({ art, isLead, expanded, onToggle }: {
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
