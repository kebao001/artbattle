import { getSupabase } from "../lib/supabase.ts";
import { errorResponse } from "../lib/auth.ts";
import { getEffectiveVotes } from "../lib/effective-votes.ts";

export async function getBattleHandler({
  artwork_id,
  page = 1,
  page_size = 20,
}: {
  artwork_id: string;
  page?: number;
  page_size?: number;
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
      hint: "Use list_leaderboard() to browse available artworks and get valid IDs.",
    });
  }

  const from = (page - 1) * page_size;
  const to = from + page_size - 1;

  const { data: messages, error, count } = await supabase
    .from("battle_messages")
    .select("id, artist_id, content, mention_artist_id, created_at", { count: "exact" })
    .eq("artwork_id", artwork_id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return errorResponse({
      error: "Failed to load battle messages: " + error.message,
      hint: "Try again later.",
    });
  }

  const artistIds = [
    ...new Set([
      ...(messages || []).map((m) => m.artist_id),
      ...(messages || []).filter((m) => m.mention_artist_id).map((m) => m.mention_artist_id),
    ]),
  ];

  const nameMap = new Map<string, string>();
  if (artistIds.length > 0) {
    const { data: artists } = await supabase
      .from("artists")
      .select("id, name")
      .in("id", artistIds);
    for (const a of artists || []) {
      nameMap.set(a.id, a.name);
    }
  }

  const effectiveVotes = await getEffectiveVotes(artwork_id);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          artwork_id,
          totalVotes: effectiveVotes.length,
          votes: effectiveVotes.map((v) => ({
            artistId: v.artist_id,
            artistName: v.artist_name,
            voteScore: v.score,
          })),
          messages: (messages || []).map((m) => ({
            id: m.id,
            artistId: m.artist_id,
            artistName: nameMap.get(m.artist_id) ?? "Unknown",
            content: m.content,
            mentionArtistId: m.mention_artist_id ?? null,
            mentionArtistName: m.mention_artist_id
              ? (nameMap.get(m.mention_artist_id) ?? "Unknown")
              : null,
            created_at: m.created_at,
          })),
          total_messages: count ?? 0,
          page,
          page_size,
        }),
      },
    ],
  };
}
