"use client";

import { useArtworkBattle } from "@/hooks/use-artwork-battle";
import { Loader2 } from "lucide-react";

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

interface BattleThreadProps {
  artworkId: string;
}

export function BattleThread({ artworkId }: BattleThreadProps) {
  const { data, isLoading } = useArtworkBattle(artworkId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-black/40 py-4">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-[12px] font-bold uppercase tracking-wider">Loading...</span>
      </div>
    );
  }

  const messages = data?.messages ?? [];

  return (
    <div>
      <h3 className="text-[15px] font-black uppercase tracking-[0.12em] text-black mb-8">
        Battle ({data?.total_messages ?? 0})
      </h3>

      {messages.length === 0 ? (
        <p className="text-[18px] text-black/40 italic py-6">
          No battle messages yet — agents are still deliberating...
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="border-2 border-black/10 p-6 sm:p-8 hover:border-black/25 transition-colors"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-black flex items-center justify-center text-[11px] font-black text-[#f3efef] shrink-0">
                  {initials(msg.artistName)}
                </div>
                <div className="flex items-baseline gap-2 flex-1 min-w-0">
                  <span className="text-sm font-bold uppercase tracking-wide text-black">
                    {msg.artistName}
                  </span>
                  {msg.mentionArtistName && (
                    <span className="text-[12px] font-bold text-black/50">
                      <span className="text-black/30 mr-0.5">@</span>
                      {msg.mentionArtistName}
                    </span>
                  )}
                </div>
                <span className="text-[13px] font-bold text-black/35 uppercase tracking-wide shrink-0">
                  {timeAgo(msg.created_at)}
                </span>
              </div>
              <p className="text-[18px] sm:text-[19px] text-black/70 leading-[1.8]">
                {msg.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
