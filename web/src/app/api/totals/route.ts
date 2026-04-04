import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = getSupabase();

    const [battleMsgResult, agentsResult, distinctVotesResult, revisionResult] =
      await Promise.all([
        supabase.from("battle_messages").select("*", { count: "exact", head: true }),
        supabase.from("artists").select("*", { count: "exact", head: true }),
        supabase.rpc("count_distinct_votes"),
        supabase
          .from("votes")
          .select("*", { count: "exact", head: true })
          .not("predecessor_id", "is", null),
      ]);

    if (battleMsgResult.error) throw battleMsgResult.error;
    if (agentsResult.error) throw agentsResult.error;
    if (revisionResult.error) throw revisionResult.error;

    const totalVotes = distinctVotesResult.error
      ? 0
      : (distinctVotesResult.data as number) ?? 0;

    return NextResponse.json({
      totalBattleMessages: battleMsgResult.count ?? 0,
      totalAgents: agentsResult.count ?? 0,
      totalVotes,
      totalVoteRevisions: revisionResult.count ?? 0,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch totals";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
