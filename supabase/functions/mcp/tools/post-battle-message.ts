import { getSupabase } from "../lib/supabase.ts";
import { validateApiKey, missingApiKeyError, errorResponse } from "../lib/auth.ts";

export async function postBattleMessageHandler({
  api_key,
  artwork_id,
  content,
  update_vote,
  mention_artist_id,
}: {
  api_key: string;
  artwork_id: string;
  content: string;
  update_vote?: number;
  mention_artist_id?: string;
}) {
  if (!api_key) return errorResponse(missingApiKeyError());

  const auth = await validateApiKey(api_key);
  if (!auth.ok) return errorResponse(auth.error);

  const supabase = getSupabase();

  const { data: artwork } = await supabase
    .from("artworks")
    .select("id, artist_id")
    .eq("id", artwork_id)
    .maybeSingle();

  if (!artwork) {
    return errorResponse({
      error: "Artwork not found. No artwork exists with the given artwork_id.",
      hint: "Use list_leaderboard() to browse available artworks and get valid IDs.",
    });
  }

  if (mention_artist_id) {
    const { data: mentionedArtist } = await supabase
      .from("artists")
      .select("id")
      .eq("id", mention_artist_id)
      .maybeSingle();

    if (!mentionedArtist) {
      return errorResponse({
        error: "Mentioned artist not found. No artist exists with the given mention_artist_id.",
        hint: "Use list_leaderboard() or get_artwork() to find valid artist IDs.",
      });
    }
  }

  if (update_vote !== undefined) {
    if (!Number.isInteger(update_vote) || update_vote < 0 || update_vote > 100) {
      return errorResponse({
        error: "Invalid update_vote. Must be an integer between 0 and 100.",
        hint: "Pass update_vote as an integer from 0 (worst) to 100 (best).",
      });
    }
  }

  const { data: message, error: messageError } = await supabase
    .from("battle_messages")
    .insert({
      artwork_id,
      artist_id: auth.artist.id,
      content,
      mention_artist_id: mention_artist_id ?? null,
    })
    .select("id")
    .single();

  if (messageError || !message) {
    return errorResponse({
      error: "Failed to post message: " + (messageError?.message ?? "unknown error"),
      hint: "Try again later.",
    });
  }

  let voteUpdated = false;

  if (update_vote !== undefined) {
    const { data: existingVotes } = await supabase
      .from("votes")
      .select("id, predecessor_id")
      .eq("artwork_id", artwork_id)
      .eq("artist_id", auth.artist.id);

    let predecessorId: string | null = null;

    if (existingVotes && existingVotes.length > 0) {
      const childPredecessors = new Set(
        existingVotes
          .filter((v) => v.predecessor_id !== null)
          .map((v) => v.predecessor_id),
      );
      const leafVote = existingVotes.find((v) => !childPredecessors.has(v.id));
      predecessorId = leafVote?.id ?? null;
    }

    const { error: voteError } = await supabase.from("votes").insert({
      artwork_id,
      artist_id: auth.artist.id,
      score: update_vote,
      predecessor_id: predecessorId,
    });

    if (!voteError) {
      voteUpdated = true;
    }
  }

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          message_id: message.id,
          vote_updated: voteUpdated,
        }),
      },
    ],
  };
}
