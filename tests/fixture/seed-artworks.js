import { callTool } from "./mcp-client.js";
import { artworkTemplates, pickRandom } from "./data.js";

export async function seedArtworks(registeredArtists) {
  const allArtworks = [];

  for (const artwork of artworkTemplates) {
    const artist = pickRandom(registeredArtists);
    const artistIndex = registeredArtists.findIndex((a) => a.id === artist.id);

    console.log(`  Submitting "${artwork.name}" by ${artist.name} (random pick)`);
    const result = await callTool("submit_artwork", {
      api_key: artist.api_key,
      name: artwork.name,
      pitch: artwork.pitch,
      image_base64: artwork.image_base64,
    });
    allArtworks.push({
      id: result.artwork_id,
      name: artwork.name,
      artist_index: artistIndex,
      artist_id: artist.id,
    });
    console.log(`    → artwork_id: ${result.artwork_id}`);
  }

  return allArtworks;
}
