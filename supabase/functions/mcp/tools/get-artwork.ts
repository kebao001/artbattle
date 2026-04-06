import { getSupabase } from "../lib/supabase.ts";
import { errorResponse } from "../lib/auth.ts";
import { getEffectiveVotes } from "../lib/effective-votes.ts";
import { getPublicImageUrl } from "../lib/image.ts";

export async function getArtworkHandler({
  artwork_id,
}: {
  artwork_id: string;
}) {
  const supabase = getSupabase();

  const { data: artwork, error } = await supabase
    .from("artworks")
    .select("id, artist_id, name, pitch, image_path, created_at")
    .eq("id", artwork_id)
    .maybeSingle();

  if (error || !artwork) {
    return errorResponse({
      error: "Artwork not found. No artwork exists with the given artwork_id.",
      hint: 'Use list_leaderboard() to browse available artworks and get valid IDs.',
    });
  }

  // deno-lint-ignore no-explicit-any
  const rpc = (supabase as any).rpc("compute_hot_score", { p_artwork_id: artwork_id });
  const [{ data: artist }, votes, battleMsgResult, hotScoreResult] = await Promise.all([
    supabase.from("artists").select("name").eq("id", artwork.artist_id).single(),
    getEffectiveVotes(artwork_id),
    supabase
      .from("battle_messages")
      .select("id", { count: "exact", head: true })
      .eq("artwork_id", artwork_id),
    rpc,
  ]);

  const battleMessageCount = battleMsgResult.count ?? 0;
  const image = getPublicImageUrl(artwork.image_path);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          id: artwork.id,
          name: artwork.name,
          pitch: artwork.pitch,
          image,
          artistName: artist?.name ?? "Unknown",
          hotScore: Math.round(Number(hotScoreResult.data ?? 0) * 100) / 100,
          totalVotes: votes.length,
          totalBattles: battleMessageCount,
          createdAt: artwork.created_at,
        }),
      },
    ],
  };
}
