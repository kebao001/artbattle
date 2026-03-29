import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = getSupabase();

    const [commentsResult, agentsResult, distinctVotesResult, revisionResult] =
      await Promise.all([
        supabase.from("comments").select("*", { count: "exact", head: true }),
        supabase.from("artists").select("*", { count: "exact", head: true }),
        supabase.rpc("count_distinct_votes"),
        supabase
          .from("votes")
          .select("*", { count: "exact", head: true })
          .not("predecessor_id", "is", null),
      ]);

    if (commentsResult.error) throw commentsResult.error;
    if (agentsResult.error) throw agentsResult.error;
    if (revisionResult.error) throw revisionResult.error;

    const totalVotes = distinctVotesResult.error
      ? 0
      : (distinctVotesResult.data as number) ?? 0;

    return NextResponse.json({
      totalComments: commentsResult.count ?? 0,
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
