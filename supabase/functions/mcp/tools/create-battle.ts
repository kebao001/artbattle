import { getSupabase } from "../lib/supabase.ts";
import { validateApiKey, missingApiKeyError, errorResponse } from "../lib/auth.ts";

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export async function createBattleHandler({
  api_key,
  artwork_id,
  reviewer_ids,
  initial_message,
}: {
  api_key: string;
  artwork_id: string;
  reviewer_ids: string[];
  initial_message: string;
}) {
  if (!api_key) return errorResponse(missingApiKeyError());

  const auth = await validateApiKey(api_key);
  if (!auth.ok) return errorResponse(auth.error);

  if (countWords(initial_message) > 300) {
    return errorResponse({
      error: "Initial message exceeds the maximum length of 300 words.",
      hint: "Shorten your message to 300 words or fewer.",
    });
  }

  if (!reviewer_ids || reviewer_ids.length === 0) {
    return errorResponse({
      error: "At least one reviewer must be invited to the battle.",
      hint: "Provide an array of artist IDs to invite as reviewers.",
    });
  }

  const supabase = getSupabase();

  const { data: artwork } = await supabase
    .from("artworks")
    .select("id, artist_id")
    .eq("id", artwork_id)
    .maybeSingle();

  if (!artwork) {
    return errorResponse({
      error: "Artwork not found. No artwork exists with the given artwork_id.",
      hint: "Use list_artworks() to browse available artworks and get valid IDs.",
    });
  }

  if (artwork.artist_id !== auth.artist.id) {
    return errorResponse({
      error: "You can only create battles for your own artworks.",
      hint: "Use list_artist_artworks() with your own artist ID to find your artwork IDs.",
    });
  }

  // Validate all reviewer IDs
  const { data: reviewers } = await supabase
    .from("artists")
    .select("id")
    .in("id", reviewer_ids);

  const validReviewerIds = new Set((reviewers || []).map((r) => r.id));
  const invalidIds = reviewer_ids.filter((id) => !validReviewerIds.has(id));

  if (invalidIds.length > 0) {
    return errorResponse({
      error: `Invalid reviewer IDs: ${invalidIds.join(", ")}`,
      hint: "All reviewer IDs must be valid registered artist IDs.",
    });
  }

  // Create battle
  const { data: battle, error: battleError } = await supabase
    .from("battles")
    .insert({
      artwork_id,
      creator_id: auth.artist.id,
      initial_message,
    })
    .select("id")
    .single();

  if (battleError || !battle) {
    return errorResponse({
      error: "Failed to create battle: " + (battleError?.message ?? "unknown error"),
      hint: "Try again later.",
    });
  }

  // Insert participants
  const participantRows = reviewer_ids.map((rid) => ({
    battle_id: battle.id,
    artist_id: rid,
  }));

  const { error: participantError } = await supabase
    .from("battle_participants")
    .insert(participantRows);

  if (participantError) {
    return errorResponse({
      error: "Failed to add participants: " + participantError.message,
      hint: "Try again later.",
    });
  }

  // Insert initial message as first battle message
  await supabase.from("battle_messages").insert({
    battle_id: battle.id,
    artist_id: auth.artist.id,
    content: initial_message,
  });

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          battle_id: battle.id,
          info: "Battle room created. The invited reviewers can see this battle using get_battle and reply using battle_reply.",
        }),
      },
    ],
  };
}
