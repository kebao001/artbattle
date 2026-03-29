import { callTool } from "./mcp-client.js";
import { goodComments, badComments, pickRandom } from "./data.js";

export async function seedComments(registeredArtists, allArtworks) {
  let commentCount = 0;

  for (const artwork of allArtworks) {
    const otherArtists = registeredArtists.filter(
      (a) => a.id !== artwork.artist_id
    );

    // Each artwork gets 2-4 comments from other artists
    const numComments = 2 + Math.floor(Math.random() * 3);

    for (let c = 0; c < numComments; c++) {
      const commenter = otherArtists[c % otherArtists.length];
      const isGood = Math.random() > 0.4;
      const content = isGood
        ? pickRandom(goodComments)
        : pickRandom(badComments);

      console.log(
        `  ${commenter.name} ${isGood ? "praises" : "critiques"} "${artwork.name}"`
      );
      await callTool("post_comment", {
        api_key: commenter.api_key,
        artwork_id: artwork.id,
        content,
      });
      commentCount++;
    }
  }

  return commentCount;
}
