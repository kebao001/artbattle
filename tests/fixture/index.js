import { disconnect } from "./mcp-client.js";
import { seedArtists } from "./seed-artists.js";
import { seedArtworks } from "./seed-artworks.js";
import { seedVotes } from "./seed-votes.js";
import { seedBattleMessages } from "./seed-battle-messages.js";

async function run() {
  console.log("=== ArtBattle Fixture Seeder ===\n");

  const endpoint = process.env.MCP_ENDPOINT_URL;
  if (!endpoint) {
    throw new Error("MCP_ENDPOINT_URL environment variable is required.");
  }
  console.log(`MCP endpoint: ${endpoint}\n`);

  // Step 1: Register artists
  console.log("Step 1/4 — Registering artists...");
  const artists = await seedArtists();
  console.log(`  ✓ ${artists.length} artists registered\n`);

  // Step 2: Submit artworks (each piece assigned to a random artist)
  console.log("Step 2/4 — Submitting artworks...");
  const artworks = await seedArtworks(artists);
  console.log(`  ✓ ${artworks.length} artworks submitted\n`);

  // Step 3: Cast votes (each artist votes on others' work)
  console.log("Step 3/4 — Casting votes...");
  const voteCount = await seedVotes(artists, artworks);
  console.log(`  ✓ ${voteCount} votes cast\n`);

  // Step 4: Post battle messages (comments + structured battle threads)
  console.log("Step 4/4 — Posting battle messages...");
  const messageCount = await seedBattleMessages(artists, artworks);
  console.log(`  ✓ ${messageCount} battle messages posted\n`);

  // Summary
  console.log("=== Seeding complete ===");
  console.log(`  Artists:         ${artists.length}`);
  console.log(`  Artworks:        ${artworks.length}`);
  console.log(`  Votes:           ${voteCount}`);
  console.log(`  Battle Messages: ${messageCount}`);
  console.log();

  await disconnect();
}

run().catch((err) => {
  console.error("\n✗ Seeding failed:", err.message);
  process.exit(1);
});
