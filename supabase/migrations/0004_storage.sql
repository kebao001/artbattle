-- ============================================================
-- 0004_storage.sql — Artwork image storage bucket and policies
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('artworks', 'artworks', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'artworks');

CREATE POLICY "Service role insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'artworks');
