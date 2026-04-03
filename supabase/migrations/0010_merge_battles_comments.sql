-- ============================================================
-- Migration 0010: Merge battle rooms and comments
--
-- Replaces four tables (comments, battles, battle_participants,
-- battle_messages) with a single battle_messages table keyed
-- directly by artwork_id. Each artwork has one implicit battle
-- thread. Messages can optionally @-mention an artist; if NULL,
-- the message is addressed to the artwork creator by default.
-- ============================================================

-- 1. Drop old tables in FK-safe order
-- ------------------------------------------------------------
DROP TABLE IF EXISTS battle_messages;
DROP TABLE IF EXISTS battle_participants;
DROP TABLE IF EXISTS battles;
DROP TABLE IF EXISTS comments;

-- 2. Create unified battle_messages table
-- ------------------------------------------------------------
CREATE TABLE battle_messages (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id        uuid        NOT NULL REFERENCES artworks(id),
  artist_id         uuid        NOT NULL REFERENCES artists(id),
  content           text        NOT NULL,
  mention_artist_id uuid        REFERENCES artists(id),
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_battle_messages_artwork_id
  ON battle_messages (artwork_id, created_at ASC);

CREATE INDEX idx_battle_messages_artist_id
  ON battle_messages (artist_id);

CREATE INDEX idx_battle_messages_mention
  ON battle_messages (mention_artist_id)
  WHERE mention_artist_id IS NOT NULL;

-- 3. Update gallery_realtime_signals for battle_messages
-- ------------------------------------------------------------

-- Add 'battle' to allowed kinds
ALTER TABLE public.gallery_realtime_signals
  DROP CONSTRAINT IF EXISTS gallery_realtime_signals_kind_check;

ALTER TABLE public.gallery_realtime_signals
  ADD CONSTRAINT gallery_realtime_signals_kind_check
  CHECK (kind IN ('artist', 'artwork', 'comment', 'battle'));

-- Drop old comments trigger
-- DROP TRIGGER IF EXISTS trg_comments_gallery_realtime_signal
--   ON public.comments;

-- Rebuild the trigger function to handle battle_messages
CREATE OR REPLACE FUNCTION public.notify_gallery_realtime_signal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF tg_table_name = 'artists' THEN
    INSERT INTO public.gallery_realtime_signals (kind, ref_id)
    VALUES ('artist', new.id);
  ELSIF tg_table_name = 'artworks' THEN
    INSERT INTO public.gallery_realtime_signals (kind, ref_id)
    VALUES ('artwork', new.id);
  ELSIF tg_table_name = 'battle_messages' THEN
    INSERT INTO public.gallery_realtime_signals (kind, ref_id)
    VALUES ('battle', new.id);
  END IF;
  RETURN new;
END;
$$;

CREATE TRIGGER trg_battle_messages_gallery_realtime_signal
  AFTER INSERT ON public.battle_messages
  FOR EACH ROW
  EXECUTE PROCEDURE public.notify_gallery_realtime_signal();

-- 4. Rebuild list_artworks_sorted — total_battles now counts
--    directly from battle_messages by artwork_id
-- ------------------------------------------------------------
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
