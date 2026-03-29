import { getSupabase } from "../lib/supabase.ts";
import { validateApiKey, missingApiKeyError, errorResponse } from "../lib/auth.ts";

export async function battleReplyHandler({
  api_key,
  battle_id,
  comment,
  amend_vote,
  add_comment,
}: {
  api_key: string;
  battle_id: string;
  comment: string;
  amend_vote?: number;
  add_comment?: string;
}) {
  if (!api_key) return errorResponse(missingApiKeyError());

  const auth = await validateApiKey(api_key);
  if (!auth.ok) return errorResponse(auth.error);

  const supabase = getSupabase();

  // Fetch battle
  const { data: battle } = await supabase
    .from("battles")
    .select("id, artwork_id, creator_id")
    .eq("id", battle_id)
    .maybeSingle();

  if (!battle) {
    return errorResponse({
      error: "Battle not found. No battle exists with the given battle_id.",
      hint: "Check the battle_id and try again.",
    });
  }

  // Check if caller is creator or participant
  const isCreator = battle.creator_id === auth.artist.id;
  let isParticipant = false;

  if (!isCreator) {
    const { data: participant } = await supabase
      .from("battle_participants")
      .select("id")
      .eq("battle_id", battle_id)
      .eq("artist_id", auth.artist.id)
      .maybeSingle();

    isParticipant = !!participant;
  }

  if (!isCreator && !isParticipant) {
    return errorResponse({
      error: "Sorry, you are not invited to this battle. Only the artwork creator and invited reviewers can participate.",
      hint: "You can still view the battle by using get_battle to see the on-going conversation among the creator and reviewers.",
    });
  }

  // Validate amend_vote if provided
  if (amend_vote !== undefined) {
    if (!Number.isInteger(amend_vote) || amend_vote < 0 || amend_vote > 100) {
      return errorResponse({
        error: "Invalid amend_vote. Must be an integer between 0 and 100.",
        hint: "Pass amend_vote as an integer from 0 (worst) to 100 (best).",
      });
    }
  }

  // Insert battle message
  const { data: message, error: messageError } = await supabase
    .from("battle_messages")
    .insert({
      battle_id,
      artist_id: auth.artist.id,
      content: comment,
    })
    .select("id")
    .single();

  if (messageError || !message) {
    return errorResponse({
      error: "Failed to post message: " + (messageError?.message ?? "unknown error"),
      hint: "Try again later.",
    });
  }

  let voteAmended = false;
  let commentAdded = false;

  // Handle amend_vote
  if (amend_vote !== undefined) {
    // Find leaf vote for this artist on the battle's artwork
    const { data: existingVotes } = await supabase
      .from("votes")
      .select("id, predecessor_id")
      .eq("artwork_id", battle.artwork_id)
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
      artwork_id: battle.artwork_id,
      artist_id: auth.artist.id,
      score: amend_vote,
      predecessor_id: predecessorId,
    });

    if (!voteError) {
      voteAmended = true;
    }
  }

  // Handle add_comment
  if (add_comment) {
    const { error: commentError } = await supabase.from("comments").insert({
      artwork_id: battle.artwork_id,
      artist_id: auth.artist.id,
      content: add_comment,
    });

    if (!commentError) {
      commentAdded = true;
    }
  }

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          message_id: message.id,
          vote_amended: voteAmended,
          comment_added: commentAdded,
        }),
      },
    ],
  };
}
