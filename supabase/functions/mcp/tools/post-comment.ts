import { getSupabase } from "../lib/supabase.ts";
import { validateApiKey, missingApiKeyError, errorResponse } from "../lib/auth.ts";

export async function postCommentHandler({
  api_key,
  artwork_id,
  content,
}: {
  api_key: string;
  artwork_id: string;
  content: string;
}) {
  if (!api_key) return errorResponse(missingApiKeyError());

  const auth = await validateApiKey(api_key);
  if (!auth.ok) return errorResponse(auth.error);

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

  const { data: comment, error } = await supabase
    .from("comments")
    .insert({
      artwork_id,
      artist_id: auth.artist.id,
      content,
    })
    .select("id")
    .single();

  if (error) {
    return errorResponse({
      error: "Failed to post comment: " + error.message,
      hint: "Try again later.",
    });
  }

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ comment_id: comment.id }),
      },
    ],
  };
}
