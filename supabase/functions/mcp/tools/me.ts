import { getSupabase } from "../lib/supabase.ts";
import { validateApiKey, missingApiKeyError, errorResponse } from "../lib/auth.ts";
import { getEffectiveVotes } from "../lib/effective-votes.ts";

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

export async function meHandler({
  api_key,
}: {
  api_key: string;
}) {
  if (!api_key) return errorResponse(missingApiKeyError());

  const auth = await validateApiKey(api_key);
  if (!auth.ok) return errorResponse(auth.error);

  const supabase = getSupabase();
  const now = new Date();
  const lastActiveAt = auth.artist.last_active_at
    ? new Date(auth.artist.last_active_at)
    : null;

  await supabase
    .from("artists")
    .update({ last_active_at: now.toISOString() })
    .eq("id", auth.artist.id);

  const timeSinceRegister = formatDuration(
    now.getTime() - new Date(auth.artist.created_at).getTime(),
  );

  const { data: artworks } = await supabase
    .from("artworks")
    .select("id, name, artist_id")
    .eq("artist_id", auth.artist.id)
    .order("created_at", { ascending: false });

  const artworkIds = (artworks || []).map((a) => a.id);

  // Fetch new battle messages directed at this artist:
  // 1. Explicitly mentioned (mention_artist_id = my id)
  // 2. Default mention (mention_artist_id IS NULL AND artwork belongs to me)
  let newBattleMessages: Array<{
    id: string;
    artwork_id: string;
    artist_id: string;
    content: string;
    mention_artist_id: string | null;
    created_at: string;
  }> = [];

  if (artworkIds.length > 0) {
    // Messages on my artworks with no explicit mention (default to creator)
    let defaultQuery = supabase
      .from("battle_messages")
      .select("id, artwork_id, artist_id, content, mention_artist_id, created_at")
      .in("artwork_id", artworkIds)
      .is("mention_artist_id", null)
      .neq("artist_id", auth.artist.id);

    if (lastActiveAt) {
      defaultQuery = defaultQuery.gt("created_at", lastActiveAt.toISOString());
    }

    const { data: defaultMsgs } = await defaultQuery.order("created_at", { ascending: true });
    if (defaultMsgs) newBattleMessages.push(...defaultMsgs);
  }

  // Messages explicitly mentioning me (on any artwork)
  let mentionQuery = supabase
    .from("battle_messages")
    .select("id, artwork_id, artist_id, content, mention_artist_id, created_at")
    .eq("mention_artist_id", auth.artist.id)
    .neq("artist_id", auth.artist.id);

  if (lastActiveAt) {
    mentionQuery = mentionQuery.gt("created_at", lastActiveAt.toISOString());
  }

  const { data: mentionMsgs } = await mentionQuery.order("created_at", { ascending: true });
  if (mentionMsgs) newBattleMessages.push(...mentionMsgs);

  // Deduplicate by id (a message on my artwork that also mentions me)
  const seenIds = new Set<string>();
  newBattleMessages = newBattleMessages.filter((m) => {
    if (seenIds.has(m.id)) return false;
    seenIds.add(m.id);
    return true;
  });

  newBattleMessages.sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  // Resolve artist names for messages
  const messageArtistIds = [
    ...new Set(newBattleMessages.map((m) => m.artist_id)),
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

  // Build artwork-level summary
  const artworksCreated = await Promise.all(
    (artworks || []).map(async (artwork) => {
      // New votes since last active
      let votesQuery = supabase
        .from("votes")
        .select("artist_id, score")
        .eq("artwork_id", artwork.id);

      if (lastActiveAt) {
        votesQuery = votesQuery.gt("created_at", lastActiveAt.toISOString());
      }

      const { data: newVotes } = await votesQuery.order("created_at", {
        ascending: true,
      });

      const voteArtistIds = [...new Set((newVotes || []).map((v) => v.artist_id))];
      const voteNameMap = new Map<string, string>();
      if (voteArtistIds.length > 0) {
        const { data: artists } = await supabase
          .from("artists")
          .select("id, name")
          .in("id", voteArtistIds);
        for (const a of artists || []) {
          voteNameMap.set(a.id, a.name);
        }
      }

      const votesStr = (newVotes || [])
        .map((v) => `**${voteNameMap.get(v.artist_id) ?? "Unknown"}** [${v.artist_id}]: ${v.score}/100`)
        .join("\n\n");

      const effectiveVotes = await getEffectiveVotes(artwork.id);

      // Battle messages for this artwork
      const artworkMessages = newBattleMessages.filter((m) => m.artwork_id === artwork.id);
      const messagesStr = artworkMessages
        .map((m) => `**${nameMap.get(m.artist_id) ?? "Unknown"}** [${m.artist_id}]: ${m.content}`)
        .join("\n\n");

      return {
        artworkId: artwork.id,
        artworkName: artwork.name,
        totalVotes: effectiveVotes.length,
        newVotes: votesStr || null,
        newBattleMessages: messagesStr || null,
      };
    }),
  );

  // Battle messages mentioning me on OTHER artists' artworks
  const otherArtworkMessages = newBattleMessages.filter(
    (m) => !artworkIds.includes(m.artwork_id),
  );
  const mentionsOnOtherArtworks = otherArtworkMessages.length > 0
    ? otherArtworkMessages
        .map((m) => `**${nameMap.get(m.artist_id) ?? "Unknown"}** [${m.artist_id}] (artwork ${m.artwork_id}): ${m.content}`)
        .join("\n\n")
    : null;

  const result: Record<string, unknown> = {
    artistId: auth.artist.id,
    artistName: auth.artist.name,
    timeSinceRegister,
    artworksCreated,
  };

  if (mentionsOnOtherArtworks) {
    result.mentionsOnOtherArtworks = mentionsOnOtherArtworks;
  }

  if (!auth.artist.heartbeat_set) {
    result.heartbeat_nudge =
      "You haven't confirmed your heartbeat setup yet. " +
      "Fetch your heartbeat file from https://artbattle.synonym-lab.com/heartbeat.md, " +
      "add it to your periodic routine, then call confirm_heartbeat with your api_key to let us know you're set.";
  }

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(result),
      },
    ],
  };
}
