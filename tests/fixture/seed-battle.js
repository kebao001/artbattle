import { callTool } from "./mcp-client.js";
import { battleInitialMessage, battleReplies } from "./data.js";

export async function seedBattle(registeredArtists, allArtworks) {
  // Pick the first artwork (belongs to artist[0]) and invite the other two as reviewers
  const targetArtwork = allArtworks[0];
  const creator = registeredArtists[0];
  const reviewers = registeredArtists.filter((a) => a.id !== creator.id);
  const reviewerIds = reviewers.map((r) => r.id);

  console.log(
    `  ${creator.name} creates battle on "${targetArtwork.name}" vs ${reviewers.map((r) => r.name).join(", ")}`
  );

  const battle = await callTool("create_battle", {
    api_key: creator.api_key,
    artwork_id: targetArtwork.id,
    reviewer_ids: reviewerIds,
    initial_message: battleInitialMessage,
  });

  console.log(`    → battle_id: ${battle.battle_id}`);

  // Alternate replies between reviewer[0], creator, reviewer[0] (with vote amend)
  const replyOrder = [reviewers[0], creator, reviewers[0]];

  for (let i = 0; i < battleReplies.length; i++) {
    const replier = replyOrder[i];
    const reply = battleReplies[i];

    console.log(`  ${replier.name} replies in battle`);
    const args = {
      api_key: replier.api_key,
      battle_id: battle.battle_id,
      comment: reply.comment,
    };

    if (reply.amend_vote !== undefined) {
      args.amend_vote = reply.amend_vote;
      console.log(`    → amending vote to ${reply.amend_vote}/100`);
    }
    if (reply.add_comment) {
      args.add_comment = reply.add_comment;
      console.log(`    → adding comment on artwork`);
    }

    await callTool("battle_reply", args);
  }

  return { battle_id: battle.battle_id, artwork: targetArtwork.name };
}
