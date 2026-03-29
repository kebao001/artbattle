-- ============================================================
-- Migration 0002: Vote system overhaul + Battle feature
-- ============================================================

-- 1. Votes table overhaul: up/down → 0-100 score with predecessor chain
-- ------------------------------------------------------------

-- Drop old unique constraint and check constraint
alter table votes drop constraint if exists votes_artwork_id_artist_id_key;
alter table votes drop constraint if exists votes_type_check;

-- Replace type column with score
alter table votes drop column type;
alter table votes add column score integer not null default 50
  check (score >= 0 and score <= 100);

-- Add predecessor_id for vote chain (nullable, self-referencing)
alter table votes add column predecessor_id uuid references votes(id);

-- New unique constraint: one initial vote per artist/artwork,
-- and each predecessor can only be overridden once.
-- NULLs are distinct in PG unique constraints.
alter table votes add constraint votes_artwork_artist_predecessor_key
  unique (artwork_id, artist_id, predecessor_id);

-- Index for finding effective votes efficiently
create index idx_votes_effective
  on votes (artwork_id, artist_id, created_at desc);

-- Index for the NOT EXISTS child lookup
create index idx_votes_predecessor_id
  on votes (predecessor_id) where predecessor_id is not null;

-- Remove the default we used for the migration
alter table votes alter column score drop default;

-- 2. Artists table: add last_active_at
-- ------------------------------------------------------------

alter table artists add column last_active_at timestamptz;

-- 3. Battle rooms
-- ------------------------------------------------------------

create table battles (
  id              uuid        primary key default gen_random_uuid(),
  artwork_id      uuid        not null references artworks(id),
  creator_id      uuid        not null references artists(id),
  initial_message text        not null,
  created_at      timestamptz not null default now()
);

create index idx_battles_artwork_id  on battles (artwork_id);
create index idx_battles_creator_id  on battles (creator_id);

-- 4. Battle participants (invited reviewers)
-- ------------------------------------------------------------

create table battle_participants (
  id         uuid        primary key default gen_random_uuid(),
  battle_id  uuid        not null references battles(id),
  artist_id  uuid        not null references artists(id),
  created_at timestamptz not null default now(),
  unique (battle_id, artist_id)
);

create index idx_battle_participants_artist_id
  on battle_participants (artist_id);

-- 5. Battle messages
-- ------------------------------------------------------------

create table battle_messages (
  id         uuid        primary key default gen_random_uuid(),
  battle_id  uuid        not null references battles(id),
  artist_id  uuid        not null references artists(id),
  content    text        not null,
  created_at timestamptz not null default now()
);

create index idx_battle_messages_battle_id
  on battle_messages (battle_id, created_at asc);
