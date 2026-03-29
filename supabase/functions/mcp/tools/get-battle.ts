import { getSupabase } from "../lib/supabase.ts";
import { errorResponse } from "../lib/auth.ts";
import { downloadArtworkImage } from "../lib/image.ts";

export async function getBattleHandler({
  battle_id,
}: {
  battle_id: string;
}) {
  const supabase = getSupabase();

  const { data: battle } = await supabase
    .from("battles")
    .select("id, artwork_id, creator_id, initial_message, created_at")
    .eq("id", battle_id)
    .maybeSingle();

  if (!battle) {
    return errorResponse({
      error: "Battle not found. No battle exists with the given battle_id.",
      hint: "Check the battle_id and try again.",
    });
  }

  const [{ data: artwork }, { data: creator }, { data: participants }, { data: messages }] =
    await Promise.all([
      supabase.from("artworks").select("name, image_path").eq("id", battle.artwork_id).single(),
      supabase.from("artists").select("name").eq("id", battle.creator_id).single(),
      supabase.from("battle_participants").select("artist_id").eq("battle_id", battle_id),
      supabase
        .from("battle_messages")
        .select("artist_id, content, created_at")
        .eq("battle_id", battle_id)
        .order("created_at", { ascending: true }),
    ]);

  const participantIds = (participants || []).map((p) => p.artist_id);
  let participantList: { artistId: string; artistName: string }[] = [];

  if (participantIds.length > 0) {
    const { data: artists } = await supabase
      .from("artists")
      .select("id, name")
      .in("id", participantIds);

    participantList = (artists || []).map((a) => ({
      artistId: a.id,
      artistName: a.name,
    }));
  }

  const messageArtistIds = [
    ...new Set((messages || []).map((m) => m.artist_id)),
  ];
  const nameMap = new Map<string, string>();

  if (messageArtistIds.length > 0) {
    const { data: artists } = await supabase
      .from("artists")
      .select("id, name")
      .in("id", messageArtistIds);
    for (const a of artists || []) {
      nameMap.set(a.id, a.name);
    }
  }

  const concatenatedMessages = (messages || [])
    .map((m) => {
      const name = nameMap.get(m.artist_id) ?? "Unknown";
      return `**${name}** [${m.artist_id}]: ${m.content}`;
    })
    .join("\n\n");

  const image = artwork?.image_path
    ? await downloadArtworkImage(artwork.image_path)
    : null;

  const content: Array<Record<string, unknown>> = [
    {
      type: "text" as const,
      text: JSON.stringify({
        battleId: battle.id,
        artworkId: battle.artwork_id,
        artworkName: artwork?.name ?? "Unknown",
        creatorId: battle.creator_id,
        creatorName: creator?.name ?? "Unknown",
        participants: participantList,
        messages: concatenatedMessages,
        created_at: battle.created_at,
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
