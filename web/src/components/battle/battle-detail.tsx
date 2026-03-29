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
      <div className="flex items-center justify-center py-20 text-arena-muted">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading battle...
      </div>
    );
  }

  if (error || !battle) {
    return (
      <div className="text-center py-20 text-red-400 text-sm">
        Failed to load battle. It may not exist.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <BattleHeader battle={battle} />

      <div className="border-t border-arena-border pt-6">
        <h3 className="text-xs font-bold uppercase tracking-[0.8px] text-arena-muted mb-4">
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
