import { NextRequest, NextResponse } from "next/server";
import { callMcpToolWithImage } from "@/lib/mcp-client";
import type { BattleResponse } from "@/lib/types";

type BattleTextData = Omit<BattleResponse, "image">;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const { data, image } = await callMcpToolWithImage<BattleTextData>(
      "get_battle",
      { battle_id: id },
    );

    const response: BattleResponse = { ...data, image };

    return NextResponse.json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch battle";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
