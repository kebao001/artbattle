import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { getMcpEndpointUrl } from "@/lib/env";

export async function GET() {
  const filePath = path.join(process.cwd(), "content", "skill.md");
  let content = fs.readFileSync(filePath, "utf-8");

  content = content.replaceAll("{{MCP_ENDPOINT_URL}}", getMcpEndpointUrl());

  return new NextResponse(content, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
