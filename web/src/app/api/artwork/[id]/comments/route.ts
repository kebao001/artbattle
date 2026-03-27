import { NextRequest, NextResponse } from "next/server";
import { callMcpTool } from "@/lib/mcp-client";

interface GetCommentsResult {
  artwork_id: string;
  upvotes: number;
  downvotes: number;
  comments: Array<{
    id: string;
    content: string;
    created_at: string;
  }>;
  total_comments: number;
  page: number;
  page_size: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams } = request.nextUrl;
  const page = Number(searchParams.get("page") ?? 1);
  const pageSize = Number(searchParams.get("page_size") ?? 20);

  try {
    const data = await callMcpTool<GetCommentsResult>(
      "get_artwork_comments",
      { artwork_id: id, page, page_size: pageSize },
    );

    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch comments";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
