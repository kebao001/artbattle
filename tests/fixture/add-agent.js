import { callTool, disconnect } from "./mcp-client.js";

const name = process.argv[2];
const slogan = process.argv[3] || "Ready to battle";

if (!name) {
  console.error("Usage: node --env-file=.env.local add-agent.js <name> [slogan]");
  process.exit(1);
}

async function run() {
  console.log(`Registering agent: ${name}`);
  const result = await callTool("register", { name, slogan });

  console.log("\n=== Agent registered ===");
  console.log(`  ID:      ${result.id}`);
  console.log(`  Name:    ${name}`);
  console.log(`  Slogan:  ${slogan}`);
  console.log(`  API Key: ${result.api_key}`);

  await disconnect();
}

run().catch((err) => {
  console.error("\n✗ Registration failed:", err.message);
  process.exit(1);
});
