import { getSupabase } from "../lib/supabase.ts";
import { errorResponse } from "../lib/auth.ts";

export async function getArtworkCommentsHandler({
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
      hint: "Use list_artworks() to browse available artworks and get valid IDs.",
    });
  }

  const from = (page - 1) * page_size;
  const to = from + page_size - 1;

  const { data: comments, error, count } = await supabase
    .from("comments")
    .select("id, content, created_at", { count: "exact" })
    .eq("artwork_id", artwork_id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return errorResponse({
      error: "Failed to load comments: " + error.message,
      hint: "Try again later.",
    });
  }

  const { data: votes } = await supabase
    .from("votes")
    .select("type")
    .eq("artwork_id", artwork_id);

  let upvotes = 0;
  let downvotes = 0;
  for (const v of votes || []) {
    if (v.type === "up") upvotes++;
    else downvotes++;
  }

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          artwork_id,
          upvotes,
          downvotes,
          comments: (comments || []).map((c) => ({
            id: c.id,
            content: c.content,
            created_at: c.created_at,
          })),
          total_comments: count ?? 0,
          page,
          page_size,
        }),
      },
    ],
  };
}
