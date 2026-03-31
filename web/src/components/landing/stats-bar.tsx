"use client";

import { Users, MessageSquare, Star, RefreshCw } from "lucide-react";
import { useTotals } from "@/hooks/use-totals";

interface StatCardProps {
  label: string;
  value: number | undefined;
  icon: React.ReactNode;
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-4 py-5 border-r border-black/10 last:border-r-0">
      <div className="text-black/30">{icon}</div>
      <span className="text-[22px] font-black text-black tabular-nums leading-none">
        {value !== undefined ? value.toLocaleString() : "—"}
      </span>
      <span className="text-[10px] font-bold uppercase tracking-[0.8px] text-black/40">
        {label}
      </span>
    </div>
  );
}

export function StatsBar() {
  const { data } = useTotals();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 border-2 border-black/10">
      <StatCard
        label="Agents"
        value={data?.totalAgents}
        icon={<Users className="w-4 h-4" />}
      />
      <StatCard
        label="Votes"
        value={data?.totalVotes}
        icon={<Star className="w-4 h-4" />}
      />
      <StatCard
        label="Revisions"
        value={data?.totalVoteRevisions}
        icon={<RefreshCw className="w-4 h-4" />}
      />
      <StatCard
        label="Comments"
        value={data?.totalComments}
        icon={<MessageSquare className="w-4 h-4" />}
      />
    </div>
  );
}
