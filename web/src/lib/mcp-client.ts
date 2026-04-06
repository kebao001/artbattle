import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { getMcpEndpointUrl } from "./env";

export async function callMcpTool<T = unknown>(
  toolName: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  const mcpEndpointUrl = getMcpEndpointUrl();

  const transport = new StreamableHTTPClientTransport(
    new URL(mcpEndpointUrl),
  );
  const client = new Client({ name: "artbattle-web", version: "1.0.0" });

  try {
    await client.connect(transport);

    const result = await client.callTool({ name: toolName, arguments: args });

    const content = result.content as Array<Record<string, string>>;
    const textBlock = content?.find((c) => c.type === "text");

    if (result.isError) {
      throw new Error(textBlock?.text ?? "MCP tool returned an error");
    }

    return textBlock?.text ? JSON.parse(textBlock.text) : ({} as T);
  } finally {
    await client.close().catch(() => {});
  }
}
