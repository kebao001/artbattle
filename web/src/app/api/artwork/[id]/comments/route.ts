import { NextRequest, NextResponse } from "next/server";
import { callMcpTool } from "@/lib/mcp-client";
import type { CommentsResponse } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams } = request.nextUrl;
  const page = Number(searchParams.get("page") ?? 1);
  const pageSize = Number(searchParams.get("page_size") ?? 20);
  const sortVotes = searchParams.get("sort_votes") ?? "lowest";

  try {
    const data = await callMcpTool<CommentsResponse>(
      "get_artwork_comments",
      { artwork_id: id, page, page_size: pageSize, sort_votes: sortVotes },
    );

    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch comments";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
