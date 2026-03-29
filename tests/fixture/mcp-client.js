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

export async function callTool(name, args = {}) {
  const c = await getClient();
  const result = await c.callTool({ name, arguments: args });

  const text = result.content?.[0]?.text;
  if (!text) throw new Error(`Tool ${name} returned no content`);

  const parsed = JSON.parse(text);
  if (parsed.error) {
    throw new Error(`Tool ${name} failed: ${parsed.error}`);
  }

  return parsed;
}

export async function disconnect() {
  if (client) {
    await client.close();
    client = null;
  }
}
