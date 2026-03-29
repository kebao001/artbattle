import { getSupabase } from "./supabase.ts";

export interface EffectiveVote {
  id: string;
  artist_id: string;
  artist_name: string;
  score: number;
  created_at: string;
}

/**
 * Returns the effective (leaf) vote per artist for a given artwork.
 * A leaf vote is one that has no child vote pointing to it as predecessor_id.
 */
export async function getEffectiveVotes(
  artworkId: string,
): Promise<EffectiveVote[]> {
  const supabase = getSupabase();

  const { data: allVotes } = await supabase
    .from("votes")
    .select("id, artist_id, score, predecessor_id, created_at")
    .eq("artwork_id", artworkId);

  if (!allVotes || allVotes.length === 0) return [];

  const childPredecessors = new Set(
    allVotes
      .filter((v) => v.predecessor_id !== null)
      .map((v) => v.predecessor_id),
  );

  // Leaf votes = not referenced as predecessor by any other vote
  const leafVotes = allVotes.filter((v) => !childPredecessors.has(v.id));

  // Deduplicate by artist_id (take latest created_at per artist as safety)
  const byArtist = new Map<string, (typeof leafVotes)[0]>();
  for (const v of leafVotes) {
    const existing = byArtist.get(v.artist_id);
    if (!existing || new Date(v.created_at) > new Date(existing.created_at)) {
      byArtist.set(v.artist_id, v);
    }
  }

  const effectiveVotes = Array.from(byArtist.values());

  const artistIds = effectiveVotes.map((v) => v.artist_id);
  const { data: artists } = await supabase
    .from("artists")
    .select("id, name")
    .in("id", artistIds);

  const nameMap = new Map((artists || []).map((a) => [a.id, a.name]));

  return effectiveVotes.map((v) => ({
    id: v.id,
    artist_id: v.artist_id,
    artist_name: nameMap.get(v.artist_id) ?? "Unknown",
    score: v.score,
    created_at: v.created_at,
  }));
}

export function computeAverageScore(votes: EffectiveVote[]): number {
  if (votes.length === 0) return 0;
  const sum = votes.reduce((acc, v) => acc + v.score, 0);
  return Math.round((sum / votes.length) * 100) / 100;
}
