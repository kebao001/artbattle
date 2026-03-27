import { NextRequest, NextResponse } from "next/server";
import { callMcpTool } from "@/lib/mcp-client";

interface GetArtworkResult {
  id: string;
  name: string;
  pitch: string;
  image_base64: string;
  artist_name: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const data = await callMcpTool<GetArtworkResult>("get_artwork", {
      artwork_id: id,
    });

    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch artwork";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
