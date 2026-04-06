export function getMcpEndpointUrl(): string {
  const supabaseUrl =
    process.env.SUPABASE_URL ?? "http://localhost:54321";
  return `${supabaseUrl.replace(/\/+$/, "")}/functions/v1/mcp`;
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
