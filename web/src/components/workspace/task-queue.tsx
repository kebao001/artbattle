"use client";

import { useMemo } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, Swords, Trophy, MessageSquare } from "lucide-react";
import { useArtworks } from "@/hooks/use-artworks";

function timeAgo(dateStr: string) {
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const TASK_TYPES = [
  { label: "Battle", Icon: Swords, color: "text-[#a78bfa]", bg: "bg-[#a78bfa]/10" },
  { label: "Tournament", Icon: Trophy, color: "text-[#fbbf24]", bg: "bg-[#fbbf24]/10" },
  { label: "Review", Icon: MessageSquare, color: "text-[#22d3ee]", bg: "bg-[#22d3ee]/10" },
];

export function TaskQueue() {
  const { data } = useArtworks(1, 20);

  const tasks = useMemo(() => {
    const list = data?.artworks ?? [];
    return [...list]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 8);
  }, [data]);

  const completed = useMemo(() => {
    return (data?.artworks ?? [])
      .filter((a) => a.totalVotes > 3)
      .slice(0, 3);
  }, [data]);

  return (
    <div className="flex flex-col gap-4">
      {/* Pending tasks */}
      <div className="bg-ws-card rounded-2xl border border-ws-border overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-6 py-5 border-b border-ws-border">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-ws-muted" />
            <span className="text-sm font-bold text-ws-text uppercase tracking-widest">Task Queue</span>
          </div>
          <span className="text-xs font-bold text-ws-muted px-2 py-0.5 rounded-full bg-ws-bg border border-ws-border">
            {tasks.length}
          </span>
        </div>

        {tasks.length === 0 ? (
          <p className="text-sm text-ws-muted text-center py-6">Loading tasks…</p>
        ) : (
          <div className="divide-y divide-ws-border">
            {tasks.map((art, i) => {
              const taskType = TASK_TYPES[i % TASK_TYPES.length];
              const isNew = i < 2;
              return (
                <Link key={art.id} href={`/art/${art.id}`}>
                  <div className="flex items-center gap-3 px-6 py-4 hover:bg-ws-bg transition-colors group">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${taskType.bg}`}>
                      <taskType.Icon className={`w-3.5 h-3.5 ${taskType.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-ws-text truncate group-hover:text-[#1c1c1e] transition-colors">
                        {art.name}
                      </div>
                      <div className="text-xs text-ws-muted mt-0.5">{taskType.label} · {timeAgo(art.created_at)}</div>
                    </div>
                    {isNew && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#c8fa5f]/20 text-[#1c1c1e] border border-[#c8fa5f]/30 uppercase shrink-0">
                        New
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed */}
      <div className="bg-ws-card rounded-2xl border border-ws-border overflow-hidden shadow-sm">
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-ws-border">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-bold text-ws-text uppercase tracking-widest">Completed</span>
        </div>
        <div className="divide-y divide-ws-border">
          {completed.map((art, i) => (
            <Link key={art.id} href={`/art/${art.id}`}>
              <div className="flex items-center gap-3 px-6 py-4 hover:bg-ws-bg transition-colors group">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-ws-muted truncate line-through decoration-ws-border group-hover:no-underline group-hover:text-ws-text transition-all">
                    {art.name}
                  </div>
                  <div className="text-xs text-ws-muted mt-0.5">{art.totalVotes} votes · {timeAgo(art.created_at)}</div>
                </div>
              </div>
            </Link>
          ))}
          {completed.length === 0 && (
            <p className="text-sm text-ws-muted text-center py-5">No completed tasks yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
