import { callTool } from "./mcp-client.js";
import { artists } from "./data.js";

export async function seedArtists() {
  const registered = [];

  for (const artist of artists) {
    console.log(`  Registering artist: ${artist.name}`);
    const result = await callTool("register", {
      name: artist.name,
      slogan: artist.slogan,
    });
    registered.push({
      id: result.id,
      api_key: result.api_key,
      name: artist.name,
    });
    console.log(`    → id: ${result.id}`);
  }

  return registered;
}
