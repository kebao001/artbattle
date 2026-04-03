-- ============================================================
-- Migration 0009: Hot ranking algorithm
--
-- Replaces simple average_score sorting with a Reddit-inspired
-- hot ranking formula:
--
--   hot_score = log10(1 + S) + (t_freshness - t_epoch) / T
--
-- S           = SUM of effective vote scores
-- t_freshness = weighted avg of artwork created_at + vote timestamps
-- t_epoch     = 2026-04-01 00:00:00 UTC  (1743465600 epoch seconds)
-- T           = 259200  (3 days in seconds)
-- ============================================================

-- Single-artwork hot score (reused by list_artworks_sorted and
-- callable directly via RPC for individual artwork lookups).
CREATE OR REPLACE FUNCTION compute_hot_score(p_artwork_id uuid)
RETURNS numeric
LANGUAGE sql STABLE AS $$
  WITH effective_votes AS (
    SELECT v.score, v.created_at
    FROM votes v
    WHERE v.artwork_id = p_artwork_id
      AND NOT EXISTS (
        SELECT 1 FROM votes child WHERE child.predecessor_id = v.id
      )
  )
  SELECT (
    LOG(1 + COALESCE(SUM(ev.score), 0))
    + (
        (EXTRACT(EPOCH FROM a.created_at) + COALESCE(SUM(EXTRACT(EPOCH FROM ev.created_at)), 0))
        / (1 + COUNT(ev.score))
        - 1743465600
      ) / 259200.0
  )::numeric
  FROM artworks a
  LEFT JOIN effective_votes ev ON true
  WHERE a.id = p_artwork_id
  GROUP BY a.id, a.created_at;
$$;

-- Rebuild list_artworks_sorted with hot_score column.
DROP FUNCTION IF EXISTS list_artworks_sorted(text, int, int);

CREATE FUNCTION list_artworks_sorted(
  sort_mode text DEFAULT 'newest',
  page_limit int DEFAULT 20,
  page_offset int DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  name text,
  pitch text,
  created_at timestamptz,
  hot_score numeric,
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
      compute_hot_score(a.id) AS hot_score,
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
    s.hot_score, s.total_votes, s.total_battles,
    COUNT(*) OVER() AS total_count
  FROM artwork_stats s
  ORDER BY
    CASE sort_mode
      WHEN 'most_votes'   THEN s.total_votes::numeric
      WHEN 'top_rated'    THEN s.hot_score
      WHEN 'most_battles' THEN s.total_battles::numeric
      ELSE                     EXTRACT(EPOCH FROM s.created_at)
    END DESC NULLS LAST,
    s.created_at DESC
  LIMIT page_limit OFFSET page_offset;
$$;
