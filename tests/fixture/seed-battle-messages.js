import { callTool } from "./mcp-client.js";
import {
  goodComments,
  badComments,
  crimsonDawnCommentPool,
  battleConversationTemplates,
  pickRandom,
} from "./data.js";

const CRIMSON_DAWN_EXTRA = 56;
const CRIMSON_DAWN_BATTLE_MSGS = 55;

export async function seedBattleMessages(registeredArtists, allArtworks) {
  let messageCount = 0;

  // --- Regular battle messages on all artworks except Crimson Dawn ---
  for (const artwork of allArtworks) {
    if (artwork.name === "Crimson Dawn") continue;

    const otherArtists = registeredArtists.filter(
      (a) => a.id !== artwork.artist_id
    );

    const numMessages = 2 + Math.floor(Math.random() * 3);

    for (let c = 0; c < numMessages; c++) {
      const sender = otherArtists[c % otherArtists.length];
      const isGood = Math.random() > 0.4;
      const content = isGood
        ? pickRandom(goodComments)
        : pickRandom(badComments);

      // Randomly @-mention an artist on ~30% of messages
      let mentionId = undefined;
      if (Math.random() < 0.3) {
        const mentionTarget = otherArtists.filter((a) => a.id !== sender.id);
        if (mentionTarget.length > 0) {
          mentionId = pickRandom(mentionTarget).id;
        }
      }

      console.log(
        `  ${sender.name} ${isGood ? "praises" : "critiques"} "${artwork.name}"${mentionId ? " (@mention)" : ""}`
      );
      await callTool("post_battle_message", {
        api_key: sender.api_key,
        artwork_id: artwork.id,
        content,
        ...(mentionId ? { mention_artist_id: mentionId } : {}),
      });
      messageCount++;
    }
  }

  // --- Crimson Dawn: lots of general discussion messages ---
  const crimson = allArtworks.find((a) => a.name === "Crimson Dawn");
  if (!crimson) {
    throw new Error('Fixture expected artwork "Crimson Dawn".');
  }

  const otherArtists = registeredArtists.filter(
    (a) => a.id !== crimson.artist_id
  );
  const crimsonCreator = registeredArtists.find(
    (a) => a.id === crimson.artist_id
  );

  const commentPool = [...goodComments, ...badComments, ...crimsonDawnCommentPool];

  for (let c = 0; c < CRIMSON_DAWN_EXTRA; c++) {
    const sender = otherArtists[c % otherArtists.length];
    const content = pickRandom(commentPool);

    console.log(
      `  ${sender.name} comments on "Crimson Dawn" (${c + 1}/${CRIMSON_DAWN_EXTRA})`
    );
    await callTool("post_battle_message", {
      api_key: sender.api_key,
      artwork_id: crimson.id,
      content,
    });
    messageCount++;
  }

  // --- Crimson Dawn: structured battle conversation with @-mentions ---
  const cycle = [otherArtists[0], crimsonCreator, otherArtists[1]];

  for (let i = 0; i < CRIMSON_DAWN_BATTLE_MSGS; i++) {
    const speaker = cycle[i % cycle.length];
    const content =
      battleConversationTemplates[i % battleConversationTemplates.length];

    const mentionTarget =
      speaker.id === crimsonCreator.id
        ? otherArtists[i % otherArtists.length]
        : crimsonCreator;

    console.log(
      `  ${speaker.name} battles on "Crimson Dawn" @${mentionTarget.name} (${i + 1}/${CRIMSON_DAWN_BATTLE_MSGS})`
    );

    const updateVote = i === CRIMSON_DAWN_BATTLE_MSGS - 3 ? 72 : undefined;

    await callTool("post_battle_message", {
      api_key: speaker.api_key,
      artwork_id: crimson.id,
      content,
      mention_artist_id: mentionTarget.id,
      ...(updateVote !== undefined ? { update_vote: updateVote } : {}),
    });
    messageCount++;
  }

  // --- Forest Protocol + Midnight Signal: smaller battle threads ---
  const forest = allArtworks.find((a) => a.name === "Forest Protocol");
  const midnight = allArtworks.find((a) => a.name === "Midnight Signal");

  for (const artwork of [forest, midnight].filter(Boolean)) {
    const creator = registeredArtists.find(
      (a) => a.id === artwork.artist_id
    );
    const reviewers = registeredArtists.filter(
      (a) => a.id !== artwork.artist_id
    );
    const battleCycle = [reviewers[0], creator, reviewers[1]];
    const msgCount = 10 + Math.floor(Math.random() * 11);

    for (let i = 0; i < msgCount; i++) {
      const speaker = battleCycle[i % battleCycle.length];
      const content =
        battleConversationTemplates[i % battleConversationTemplates.length];
      const mentionTarget =
        speaker.id === creator.id
          ? reviewers[i % reviewers.length]
          : creator;

      console.log(
        `  ${speaker.name} battles on "${artwork.name}" @${mentionTarget.name} (${i + 1}/${msgCount})`
      );
      await callTool("post_battle_message", {
        api_key: speaker.api_key,
        artwork_id: artwork.id,
        content,
        mention_artist_id: mentionTarget.id,
      });
      messageCount++;
    }
  }

  return messageCount;
}
