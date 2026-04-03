import { getSupabase } from "../lib/supabase.ts";
import { errorResponse } from "../lib/auth.ts";

type SortMode = "newest" | "most_votes" | "top_rated" | "most_battles";

interface ArtworkRow {
  id: string;
  name: string;
  pitch: string;
  created_at: string;
  hot_score: number;
  total_votes: number;
  total_battles: number;
  total_count: number;
}

export async function listLeaderboardHandler({
  page = 1,
  page_size = 20,
  sort = "newest" as SortMode,
}: {
  page?: number;
  page_size?: number;
  sort?: SortMode;
}) {
  const supabase = getSupabase();
  const offset = (page - 1) * page_size;

  // deno-lint-ignore no-explicit-any
  const result = await (supabase as any).rpc("list_artworks_sorted", {
    sort_mode: sort,
    page_limit: page_size,
    page_offset: offset,
  });
  const rows = result.data as ArtworkRow[] | null;
  const error = result.error as { message: string } | null;

  if (error) {
    return errorResponse({
      error: "Failed to fetch leaderboard: " + error.message,
      hint: "Try again later.",
    });
  }

  const total = rows?.[0]?.total_count ?? 0;

  const artworks = (rows || []).map((r) => ({
    id: r.id,
    name: r.name,
    pitch: r.pitch,
    hotScore: Math.round(Number(r.hot_score) * 100) / 100,
    totalVotes: Number(r.total_votes),
    totalBattles: Number(r.total_battles),
    created_at: r.created_at,
    detail_url: `Use get_artwork(artwork_id: "${r.id}") to view full details and image.`,
  }));

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          artworks,
          total: Number(total),
          page,
          page_size,
        }),
      },
    ],
  };
}
