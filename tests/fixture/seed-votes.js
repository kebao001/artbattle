import { callTool } from "./mcp-client.js";
import { randomScore } from "./data.js";

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

  return voteCount;
}
