/**
 * Clears all user tables and the storage bucket in local Supabase.
 *
 * AUTH — New API Keys (replacing legacy service_role):
 *   Supabase replaced the old JWT-based `service_role` key with `sb_secret_...`.
 *   Run `npx supabase status` and look for "Secret key: sb_secret_xxxx".
 *   Set it as SUPABASE_SECRET_KEY in .env.local.
 */
import { createClient } from "@supabase/supabase-js";

const LOCAL_HOSTS = ["localhost", "127.0.0.1"];

const TABLES = [
  "battle_messages",
  "battle_participants",
  "battles",
  "comments",
  "votes",
  "artworks",
  "artists",
];

function assertLocalDatabase(endpointUrl) {
  const url = new URL(endpointUrl);
  if (!LOCAL_HOSTS.includes(url.hostname)) {
    throw new Error(
      `REFUSING TO RESET: "${url.hostname}" is not a local database.\n` +
        `This script only runs against localhost. ` +
        `Set MCP_ENDPOINT_URL to a local Supabase instance (e.g. http://localhost:54321/functions/v1/mcp).`
    );
  }
  return url;
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable is required.`);
  }
  return value;
}

async function emptyBucket(supabase, bucketId) {
  let offset = 0;
  const limit = 100;

  while (true) {
    const { data: objects, error } = await supabase.storage
      .from(bucketId)
      .list("", { limit, offset });

    if (error) throw new Error(`Failed to list objects in "${bucketId}": ${error.message}`);
    if (!objects || objects.length === 0) break;

    const paths = [];
    for (const item of objects) {
      if (item.id === null) {
        const { data: inner } = await supabase.storage
          .from(bucketId)
          .list(item.name, { limit: 1000 });
        if (inner) paths.push(...inner.map((f) => `${item.name}/${f.name}`));
      } else {
        paths.push(item.name);
      }
    }

    if (paths.length > 0) {
      const { error: removeError } = await supabase.storage.from(bucketId).remove(paths);
      if (removeError) throw new Error(`Failed to delete objects in "${bucketId}": ${removeError.message}`);
      console.log(`    Removed ${paths.length} file(s)`);
    }

    if (objects.length < limit) break;
    offset += limit;
  }
}

async function resetDatabase() {
  const mcpEndpoint = requireEnv("MCP_ENDPOINT_URL");
  const secretKey = requireEnv("SUPABASE_SECRET_KEY");

  const parsed = assertLocalDatabase(mcpEndpoint);
  const supabaseUrl = `${parsed.protocol}//${parsed.host}`;

  const supabase = createClient(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  console.log("  Clearing storage bucket...");
  await emptyBucket(supabase, "artworks");

  for (const table of TABLES) {
    console.log(`  Clearing table: ${table}`);
    const { error } = await supabase.from(table).delete().gte("created_at", "1970-01-01");
    if (error) throw new Error(`Failed to clear ${table}: ${error.message}`);
  }
}

console.log("=== Resetting local database ===\n");
resetDatabase()
  .then(() => console.log("\n✓ Database reset complete."))
  .catch((err) => {
    console.error("\n✗ Reset failed:", err.message);
    process.exit(1);
  });
