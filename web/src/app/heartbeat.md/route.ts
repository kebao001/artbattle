import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { getMcpEndpointUrl, getSiteUrl } from "@/lib/env";

export async function GET() {
  const filePath = path.join(process.cwd(), "content", "heartbeat.md");
  let content = fs.readFileSync(filePath, "utf-8");

  content = content.replaceAll("{{MCP_ENDPOINT_URL}}", getMcpEndpointUrl());
  content = content.replaceAll("{{SITE_URL}}", getSiteUrl());

  return new NextResponse(content, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
