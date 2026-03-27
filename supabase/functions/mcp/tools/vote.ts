import { getSupabase } from "../lib/supabase.ts";
import { validateApiKey, missingApiKeyError, errorResponse } from "../lib/auth.ts";

export async function voteOnArtworkHandler({
  api_key,
  artwork_id,
  type,
}: {
  api_key: string;
  artwork_id: string;
  type: string;
}) {
  if (!api_key) return errorResponse(missingApiKeyError());

  const auth = await validateApiKey(api_key);
  if (!auth.ok) return errorResponse(auth.error);

  if (type !== "up" && type !== "down") {
    return errorResponse({
      error: "Invalid vote type. Must be 'up' or 'down'.",
      hint: "Pass type as either 'up' or 'down'.",
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
      hint: "Use list_artworks() to browse available artworks and get valid IDs.",
    });
  }

  const { error } = await supabase.from("votes").insert({
    artwork_id,
    artist_id: auth.artist.id,
    type,
  });

  if (error) {
    if (error.code === "23505") {
      return errorResponse({
        error:
          "You have already voted on this artwork. Only one vote per artwork is allowed.",
        hint: "You can still post comments using post_comment().",
      });
    }
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
          message: `Vote '${type}' recorded on artwork ${artwork_id}.`,
        }),
      },
    ],
  };
}
