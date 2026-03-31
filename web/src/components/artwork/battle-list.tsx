"use client";

import { useArtworkBattles } from "@/hooks/use-artwork-battles";
import { useBattle } from "@/hooks/use-battle";
import { BattleMessageList } from "@/components/battle/battle-message";
import { Loader2, Clock } from "lucide-react";
import type { ArtworkBattleSummary } from "@/lib/types";

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

function BattleConversation({ summary }: { summary: ArtworkBattleSummary }) {
  const { data: battle, isLoading } = useBattle(summary.battleId);

  return (
    <div className="border-2 border-black/10 p-6 sm:p-8">
      {/* Compact battle header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-black flex items-center justify-center text-[11px] font-black text-[#f3efef] shrink-0">
              {initials(summary.creatorName)}
            </div>
            <div>
              <span className="text-[15px] font-bold text-black">
                {summary.creatorName}
              </span>
              <span className="text-[11px] ml-2 px-2 py-0.5 border border-black text-black font-bold uppercase tracking-wider">
                Creator
              </span>
            </div>
          </div>
          <span className="text-[12px] font-bold text-black/35 flex items-center gap-1 uppercase tracking-wide">
            <Clock className="w-3 h-3" />
            {timeAgo(summary.created_at)}
          </span>
        </div>

        {summary.participants.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-black/35">
              Reviewers
            </span>
            {summary.participants.map((p) => (
              <div
                key={p.artistId}
                className="flex items-center gap-1.5 border border-black/15 px-2.5 py-1"
              >
                <div className="w-5 h-5 bg-black/40 flex items-center justify-center text-[8px] font-black text-[#f3efef] shrink-0">
                  {initials(p.artistName)}
                </div>
                <span className="text-[13px] font-medium text-black">
                  {p.artistName}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Conversation */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-black/40 py-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-[12px] font-bold uppercase tracking-wider">
            Loading conversation...
          </span>
        </div>
      ) : battle ? (
        <BattleMessageList
          messages={battle.messages}
          creatorId={battle.creatorId}
        />
      ) : (
        <p className="text-[14px] text-black/40 italic">
          Failed to load conversation.
        </p>
      )}
    </div>
  );
}

interface BattleConversationListProps {
  artworkId: string;
}

export function BattleConversationList({
  artworkId,
}: BattleConversationListProps) {
  const { data, isLoading } = useArtworkBattles(artworkId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-black/40 py-4">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-[12px] font-bold uppercase tracking-wider">
          Loading battles...
        </span>
      </div>
    );
  }

  const battles = data?.battles ?? [];

  return (
    <div>
      <h3 className="text-[15px] font-black uppercase tracking-[0.12em] text-black mb-8">
        Battle Rooms ({data?.total ?? 0})
      </h3>

      {battles.length === 0 ? (
        <p className="text-[18px] text-black/40 italic py-6">
          No battle rooms yet — the creator hasn&apos;t challenged any reviewers...
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {battles.map((summary) => (
            <BattleConversation key={summary.battleId} summary={summary} />
          ))}
        </div>
      )}
    </div>
  );
}
