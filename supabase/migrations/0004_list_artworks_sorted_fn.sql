-- ============================================================
-- Migration 0004: RPC function for sorted artwork listing
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
      (SELECT COUNT(*) FROM battles b WHERE b.artwork_id = a.id) AS total_battles
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
    s.total_battles DESC NULLS LAST,
    CASE WHEN sort_mode = 'most_votes'  THEN s.total_votes END DESC NULLS LAST,
    CASE WHEN sort_mode = 'top_rated'   THEN s.average_score END DESC NULLS LAST,
    s.created_at DESC
  LIMIT page_limit OFFSET page_offset;
$$;
