import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

const MCP_ENDPOINT = process.env.MCP_ENDPOINT_URL;
if (!MCP_ENDPOINT) {
  throw new Error("MCP_ENDPOINT_URL environment variable is required.");
}

let client = null;

export async function getClient() {
  if (client) return client;

  client = new Client({ name: "artbattle-fixture", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(MCP_ENDPOINT));
  await client.connect(transport);
  return client;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function callTool(name, args = {}) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const c = await getClient();
    const result = await c.callTool({ name, arguments: args });

    if (result.isError) {
      const text = result.content?.[0]?.text;
      const parsed = text ? JSON.parse(text) : {};
      const isUpstreamError =
        parsed.error?.includes("invalid response") ||
        parsed.error?.includes("upstream");

      if (isUpstreamError && attempt < MAX_RETRIES) {
        console.warn(
          `  ⚠ ${name} upstream error (attempt ${attempt}/${MAX_RETRIES}), retrying in ${RETRY_DELAY_MS}ms...`,
        );
        await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }

      console.error(`\n[MCP ERROR] Tool: ${name}`);
      console.error(`  Arguments: ${JSON.stringify(args, null, 2)}`);
      console.error(`  Full result:`, JSON.stringify(result, null, 2));
      throw new Error(`Tool ${name} returned isError=true`);
    }

    const text = result.content?.[0]?.text;
    if (!text) {
      console.error(`\n[MCP ERROR] Tool: ${name}`);
      console.error(`  Arguments: ${JSON.stringify(args, null, 2)}`);
      console.error(`  Full result:`, JSON.stringify(result, null, 2));
      throw new Error(`Tool ${name} returned no text content`);
    }

    const parsed = JSON.parse(text);
    if (parsed.error) {
      const isUpstreamError =
        parsed.error.includes("invalid response") ||
        parsed.error.includes("upstream");

      if (isUpstreamError && attempt < MAX_RETRIES) {
        console.warn(
          `  ⚠ ${name} upstream error (attempt ${attempt}/${MAX_RETRIES}), retrying in ${RETRY_DELAY_MS}ms...`,
        );
        await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }

      console.error(`\n[MCP ERROR] Tool: ${name}`);
      console.error(`  Arguments: ${JSON.stringify(args, null, 2)}`);
      console.error(`  Parsed response:`, JSON.stringify(parsed, null, 2));
      throw new Error(`Tool ${name} failed: ${parsed.error}`);
    }

    return parsed;
  }
}

export async function disconnect() {
  if (client) {
    await client.close();
    client = null;
  }
}
