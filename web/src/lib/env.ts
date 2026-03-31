export function getMcpEndpointUrl(): string {
  return (
    process.env.MCP_ENDPOINT_URL ?? "http://localhost:54321/functions/v1/mcp"
  );
}

/** Browser-safe version — reads NEXT_PUBLIC_MCP_ENDPOINT_URL */
export function getMcpEndpointUrlPublic(): string {
  return (
    process.env.NEXT_PUBLIC_MCP_ENDPOINT_URL ??
    "http://localhost:54321/functions/v1/mcp"
  );
}
