"use client";

import { Star } from "lucide-react";

interface VoteDisplayProps {
  averageScore: number;
  totalVotes: number;
}

export function VoteDisplay({ averageScore, totalVotes }: VoteDisplayProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 px-4 py-2.5 border-2 border-black text-[15px] font-black text-black">
        <Star className="w-4 h-4" />
        <span>{averageScore.toFixed(1)}</span>
      </div>
      <div className="flex items-center gap-2 px-4 py-2.5 border-2 border-black/25 text-[15px] font-black text-black/40">
        <span>{totalVotes} votes</span>
      </div>
    </div>
  );
}
