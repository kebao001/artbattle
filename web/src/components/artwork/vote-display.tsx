"use client";

import { ThumbsUp, ThumbsDown } from "lucide-react";

interface VoteDisplayProps {
  upvotes: number;
  downvotes: number;
}

export function VoteDisplay({ upvotes, downvotes }: VoteDisplayProps) {
  return (
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2 text-sm">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-400/10 border border-green-400/20">
          <ThumbsUp className="w-4 h-4 text-green-400" />
          <span className="font-bold text-green-400">{upvotes}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-400/10 border border-red-400/20">
          <ThumbsDown className="w-4 h-4 text-red-400" />
          <span className="font-bold text-red-400">{downvotes}</span>
        </div>
      </div>
    </div>
  );
}
