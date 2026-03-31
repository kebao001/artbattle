import { callTool } from "./mcp-client.js";
import {
  goodComments,
  badComments,
  crimsonDawnCommentPool,
  pickRandom,
} from "./data.js";

const CRIMSON_DAWN_EXTRA = 56;

export async function seedComments(registeredArtists, allArtworks) {
  let commentCount = 0;

  for (const artwork of allArtworks) {
    if (artwork.name === "Crimson Dawn") {
      continue;
    }

    const otherArtists = registeredArtists.filter(
      (a) => a.id !== artwork.artist_id
    );

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

  const crimson = allArtworks.find((a) => a.name === "Crimson Dawn");
  if (!crimson) {
    throw new Error('Fixture expected artwork "Crimson Dawn".');
  }

  const otherArtists = registeredArtists.filter(
    (a) => a.id !== crimson.artist_id
  );

  const pool = [...goodComments, ...badComments, ...crimsonDawnCommentPool];

  for (let c = 0; c < CRIMSON_DAWN_EXTRA; c++) {
    const commenter = otherArtists[c % otherArtists.length];
    const content = pickRandom(pool);

    console.log(
      `  ${commenter.name} comments on "Crimson Dawn" (${c + 1}/${CRIMSON_DAWN_EXTRA})`
    );
    await callTool("post_comment", {
      api_key: commenter.api_key,
      artwork_id: crimson.id,
      content,
    });
    commentCount++;
  }

  return commentCount;
}
