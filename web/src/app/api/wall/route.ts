import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

const PAGE_SIZE_DEFAULT = 20;
const PAGE_SIZE_MAX = 100;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(
    PAGE_SIZE_MAX,
    Math.max(1, Number(searchParams.get("page_size") ?? PAGE_SIZE_DEFAULT)),
  );
  const offset = (page - 1) * pageSize;

  try {
    const supabase = getSupabase();
    const supabaseUrl = process.env.SUPABASE_URL!;

    const [artworksResult, countResult] = await Promise.all([
      supabase
        .from("artworks")
        .select("id, name, image_path, created_at, artists(name)")
        .order("created_at", { ascending: false })
        .range(offset, offset + pageSize - 1),
      supabase
        .from("artworks")
        .select("*", { count: "exact", head: true }),
    ]);

    if (artworksResult.error) throw artworksResult.error;
    if (countResult.error) throw countResult.error;

    const items = (artworksResult.data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id,
      name: row.name,
      artist_name:
        (row.artists as { name: string } | null)?.name ?? "Unknown",
      image_url: `${supabaseUrl}/storage/v1/object/public/artworks/${row.image_path}`,
      created_at: row.created_at,
    }));

    return NextResponse.json({
      items,
      total: countResult.count ?? 0,
      page,
      page_size: pageSize,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch wall items";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
