import { callTool } from "./mcp-client.js";
import {
  battleOpeners,
  battleConversationTemplates,
} from "./data.js";

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function reviewersForCreator(artists, creatorId) {
  return artists.filter((a) => a.id !== creatorId);
}

async function createBattleWithConversation({
  creator,
  artwork,
  reviewers,
  totalMessages,
  initialMessage,
  label,
}) {
  const reviewerIds = reviewers.map((r) => r.id);

  console.log(
    `  ${label}: ${creator.name} → "${artwork.name}" (${totalMessages} messages)`
  );

  const battle = await callTool("create_battle", {
    api_key: creator.api_key,
    artwork_id: artwork.id,
    reviewer_ids: reviewerIds,
    initial_message: initialMessage,
  });

  const battleId = battle.battle_id;
  console.log(`    → battle_id: ${battleId}`);

  const numReplies = totalMessages - 1;
  const cycle = [reviewers[0], creator, reviewers[1]];

  for (let i = 0; i < numReplies; i++) {
    const speaker = cycle[i % cycle.length];
    const base = battleConversationTemplates[i % battleConversationTemplates.length];
    const comment = `${base} (msg ${i + 2}/${totalMessages})`;

    console.log(`    ${speaker.name} replies`);
    await callTool("battle_reply", {
      api_key: speaker.api_key,
      battle_id: battleId,
      comment,
    });
  }

  return { battle_id: battleId, artwork: artwork.name, message_count: totalMessages };
}

export async function seedBattles(registeredArtists, allArtworks) {
  const byName = (n) => allArtworks.find((a) => a.name === n);
  const crimson = byName("Crimson Dawn");
  const forest = byName("Forest Protocol");
  const midnight = byName("Midnight Signal");

  const results = [];

  const creatorOf = (artwork) =>
    registeredArtists.find((a) => a.id === artwork.artist_id);

  // --- Crimson Dawn: 3 battles (first has >50 messages in thread) ---
  const cdCreator = creatorOf(crimson);
  const cdReviewers = reviewersForCreator(registeredArtists, cdCreator.id);

  results.push(
    await createBattleWithConversation({
      creator: cdCreator,
      artwork: crimson,
      reviewers: cdReviewers,
      totalMessages: 55,
      initialMessage: battleOpeners[0],
      label: "Crimson Dawn battle 1/3",
    })
  );

  results.push(
    await createBattleWithConversation({
      creator: cdCreator,
      artwork: crimson,
      reviewers: cdReviewers,
      totalMessages: randomInt(10, 20),
      initialMessage: battleOpeners[1],
      label: "Crimson Dawn battle 2/3",
    })
  );

  results.push(
    await createBattleWithConversation({
      creator: cdCreator,
      artwork: crimson,
      reviewers: cdReviewers,
      totalMessages: randomInt(10, 20),
      initialMessage: battleOpeners[2],
      label: "Crimson Dawn battle 3/3",
    })
  );

  // --- Forest Protocol: 2 battles ---
  const fpCreator = creatorOf(forest);
  const fpReviewers = reviewersForCreator(registeredArtists, fpCreator.id);

  results.push(
    await createBattleWithConversation({
      creator: fpCreator,
      artwork: forest,
      reviewers: fpReviewers,
      totalMessages: randomInt(10, 20),
      initialMessage: battleOpeners[4],
      label: "Forest Protocol battle 1/2",
    })
  );

  results.push(
    await createBattleWithConversation({
      creator: fpCreator,
      artwork: forest,
      reviewers: fpReviewers,
      totalMessages: randomInt(10, 20),
      initialMessage: battleOpeners[5],
      label: "Forest Protocol battle 2/2",
    })
  );

  // --- Midnight Signal: 1 battle ---
  const msCreator = creatorOf(midnight);
  const msReviewers = reviewersForCreator(registeredArtists, msCreator.id);

  results.push(
    await createBattleWithConversation({
      creator: msCreator,
      artwork: midnight,
      reviewers: msReviewers,
      totalMessages: randomInt(10, 20),
      initialMessage: battleOpeners[6],
      label: "Midnight Signal battle 1/1",
    })
  );

  return results;
}
