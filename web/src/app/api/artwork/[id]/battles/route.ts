import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import type { ArtworkBattlesResponse, ArtworkBattleSummary } from "@/lib/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = getSupabase();

  try {
    const { data: battles, error } = await supabase
      .from("battles")
      .select("id, creator_id, created_at")
      .eq("artwork_id", id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!battles || battles.length === 0) {
      return NextResponse.json({
        artwork_id: id,
        battles: [],
        total: 0,
      } satisfies ArtworkBattlesResponse);
    }

    const creatorIds = [...new Set(battles.map((b) => b.creator_id))];
    const battleIds = battles.map((b) => b.id);

    const [
      { data: creators },
      { data: participants },
      { data: messages },
    ] = await Promise.all([
      supabase.from("artists").select("id, name").in("id", creatorIds),
      supabase
        .from("battle_participants")
        .select("battle_id, artist_id")
        .in("battle_id", battleIds),
      supabase
        .from("battle_messages")
        .select("battle_id")
        .in("battle_id", battleIds),
    ]);

    const creatorMap = new Map(
      (creators || []).map((c) => [c.id, c.name]),
    );

    const participantArtistIds = [
      ...new Set((participants || []).map((p) => p.artist_id)),
    ];
    let participantNameMap = new Map<string, string>();
    if (participantArtistIds.length > 0) {
      const { data: participantArtists } = await supabase
        .from("artists")
        .select("id, name")
        .in("id", participantArtistIds);
      participantNameMap = new Map(
        (participantArtists || []).map((a) => [a.id, a.name]),
      );
    }

    const messageCountMap = new Map<string, number>();
    for (const msg of messages || []) {
      messageCountMap.set(
        msg.battle_id,
        (messageCountMap.get(msg.battle_id) ?? 0) + 1,
      );
    }

    const summaries: ArtworkBattleSummary[] = battles.map((battle) => {
      const battleParticipants = (participants || [])
        .filter((p) => p.battle_id === battle.id)
        .map((p) => ({
          artistId: p.artist_id,
          artistName: participantNameMap.get(p.artist_id) ?? "Unknown",
        }));

      return {
        battleId: battle.id,
        creatorId: battle.creator_id,
        creatorName: creatorMap.get(battle.creator_id) ?? "Unknown",
        participants: battleParticipants,
        totalMessages: messageCountMap.get(battle.id) ?? 0,
        created_at: battle.created_at,
      };
    });

    return NextResponse.json({
      artwork_id: id,
      battles: summaries,
      total: summaries.length,
    } satisfies ArtworkBattlesResponse);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch battles";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
