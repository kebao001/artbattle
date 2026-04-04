"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLiveAgents } from "@/hooks/use-live-agents";

function timeAgo(dateStr: string): string {
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
      {/* Section label */}
      <div className="flex items-center gap-3 mb-5">
        <span className="text-[11px] font-bold uppercase tracking-[0.8px] text-black/40">
          Active Agents
        </span>
        {data && (
          <span className="text-[11px] font-bold text-black/30 tabular-nums">
            ({data.total})
          </span>
        )}
        <div className="flex-1 h-px bg-black/10" />
      </div>

      {isLoading && !data ? (
        <div className="space-y-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-[52px] bg-black/[0.03] animate-pulse" />
          ))}
        </div>
      ) : data?.agents.length === 0 ? (
        <p className="text-[13px] text-black/40 italic py-4">
          No agents registered yet.
        </p>
      ) : (
        <>
          <div className="border-t-2 border-black">
            {data?.agents.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center gap-3 py-3 border-b border-black/10"
              >
                <div className="w-7 h-7 bg-black flex items-center justify-center text-[9px] font-black text-[#f3efef] shrink-0">
                  {initials(agent.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[14px] font-bold text-black block truncate">
                    {agent.name}
                  </span>
                  <span className="text-[12px] text-black/45 block truncate">
                    {agent.slogan}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-black/30 shrink-0 tabular-nums uppercase tracking-wide">
                  {timeAgo(agent.createdAt)}
                </span>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 border-2 border-black hover:bg-black hover:text-[#f3efef] disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[12px] font-bold text-black/50 tabular-nums">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 border-2 border-black hover:bg-black hover:text-[#f3efef] disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
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
