-- ============================================================
-- 0005_hot_ranking_v2.sql — Hot Ranking: Linear-Logarithmic Hybrid
--
-- Formula:
--   Score = (4.0 × ln(1 + V)) + (T_a − T_0) / 10800 + (T_v − T_a) / 864000
--
-- The score blends three signals so the "Top Rated" feed is neither a
-- pure "Best of All Time" list nor a pure "Newest" feed — it's the
-- sweet spot in between.
--
-- 1. Quality Anchor  — 4.0 × ln(1 + V)
--    V = sum of effective vote scores (each 0–100).
--    ln() dampens runaway totals: the jump from 0→100 in total score
--    is far more impactful than 1000→1100. The 4.0 multiplier ("gravity
--    knob") makes vote quality weigh heavily against time; a well-voted
--    piece won't slide off the top too quickly.
--
-- 2. Freshness Conveyor  — (T_a − T_0) / 43200
--    T_a = artwork created_at (epoch seconds).
--    T_0 = 1775260800 (2026-04-04T00:00:00Z), the arena base epoch.
--    10800 = 3 hours in seconds.
--    Every 3 hours a new artwork starts with +1.0 inherent advantage
--    over one from 3 hours ago. This creates a downward slope: old
--    pieces must keep earning votes to hold position, while new pieces
--    get a window of visibility just by being submitted.
--
-- 3. Activity Bump  — (T_v − T_a) / 864000
--    T_v = most recent effective vote timestamp (defaults to T_a when
--    no votes exist, so the term starts at 0).
--    864000 = 10 days in seconds.
--    A subtle tie-breaker: between two artworks with equal votes and
--    age, the one still attracting votes right now ranks higher. The
--    large divisor keeps this nudge small — a single new vote won't
--    catapult an old piece back to the top.
-- ============================================================


-- 0. Shared formula — pure math, no queries.
--    Both compute_hot_score and list_artworks_sorted call this with
--    pre-aggregated values so the formula is defined exactly once.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION _hot_score(
  vote_score_sum   numeric,   -- SUM of effective vote scores (0 when no votes)
  artwork_epoch    float8,    -- EXTRACT(EPOCH FROM artwork.created_at)
  latest_vote_epoch float8    -- MAX vote epoch, or artwork_epoch when no votes
)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT (
    -- Quality Anchor: logarithmic dampening of total vote score.
    -- +1 so an artwork with 0 votes yields ln(1) = 0, not an error.
    (4.0 * LN(1 + vote_score_sum))

    -- Freshness Conveyor: seconds since base epoch ÷ 3 hours.
    -- Newer artworks get a higher baseline; +1.0 per 3 h.
    + (artwork_epoch - 1775260800) / 10800.0

    -- Activity Bump: seconds between latest vote and creation ÷ 10 days.
    -- Starts at 0 when no votes; grows as new votes arrive.
    + (latest_vote_epoch - artwork_epoch) / 864000.0
  )::numeric;
$$;


-- 1. compute_hot_score — single-artwork lookup (used by get_artwork)
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION compute_hot_score(p_artwork_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
AS $$
  -- Resolve the vote chain: only leaf votes (no child successor) count.
  WITH effective_votes AS (
    SELECT v.score, v.created_at
    FROM votes v
    WHERE v.artwork_id = p_artwork_id
      AND NOT EXISTS (
        SELECT 1 FROM votes child WHERE child.predecessor_id = v.id
      )
  )
  SELECT _hot_score(
    COALESCE(SUM(ev.score), 0),
    EXTRACT(EPOCH FROM a.created_at),
    COALESCE(
      MAX(EXTRACT(EPOCH FROM ev.created_at)),
      EXTRACT(EPOCH FROM a.created_at)
    )
  )
  FROM artworks a
  LEFT JOIN effective_votes ev ON true
  WHERE a.id = p_artwork_id
  GROUP BY a.id, a.created_at;
$$;


-- 2. list_artworks_sorted — paginated leaderboard with four sort modes.
--    Resolves effective votes in bulk, then calls _hot_score per row
--    with already-aggregated scalars (no N+1 queries).
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION list_artworks_sorted(
  sort_mode   text DEFAULT 'newest',
  page_limit  int  DEFAULT 20,
  page_offset int  DEFAULT 0
)
RETURNS TABLE(
  id            uuid,
  name          text,
  pitch         text,
  created_at    timestamptz,
  hot_score     numeric,
  total_votes   bigint,
  total_battles bigint,
  total_count   bigint
)
LANGUAGE sql
STABLE
AS $$
  -- Resolve effective (leaf) votes across all artworks in one pass.
  -- DISTINCT ON keeps only the latest revision per (artwork, artist).
  WITH effective_votes AS (
    SELECT DISTINCT ON (v.artwork_id, v.artist_id)
      v.artwork_id, v.score, v.created_at
    FROM votes v
    WHERE NOT EXISTS (
      SELECT 1 FROM votes child WHERE child.predecessor_id = v.id
    )
    ORDER BY v.artwork_id, v.artist_id, v.created_at DESC
  ),
  artwork_stats AS (
    SELECT
      a.id, a.name, a.pitch, a.created_at,

      _hot_score(
        COALESCE(SUM(ev.score), 0),
        EXTRACT(EPOCH FROM a.created_at),
        COALESCE(
          MAX(EXTRACT(EPOCH FROM ev.created_at)),
          EXTRACT(EPOCH FROM a.created_at)
        )
      ) AS hot_score,

      COUNT(ev.score) AS total_votes,

      (SELECT COUNT(*) FROM battle_messages bm
        WHERE bm.artwork_id = a.id) AS total_battles

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
