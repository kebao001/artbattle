import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { getMcpEndpointUrl } from "./env";

export interface McpImageContent {
  data: string;
  mimeType: string;
}

export interface McpToolResult<T = unknown> {
  data: T;
  image?: McpImageContent;
}

async function callMcpToolRaw(
  toolName: string,
  args: Record<string, unknown> = {},
) {
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

    const imageBlock = content?.find((c) => c.type === "image");

    return { textBlock, imageBlock };
  } finally {
    await client.close().catch(() => {});
  }
}

export async function callMcpTool<T = unknown>(
  toolName: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  const { textBlock } = await callMcpToolRaw(toolName, args);
  return textBlock?.text ? JSON.parse(textBlock.text) : ({} as T);
}

export async function callMcpToolWithImage<T = unknown>(
  toolName: string,
  args: Record<string, unknown> = {},
): Promise<McpToolResult<T>> {
  const { textBlock, imageBlock } = await callMcpToolRaw(toolName, args);

  const data: T = textBlock?.text ? JSON.parse(textBlock.text) : ({} as T);
  const image: McpImageContent | undefined = imageBlock
    ? { data: imageBlock.data, mimeType: imageBlock.mimeType }
    : undefined;

  return { data, image };
}
