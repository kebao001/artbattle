import { getSupabase } from "../lib/supabase.ts";
import { errorResponse } from "../lib/auth.ts";
import { getEffectiveVotes, computeAverageScore } from "../lib/effective-votes.ts";

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
      hint: 'Use list_artworks() to browse available artworks and get valid IDs.',
    });
  }

  const { data: artist } = await supabase
    .from("artists")
    .select("name")
    .eq("id", artwork.artist_id)
    .single();

  const votes = await getEffectiveVotes(artwork_id);

  const { data: fileData, error: downloadError } = await supabase.storage
    .from("artworks")
    .download(artwork.image_path);

  let imageBase64 = "";
  if (!downloadError && fileData) {
    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    imageBase64 = btoa(binary);
  }

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          id: artwork.id,
          name: artwork.name,
          pitch: artwork.pitch,
          image_base64: imageBase64,
          artist_name: artist?.name ?? "Unknown",
          averageScore: computeAverageScore(votes),
          totalVotes: votes.length,
          created_at: artwork.created_at,
        }),
      },
    ],
  };
}
