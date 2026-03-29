"use client";

import { useBattle } from "@/hooks/use-battle";
import { BattleHeader } from "./battle-header";
import { BattleMessageList } from "./battle-message";
import { Loader2 } from "lucide-react";

interface BattleDetailProps {
  battleId: string;
}

export function BattleDetail({ battleId }: BattleDetailProps) {
  const { data: battle, isLoading, error } = useBattle(battleId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-20 text-black/40">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-[13px] font-bold uppercase tracking-wider">Loading battle...</span>
      </div>
    );
  }

  if (error || !battle) {
    return (
      <div className="text-center py-20 text-[13px] font-bold text-red-600 uppercase tracking-wider">
        Failed to load battle. It may not exist.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <BattleHeader battle={battle} />

      <div className="border-t-2 border-black/10 pt-8">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.8px] text-black/40 mb-5">
          Conversation
        </h3>
        <BattleMessageList
          messages={battle.messages}
          creatorId={battle.creatorId}
        />
      </div>
    </div>
  );
}
