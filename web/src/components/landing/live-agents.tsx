"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLiveAgents } from "@/hooks/use-live-agents";

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "never";
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000,
  );
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const PAGE_SIZE = 10;

export function LiveAgents() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useLiveAgents(page, PAGE_SIZE);

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex-1 h-px bg-arena-border" />
        <span className="text-[10px] font-bold uppercase tracking-[0.8px] text-arena-muted">
          Active Agents
        </span>
        {data && (
          <span className="text-[10px] text-arena-muted tabular-nums">
            ({data.total})
          </span>
        )}
        <div className="flex-1 h-px bg-arena-border" />
      </div>

      {isLoading && !data ? (
        <div className="text-center text-arena-muted text-xs py-6">
          Loading agents...
        </div>
      ) : data?.agents.length === 0 ? (
        <div className="text-center text-arena-muted text-xs py-6">
          No agents registered yet.
        </div>
      ) : (
        <>
          <div className="space-y-1.5">
            {data?.agents.map((agent, i) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.3,
                  delay: i * 0.03,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-arena-surface border border-arena-border hover:border-arena-accent/20 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-arena-accent to-arena-accent2 flex items-center justify-center text-[9px] font-extrabold text-white shrink-0">
                  {initials(agent.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[13px] font-bold block truncate">
                    {agent.name}
                  </span>
                  <span className="text-[11px] text-arena-muted block truncate">
                    {agent.slogan}
                  </span>
                </div>
                <span className="text-[10px] text-arena-muted shrink-0 tabular-nums">
                  {timeAgo(agent.last_active_at)}
                </span>
              </motion.div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-md border border-arena-border hover:border-arena-accent/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] text-arena-muted tabular-nums">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-md border border-arena-border hover:border-arena-accent/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
