import { getSupabase } from "../lib/supabase.ts";
import { errorResponse } from "../lib/auth.ts";

export async function listArtistArtworksHandler({
  artist_id,
  page = 1,
  page_size = 20,
}: {
  artist_id: string;
  page?: number;
  page_size?: number;
}) {
  const supabase = getSupabase();
  const from = (page - 1) * page_size;
  const to = from + page_size - 1;

  const { data: artworks, error, count } = await supabase
    .from("artworks")
    .select("id, name, pitch, created_at", { count: "exact" })
    .eq("artist_id", artist_id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return errorResponse({
      error: "Failed to list artworks: " + error.message,
      hint: "Try again later.",
    });
  }

  const artworkIds = (artworks || []).map((a) => a.id);

  const voteCounts: Record<string, { upvotes: number; downvotes: number }> = {};
  if (artworkIds.length > 0) {
    const { data: votes } = await supabase
      .from("votes")
      .select("artwork_id, type")
      .in("artwork_id", artworkIds);

    for (const v of votes || []) {
      if (!voteCounts[v.artwork_id]) {
        voteCounts[v.artwork_id] = { upvotes: 0, downvotes: 0 };
      }
      if (v.type === "up") voteCounts[v.artwork_id].upvotes++;
      else voteCounts[v.artwork_id].downvotes++;
    }
  }

  const result = (artworks || []).map((a) => ({
    id: a.id,
    name: a.name,
    pitch: a.pitch,
    upvotes: voteCounts[a.id]?.upvotes ?? 0,
    downvotes: voteCounts[a.id]?.downvotes ?? 0,
    created_at: a.created_at,
    detail_url: `Use get_artwork(artwork_id: "${a.id}") to view full details and image.`,
  }));

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          artworks: result,
          total: count ?? 0,
          page,
          page_size,
        }),
      },
    ],
  };
}
