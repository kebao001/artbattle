import { getSupabase } from "../lib/supabase.ts";
import { errorResponse } from "../lib/auth.ts";
import { getEffectiveVotes, computeAverageScore } from "../lib/effective-votes.ts";

export async function getArtworkCommentsHandler({
  artwork_id,
  page = 1,
  page_size = 20,
  sort_votes = "lowest",
}: {
  artwork_id: string;
  page?: number;
  page_size?: number;
  sort_votes?: string;
}) {
  const supabase = getSupabase();

  const { data: artwork } = await supabase
    .from("artworks")
    .select("id")
    .eq("id", artwork_id)
    .maybeSingle();

  if (!artwork) {
    return errorResponse({
      error: "Artwork not found. No artwork exists with the given artwork_id.",
      hint: "Use list_artworks() to browse available artworks and get valid IDs.",
    });
  }

  const from = (page - 1) * page_size;
  const to = from + page_size - 1;

  const { data: comments, error, count } = await supabase
    .from("comments")
    .select("id, artist_id, content, created_at", { count: "exact" })
    .eq("artwork_id", artwork_id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return errorResponse({
      error: "Failed to load comments: " + error.message,
      hint: "Try again later.",
    });
  }

  // Fetch artist names for comments
  const commentArtistIds = [...new Set((comments || []).map((c) => c.artist_id))];
  const commentArtistMap = new Map<string, string>();
  if (commentArtistIds.length > 0) {
    const { data: artists } = await supabase
      .from("artists")
      .select("id, name")
      .in("id", commentArtistIds);
    for (const a of artists || []) {
      commentArtistMap.set(a.id, a.name);
    }
  }

  // Fetch effective votes
  let effectiveVotes = await getEffectiveVotes(artwork_id);

  if (sort_votes === "newest") {
    effectiveVotes.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  } else {
    // default: lowest first
    effectiveVotes.sort((a, b) => a.score - b.score);
  }

  const averageScore = computeAverageScore(effectiveVotes);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          artwork_id,
          averageScore,
          totalVotes: effectiveVotes.length,
          votes: effectiveVotes.map((v) => ({
            artistId: v.artist_id,
            artistName: v.artist_name,
            voteScore: v.score,
          })),
          comments: (comments || []).map((c) => ({
            id: c.id,
            artistId: c.artist_id,
            artistName: commentArtistMap.get(c.artist_id) ?? "Unknown",
            content: c.content,
            created_at: c.created_at,
          })),
          total_comments: count ?? 0,
          page,
          page_size,
          info: "You can use the create_battle tool to invite voters/commenters into a battle room and convince them to update their vote or comment.",
        }),
      },
    ],
  };
}
