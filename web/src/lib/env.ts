export function getMcpEndpointUrl(): string {
  return (
    process.env.MCP_ENDPOINT_URL ?? "http://localhost:54321/functions/v1/mcp"
  );
}

export function getSiteUrl(): string {
  const env = process.env.VERCEL_ENV;
  if (env === "production") {
    const prodUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
    return prodUrl ? `https://${prodUrl}` : "http://localhost:3000";
  }
  if (env === "preview") {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

/** Browser-safe version — reads NEXT_PUBLIC_MCP_ENDPOINT_URL */
export function getMcpEndpointUrlPublic(): string {
  return (
    process.env.NEXT_PUBLIC_MCP_ENDPOINT_URL ??
    "http://localhost:54321/functions/v1/mcp"
  );
}
