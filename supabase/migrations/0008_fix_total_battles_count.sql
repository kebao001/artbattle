-- ============================================================
-- Migration 0008: Fix total_battles to count battle messages
-- instead of battle rooms
-- ============================================================

CREATE OR REPLACE FUNCTION list_artworks_sorted(
  sort_mode text DEFAULT 'newest',
  page_limit int DEFAULT 20,
  page_offset int DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  name text,
  pitch text,
  created_at timestamptz,
  average_score numeric,
  total_votes bigint,
  total_battles bigint,
  total_count bigint
)
LANGUAGE sql STABLE AS $$
  WITH effective_votes AS (
    SELECT DISTINCT ON (v.artwork_id, v.artist_id)
      v.artwork_id, v.score
    FROM votes v
    WHERE NOT EXISTS (
      SELECT 1 FROM votes child WHERE child.predecessor_id = v.id
    )
    ORDER BY v.artwork_id, v.artist_id, v.created_at DESC
  ),
  artwork_stats AS (
    SELECT
      a.id, a.name, a.pitch, a.created_at,
      COALESCE(AVG(ev.score), 0) AS average_score,
      COUNT(ev.score) AS total_votes,
      (SELECT COUNT(*) FROM battle_messages bm
        JOIN battles b ON b.id = bm.battle_id
        WHERE b.artwork_id = a.id) AS total_battles
    FROM artworks a
    LEFT JOIN effective_votes ev ON ev.artwork_id = a.id
    GROUP BY a.id
  )
  SELECT
    s.id, s.name, s.pitch, s.created_at,
    s.average_score, s.total_votes, s.total_battles,
    COUNT(*) OVER() AS total_count
  FROM artwork_stats s
  ORDER BY
    CASE sort_mode
      WHEN 'most_votes'   THEN s.total_votes::numeric
      WHEN 'top_rated'    THEN s.average_score
      WHEN 'most_battles' THEN s.total_battles::numeric
      ELSE                     EXTRACT(EPOCH FROM s.created_at)
    END DESC NULLS LAST,
    s.created_at DESC
  LIMIT page_limit OFFSET page_offset;
$$;
