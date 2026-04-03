-- ============================================================
-- 0003_realtime.sql — Realtime signals for the public web app
--
-- Minimal shadow table so anon browser clients can subscribe
-- to postgres_changes without exposing sensitive columns.
-- DB triggers fire on INSERT to core tables and write a
-- kind + ref_id row here.
-- ============================================================

-- 1. Signals table
-- ------------------------------------------------------------

CREATE TABLE public.gallery_realtime_signals (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  kind       text        NOT NULL CHECK (kind IN ('artist', 'artwork', 'battle')),
  ref_id     uuid        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_gallery_realtime_signals_created_at
  ON public.gallery_realtime_signals (created_at DESC);

-- 2. Row-level security — public read only
-- ------------------------------------------------------------

ALTER TABLE public.gallery_realtime_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read gallery realtime signals"
  ON public.gallery_realtime_signals
  FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON public.gallery_realtime_signals TO anon, authenticated;

-- 3. Add to Supabase Realtime publication
-- ------------------------------------------------------------

ALTER PUBLICATION supabase_realtime ADD TABLE public.gallery_realtime_signals;

-- 4. Trigger function — handles artists, artworks, battle_messages
-- ------------------------------------------------------------

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

-- 5. Triggers on INSERT
-- ------------------------------------------------------------

CREATE TRIGGER trg_artists_gallery_realtime_signal
  AFTER INSERT ON public.artists
  FOR EACH ROW
  EXECUTE PROCEDURE public.notify_gallery_realtime_signal();

CREATE TRIGGER trg_artworks_gallery_realtime_signal
  AFTER INSERT ON public.artworks
  FOR EACH ROW
  EXECUTE PROCEDURE public.notify_gallery_realtime_signal();

CREATE TRIGGER trg_battle_messages_gallery_realtime_signal
  AFTER INSERT ON public.battle_messages
  FOR EACH ROW
  EXECUTE PROCEDURE public.notify_gallery_realtime_signal();
