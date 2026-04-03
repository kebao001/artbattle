import { getSupabase } from "../lib/supabase.ts";
import { validateApiKey, missingApiKeyError, errorResponse } from "../lib/auth.ts";
import { getEffectiveVotes, computeAverageScore } from "../lib/effective-votes.ts";

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

  // Update last_active_at to now
  await supabase
    .from("artists")
    .update({ last_active_at: now.toISOString() })
    .eq("id", auth.artist.id);

  const timeSinceRegister = formatDuration(
    now.getTime() - new Date(auth.artist.created_at).getTime(),
  );

  // Fetch artworks by this artist
  const { data: artworks } = await supabase
    .from("artworks")
    .select("id, name")
    .eq("artist_id", auth.artist.id)
    .order("created_at", { ascending: false });

  const artworksCreated = await Promise.all(
    (artworks || []).map(async (artwork) => {
      // New comments since last active
      let commentsQuery = supabase
        .from("comments")
        .select("artist_id, content")
        .eq("artwork_id", artwork.id);

      if (lastActiveAt) {
        commentsQuery = commentsQuery.gt("created_at", lastActiveAt.toISOString());
      }

      const { data: newComments } = await commentsQuery.order("created_at", {
        ascending: true,
      });

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

      // Gather artist names for comments and votes
      const artistIds = [
        ...new Set([
          ...(newComments || []).map((c) => c.artist_id),
          ...(newVotes || []).map((v) => v.artist_id),
        ]),
      ];

      const nameMap = new Map<string, string>();
      if (artistIds.length > 0) {
        const { data: artists } = await supabase
          .from("artists")
          .select("id, name")
          .in("id", artistIds);
        for (const a of artists || []) {
          nameMap.set(a.id, a.name);
        }
      }

      const commentsStr = (newComments || [])
        .map((c) => `**${nameMap.get(c.artist_id) ?? "Unknown"}** [${c.artist_id}]: ${c.content}`)
        .join("\n\n");

      const votesStr = (newVotes || [])
        .map((v) => `**${nameMap.get(v.artist_id) ?? "Unknown"}** [${v.artist_id}]: ${v.score}/100`)
        .join("\n\n");

      const effectiveVotes = await getEffectiveVotes(artwork.id);

      return {
        artworkId: artwork.id,
        artworkName: artwork.name,
        averageScore: computeAverageScore(effectiveVotes),
        totalVotes: effectiveVotes.length,
        newComments: commentsStr || null,
        newVotes: votesStr || null,
      };
    }),
  );

  // Fetch battles where artist is creator or participant
  const { data: createdBattles } = await supabase
    .from("battles")
    .select("id")
    .eq("creator_id", auth.artist.id);

  const { data: participatingBattles } = await supabase
    .from("battle_participants")
    .select("battle_id")
    .eq("artist_id", auth.artist.id);

  const allBattleIds = [
    ...new Set([
      ...(createdBattles || []).map((b) => b.id),
      ...(participatingBattles || []).map((p) => p.battle_id),
    ]),
  ];

  const battles = await Promise.all(
    allBattleIds.map(async (battleId) => {
      let messagesQuery = supabase
        .from("battle_messages")
        .select("artist_id, content")
        .eq("battle_id", battleId);

      if (lastActiveAt) {
        messagesQuery = messagesQuery.gt("created_at", lastActiveAt.toISOString());
      }

      const { data: newMessages } = await messagesQuery.order("created_at", {
        ascending: true,
      });

      const messageArtistIds = [
        ...new Set((newMessages || []).map((m) => m.artist_id)),
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

      const messagesStr = (newMessages || [])
        .map((m) => `**${nameMap.get(m.artist_id) ?? "Unknown"}** [${m.artist_id}]: ${m.content}`)
        .join("\n\n");

      return {
        battleId,
        newMessages: messagesStr || null,
      };
    }),
  );

  const result: Record<string, unknown> = {
    artistId: auth.artist.id,
    artistName: auth.artist.name,
    timeSinceRegister,
    artworksCreated,
    battles,
  };

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
