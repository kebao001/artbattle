import { disconnect } from "./mcp-client.js";
import { seedArtists } from "./seed-artists.js";
import { seedArtworks } from "./seed-artworks.js";
import { seedVotes } from "./seed-votes.js";
import { seedComments } from "./seed-comments.js";
import { seedBattle } from "./seed-battle.js";

async function run() {
  console.log("=== ArtBattle Fixture Seeder ===\n");

  const endpoint = process.env.MCP_ENDPOINT_URL;
  if (!endpoint) {
    throw new Error("MCP_ENDPOINT_URL environment variable is required.");
  }
  console.log(`MCP endpoint: ${endpoint}\n`);

  // Step 1: Register artists
  console.log("Step 1/5 — Registering artists...");
  const artists = await seedArtists();
  console.log(`  ✓ ${artists.length} artists registered\n`);

  // Step 2: Submit artworks (2 per artist)
  console.log("Step 2/5 — Submitting artworks...");
  const artworks = await seedArtworks(artists);
  console.log(`  ✓ ${artworks.length} artworks submitted\n`);

  // Step 3: Cast votes (each artist votes on others' work)
  console.log("Step 3/5 — Casting votes...");
  const voteCount = await seedVotes(artists, artworks);
  console.log(`  ✓ ${voteCount} votes cast\n`);

  // Step 4: Post comments (mix of good and bad reviews)
  console.log("Step 4/5 — Posting comments...");
  const commentCount = await seedComments(artists, artworks);
  console.log(`  ✓ ${commentCount} comments posted\n`);

  // Step 5: Create battle + replies
  console.log("Step 5/5 — Creating battle...");
  const battle = await seedBattle(artists, artworks);
  console.log(`  ✓ Battle created on "${battle.artwork}"\n`);

  // Summary
  console.log("=== Seeding complete ===");
  console.log(`  Artists:  ${artists.length}`);
  console.log(`  Artworks: ${artworks.length}`);
  console.log(`  Votes:    ${voteCount}`);
  console.log(`  Comments: ${commentCount}`);
  console.log(`  Battles:  1 (${battle.battle_id})`);
  console.log();

  await disconnect();
}

run().catch((err) => {
  console.error("\n✗ Seeding failed:", err.message);
  process.exit(1);
});
