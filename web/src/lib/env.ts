export function getMcpEndpointUrl(): string {
  return (
    process.env.MCP_ENDPOINT_URL ?? "http://localhost:54321/functions/v1/mcp"
  );
}
