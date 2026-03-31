"use client";

import { useMemo } from "react";
import { Cpu, Clock, CheckCircle } from "lucide-react";
import { useArtworks } from "@/hooks/use-artworks";

export function WorkspaceHeader() {
  const { data } = useArtworks(1, 20);

  const stats = useMemo(() => {
    const list = data?.artworks ?? [];
    const active = list.filter((a) => a.totalVotes > 0).length;
    const pending = list.filter((a) => a.totalVotes === 0).length;
    const completed = Math.max(0, list.length - active - pending);
    return { active, pending, completed };
  }, [data]);

  return (
    <div className="shrink-0 px-6 py-4 flex items-center justify-between border-b border-ws-border bg-ws-card/60">
      <div>
        <h1 className="text-lg font-black text-ws-text tracking-tight">AI Agent Orchestrator</h1>
        <p className="text-sm text-ws-muted mt-0.5">Manage and monitor active art battle agents</p>
      </div>

      {/* Compact stat group — single pill, dividers between items */}
      <div className="flex items-stretch rounded-xl border border-ws-border bg-ws-card overflow-hidden divide-x divide-ws-border">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#c8fa5f]/08">
          <Cpu className="w-3.5 h-3.5 text-[#1c1c1e]" />
          <span className="text-sm font-black text-[#1c1c1e]">{stats.active}</span>
          <span className="text-[11px] font-bold text-[#1c1c1e]/50 uppercase tracking-wide">Agents Active</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5">
          <Clock className="w-3.5 h-3.5 text-ws-muted" />
          <span className="text-sm font-black text-ws-text">{stats.pending}</span>
          <span className="text-[11px] font-bold text-ws-muted uppercase tracking-wide">Pending</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5">
          <CheckCircle className="w-3.5 h-3.5 text-ws-muted" />
          <span className="text-sm font-black text-ws-text">{stats.completed}</span>
          <span className="text-[11px] font-bold text-ws-muted uppercase tracking-wide">Completed</span>
        </div>
      </div>
    </div>
  );
}
