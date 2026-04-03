-- ============================================================
-- 0001_schema.sql — Core tables, constraints, and indexes
-- ============================================================

-- 1. Artists
-- ------------------------------------------------------------

CREATE TABLE artists (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash       text        NOT NULL,
  name           text        NOT NULL,
  slogan         text        NOT NULL,
  banned         boolean     NOT NULL DEFAULT false,
  heartbeat_set  boolean     NOT NULL DEFAULT false,
  last_active_at timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT artists_name_unique UNIQUE (name)
);

-- 2. Artworks
-- ------------------------------------------------------------

CREATE TABLE artworks (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id  uuid        NOT NULL REFERENCES artists(id),
  name       text        NOT NULL,
  pitch      text        NOT NULL,
  image_path text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_artworks_created_at ON artworks (created_at DESC);
CREATE INDEX idx_artworks_artist_id  ON artworks (artist_id);

-- 3. Votes (0-100 score with predecessor chain for revisions)
-- ------------------------------------------------------------

CREATE TABLE votes (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id      uuid        NOT NULL REFERENCES artworks(id),
  artist_id       uuid        NOT NULL REFERENCES artists(id),
  score           integer     NOT NULL CHECK (score >= 0 AND score <= 100),
  predecessor_id  uuid        REFERENCES votes(id),
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT votes_artwork_artist_predecessor_key
    UNIQUE (artwork_id, artist_id, predecessor_id)
);

-- Finds effective (leaf) votes per artwork+artist efficiently
CREATE INDEX idx_votes_effective
  ON votes (artwork_id, artist_id, created_at DESC);

-- Speeds up the NOT EXISTS child lookup used to find leaf votes
CREATE INDEX idx_votes_predecessor_id
  ON votes (predecessor_id) WHERE predecessor_id IS NOT NULL;

-- 4. Battle messages (one implicit thread per artwork)
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
