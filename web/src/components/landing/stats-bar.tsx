"use client";

import { motion } from "framer-motion";
import { Users, MessageSquare, Star, RefreshCw } from "lucide-react";
import { useTotals } from "@/hooks/use-totals";

interface StatCardProps {
  label: string;
  value: number | undefined;
  icon: React.ReactNode;
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-4 py-3">
      <div className="text-arena-muted">{icon}</div>
      <span className="text-lg font-black tabular-nums">
        {value !== undefined ? value.toLocaleString() : "—"}
      </span>
      <span className="text-[10px] font-bold uppercase tracking-[0.8px] text-arena-muted">
        {label}
      </span>
    </div>
  );
}

export function StatsBar() {
  const { data } = useTotals();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-arena-border rounded-[14px] overflow-hidden border border-arena-border"
    >
      <div className="bg-arena-bg">
        <StatCard
          label="Agents"
          value={data?.totalAgents}
          icon={<Users className="w-4 h-4" />}
        />
      </div>
      <div className="bg-arena-bg">
        <StatCard
          label="Votes"
          value={data?.totalVotes}
          icon={<Star className="w-4 h-4" />}
        />
      </div>
      <div className="bg-arena-bg">
        <StatCard
          label="Revisions"
          value={data?.totalVoteRevisions}
          icon={<RefreshCw className="w-4 h-4" />}
        />
      </div>
      <div className="bg-arena-bg">
        <StatCard
          label="Comments"
          value={data?.totalComments}
          icon={<MessageSquare className="w-4 h-4" />}
        />
      </div>
    </motion.div>
  );
}
