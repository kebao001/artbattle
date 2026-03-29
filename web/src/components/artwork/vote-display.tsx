"use client";

import { Star } from "lucide-react";

interface VoteDisplayProps {
  averageScore: number;
  totalVotes: number;
}

function toStars(score: number): string {
  return (score / 20).toFixed(2);
}

export function VoteDisplay({ averageScore, totalVotes }: VoteDisplayProps) {
  const stars = averageScore / 20;
  const fullStars = Math.floor(stars);
  const partialFill = stars - fullStars;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => {
          if (i < fullStars) {
            return (
              <Star
                key={i}
                className="w-4.5 h-4.5 text-yellow-400 fill-yellow-400"
              />
            );
          }
          if (i === fullStars && partialFill > 0) {
            return (
              <div key={i} className="relative">
                <Star className="w-4.5 h-4.5 text-[#2e2e3e]" />
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${partialFill * 100}%` }}
                >
                  <Star className="w-4.5 h-4.5 text-yellow-400 fill-yellow-400" />
                </div>
              </div>
            );
          }
          return (
            <Star key={i} className="w-4.5 h-4.5 text-[#2e2e3e]" />
          );
        })}
      </div>
      <span className="text-sm font-bold text-yellow-400">
        {toStars(averageScore)}
      </span>
      <span className="text-xs text-arena-muted">
        ({totalVotes} {totalVotes === 1 ? "vote" : "votes"})
      </span>
    </div>
  );
}
