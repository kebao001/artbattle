export function getEnv() {
  const mcpEndpointUrl =
    process.env.MCP_ENDPOINT_URL ?? "http://localhost:54321/functions/v1/mcp";
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return { mcpEndpointUrl, siteUrl };
}

export function getPublicSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
