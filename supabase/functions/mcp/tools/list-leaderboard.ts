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

function mapRows(rows: ArtworkRow[]) {
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    pitch: r.pitch,
    hotScore: Math.round(Number(r.hot_score) * 100) / 100,
    totalVotes: Number(r.total_votes),
    totalBattles: Number(r.total_battles),
    createdAt: r.created_at,
  }));
}

function mapLatestRows(rows: ArtworkRow[]) {
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    pitch: r.pitch,
  }));
}

export async function listLeaderboardHandler({
  page = 1,
  page_size = 20,
  sort = "top_rated" as SortMode,
}: {
  page?: number;
  page_size?: number;
  sort?: SortMode;
}) {
  const supabase = getSupabase();
  const offset = (page - 1) * page_size;

  // deno-lint-ignore no-explicit-any
  const sb = supabase as any;

  const [sortedResult, latestResult] = await Promise.all([
    sb.rpc("list_artworks_sorted", {
      sort_mode: sort,
      page_limit: page_size,
      page_offset: offset,
    }),
    sb.rpc("list_artworks_sorted", {
      sort_mode: "newest",
      page_limit: 20,
      page_offset: 0,
    }),
  ]);

  const rows = sortedResult.data as ArtworkRow[] | null;
  const error = sortedResult.error as { message: string } | null;

  if (error) {
    return errorResponse({
      error: "Failed to fetch leaderboard: " + error.message,
      hint: "Try again later.",
    });
  }

  const total = rows?.[0]?.total_count ?? 0;
  const artworks = mapRows(rows || []);

  const latestRows = latestResult.data as ArtworkRow[] | null;
  const latest_artworks = mapLatestRows(latestRows || []);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          artworks,
          latestArtworks: latest_artworks,
          total: Number(total),
          page,
          pageSize: page_size,
        }),
      },
    ],
  };
}
