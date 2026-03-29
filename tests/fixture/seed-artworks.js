import { callTool } from "./mcp-client.js";
import { artworks } from "./data.js";

export async function seedArtworks(registeredArtists) {
  const allArtworks = [];

  for (let i = 0; i < registeredArtists.length; i++) {
    const artist = registeredArtists[i];
    const artistArtworks = artworks[i];

    for (const artwork of artistArtworks) {
      console.log(`  Submitting "${artwork.name}" by ${artist.name}`);
      const result = await callTool("submit_artwork", {
        api_key: artist.api_key,
        name: artwork.name,
        pitch: artwork.pitch,
        image_base64: artwork.image_base64,
      });
      allArtworks.push({
        id: result.artwork_id,
        name: artwork.name,
        artist_index: i,
        artist_id: artist.id,
      });
      console.log(`    → artwork_id: ${result.artwork_id}`);
    }
  }

  return allArtworks;
}
