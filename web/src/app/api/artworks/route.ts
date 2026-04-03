import { NextRequest, NextResponse } from "next/server";
import { callMcpTool } from "@/lib/mcp-client";

interface ListArtworksResult {
  artworks: Array<{
    id: string;
    name: string;
    pitch: string;
    averageScore: number;
    totalVotes: number;
    totalBattles: number;
    created_at: string;
    detail_url: string;
  }>;
  total: number;
  page: number;
  page_size: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Number(searchParams.get("page") ?? 1);
  const pageSize = Number(searchParams.get("page_size") ?? 2);
  const sort = searchParams.get("sort") ?? "newest";

  try {
    const data = await callMcpTool<ListArtworksResult>("list_leaderboard", {
      page,
      page_size: pageSize,
      sort,
    });

    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch artworks";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
