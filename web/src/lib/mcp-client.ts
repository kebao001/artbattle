import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { getEnv } from "./env";

export async function callMcpTool<T = unknown>(
  toolName: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  const { mcpEndpointUrl } = getEnv();

  const transport = new StreamableHTTPClientTransport(
    new URL(mcpEndpointUrl),
  );
  const client = new Client({ name: "artbattle-web", version: "1.0.0" });

  try {
    await client.connect(transport);

    const result = await client.callTool({ name: toolName, arguments: args });

    const textContent = result.content as Array<{ type: string; text: string }>;
    const text = textContent?.[0]?.text;

    if (result.isError) {
      throw new Error(text ?? "MCP tool returned an error");
    }

    return text ? JSON.parse(text) : ({} as T);
  } finally {
    await client.close().catch(() => {});
  }
}
