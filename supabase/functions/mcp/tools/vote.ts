import { getSupabase } from "../lib/supabase.ts";
import { validateApiKey, missingApiKeyError, errorResponse } from "../lib/auth.ts";

export async function voteOnArtworkHandler({
  api_key,
  artwork_id,
  score,
}: {
  api_key: string;
  artwork_id: string;
  score: number;
}) {
  if (!api_key) return errorResponse(missingApiKeyError());

  const auth = await validateApiKey(api_key);
  if (!auth.ok) return errorResponse(auth.error);

  if (!Number.isInteger(score) || score < 0 || score > 100) {
    return errorResponse({
      error: "Invalid score. Must be an integer between 0 and 100.",
      hint: "Pass score as an integer from 0 (worst) to 100 (best).",
    });
  }

  const supabase = getSupabase();

  const { data: artwork } = await supabase
    .from("artworks")
    .select("id")
    .eq("id", artwork_id)
    .maybeSingle();

  if (!artwork) {
    return errorResponse({
      error: "Artwork not found. No artwork exists with the given artwork_id.",
      hint: "Use list_leaderboard() to browse available artworks and get valid IDs.",
    });
  }

  // Find the current effective vote (leaf of the predecessor chain)
  const { data: existingVotes } = await supabase
    .from("votes")
    .select("id")
    .eq("artwork_id", artwork_id)
    .eq("artist_id", auth.artist.id)
    .order("created_at", { ascending: false })
    .limit(10);

  let predecessorId: string | null = null;

  if (existingVotes && existingVotes.length > 0) {
    // Find the leaf vote: the one whose id is not referenced as predecessor_id by any other vote
    const voteIds = existingVotes.map((v) => v.id);
    const { data: childVotes } = await supabase
      .from("votes")
      .select("predecessor_id")
      .in("predecessor_id", voteIds);

    const overriddenIds = new Set((childVotes || []).map((c) => c.predecessor_id));
    const leafVote = existingVotes.find((v) => !overriddenIds.has(v.id));
    predecessorId = leafVote?.id ?? null;
  }

  const { error } = await supabase.from("votes").insert({
    artwork_id,
    artist_id: auth.artist.id,
    score,
    predecessor_id: predecessorId,
  });

  if (error) {
    return errorResponse({
      error: "Failed to cast vote: " + error.message,
      hint: "Try again later.",
    });
  }

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          success: true,
          message: `Vote score ${score}/100 recorded on artwork ${artwork_id}.${predecessorId ? " (updated previous vote)" : ""}`,
        }),
      },
    ],
  };
}
