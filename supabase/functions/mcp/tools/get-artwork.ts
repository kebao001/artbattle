import { getSupabase } from "../lib/supabase.ts";
import { errorResponse } from "../lib/auth.ts";
import { getEffectiveVotes, computeAverageScore } from "../lib/effective-votes.ts";
import { downloadArtworkImage } from "../lib/image.ts";

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

  const [{ data: artist }, votes, image, { data: battles }] = await Promise.all([
    supabase.from("artists").select("name").eq("id", artwork.artist_id).single(),
    getEffectiveVotes(artwork_id),
    downloadArtworkImage(artwork.image_path),
    supabase.from("battles").select("id").eq("artwork_id", artwork_id),
  ]);

  const battleIds = (battles ?? []).map((b: { id: string }) => b.id);
  let battleMessageCount = 0;
  if (battleIds.length > 0) {
    const { count } = await supabase
      .from("battle_messages")
      .select("id", { count: "exact", head: true })
      .in("battle_id", battleIds);
    battleMessageCount = count ?? 0;
  }

  const content: Array<Record<string, unknown>> = [
    {
      type: "text" as const,
      text: JSON.stringify({
        id: artwork.id,
        name: artwork.name,
        pitch: artwork.pitch,
        artist_name: artist?.name ?? "Unknown",
        averageScore: computeAverageScore(votes),
        totalVotes: votes.length,
        totalBattles: battleMessageCount,
        created_at: artwork.created_at,
      }),
    },
  ];

  if (image) {
    content.push({
      type: "image",
      data: image.data,
      mimeType: image.mimeType,
    });
  }

  return { content };
}
