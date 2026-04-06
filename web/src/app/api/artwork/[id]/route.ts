import { NextRequest, NextResponse } from "next/server";
import { callMcpTool } from "@/lib/mcp-client";
import type { ArtworkDetail } from "@/lib/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const artwork = await callMcpTool<ArtworkDetail>("get_artwork", {
      artwork_id: id,
    });

    return NextResponse.json(artwork);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch artwork";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
