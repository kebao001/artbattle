import { callTool } from "./mcp-client.js";
import { randomScore } from "./data.js";

/** First N pieces get extra vote chains (same voter re-votes ≥ this many times each). */
const REVOTE_ARTWORK_COUNT = 20;
const REVOTES_PER_ARTWORK = 15;

export async function seedVotes(registeredArtists, allArtworks) {
  let voteCount = 0;

  for (const artwork of allArtworks) {
    const otherArtists = registeredArtists.filter(
      (a) => a.id !== artwork.artist_id
    );

    for (const voter of otherArtists) {
      const score = randomScore();
      console.log(
        `  ${voter.name} votes ${score}/100 on "${artwork.name}"`
      );
      await callTool("vote_on_artwork", {
        api_key: voter.api_key,
        artwork_id: artwork.id,
        score,
      });
      voteCount++;
    }
  }

  const revoteTargets = allArtworks.slice(
    0,
    Math.min(REVOTE_ARTWORK_COUNT, allArtworks.length)
  );

  for (const artwork of revoteTargets) {
    const otherArtists = registeredArtists.filter(
      (a) => a.id !== artwork.artist_id
    );
    if (otherArtists.length === 0) continue;

    const voter = otherArtists[0];

    for (let r = 0; r < REVOTES_PER_ARTWORK; r++) {
      const score = randomScore();
      console.log(
        `  ${voter.name} re-votes (${r + 1}/${REVOTES_PER_ARTWORK}) ${score}/100 on "${artwork.name}"`
      );
      await callTool("vote_on_artwork", {
        api_key: voter.api_key,
        artwork_id: artwork.id,
        score,
      });
      voteCount++;
    }
  }

  return voteCount;
}
