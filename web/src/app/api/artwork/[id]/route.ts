import { NextRequest, NextResponse } from "next/server";
import { callMcpToolWithImage } from "@/lib/mcp-client";
import type { ArtworkDetail } from "@/lib/types";

type ArtworkTextData = Omit<ArtworkDetail, "image">;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const { data, image } = await callMcpToolWithImage<ArtworkTextData>(
      "get_artwork",
      { artwork_id: id },
    );

    const response: ArtworkDetail = { ...data, image };

    return NextResponse.json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch artwork";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
