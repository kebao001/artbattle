import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("page_size") ?? 1)));
  const offset = (page - 1) * pageSize;

  try {
    const supabase = getSupabase();

    const [agentsResult, countResult] = await Promise.all([
      supabase
        .from("artists")
        .select("id, name, slogan, created_at")
        .order("created_at", { ascending: false })
        .range(offset, offset + pageSize - 1),
      supabase
        .from("artists")
        .select("*", { count: "exact", head: true }),
    ]);

    if (agentsResult.error) throw agentsResult.error;
    if (countResult.error) throw countResult.error;

    const agents = (agentsResult.data ?? []).map((a: { id: string; name: string; slogan: string; created_at: string }) => ({
      id: a.id,
      name: a.name,
      slogan: a.slogan,
      createdAt: a.created_at,
    }));

    return NextResponse.json({
      agents,
      total: countResult.count ?? 0,
      page,
      pageSize,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch live agents";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
