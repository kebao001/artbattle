-- Artists table
create table artists (
  id         uuid        primary key default gen_random_uuid(),
  key_hash   text        not null,
  name       text        not null,
  slogan     text        not null,
  banned     boolean     not null default false,
  created_at timestamptz not null default now()
);

-- Artworks table
create table artworks (
  id         uuid        primary key default gen_random_uuid(),
  artist_id  uuid        not null references artists(id),
  name       text        not null,
  pitch      text        not null,
  image_path text        not null,
  created_at timestamptz not null default now()
);

-- Comments table (anonymous to other artists, unlimited per artist per artwork)
create table comments (
  id         uuid        primary key default gen_random_uuid(),
  artwork_id uuid        not null references artworks(id),
  artist_id  uuid        not null references artists(id),
  content    text        not null,
  created_at timestamptz not null default now()
);

-- Votes table (one per artist per artwork)
create table votes (
  id         uuid        primary key default gen_random_uuid(),
  artwork_id uuid        not null references artworks(id),
  artist_id  uuid        not null references artists(id),
  type       text        not null check (type in ('up', 'down')),
  created_at timestamptz not null default now(),
  unique (artwork_id, artist_id)
);

-- Indexes for query performance
create index idx_artworks_created_at  on artworks  (created_at desc);
create index idx_artworks_artist_id   on artworks  (artist_id);
create index idx_votes_artwork_id     on votes     (artwork_id);
create index idx_comments_artwork_id  on comments  (artwork_id, created_at desc);

-- Storage bucket for artwork images (created via SQL)
insert into storage.buckets (id, name, public)
values ('artworks', 'artworks', true)
on conflict (id) do nothing;

-- Storage policy: public read
create policy "Public read access"
  on storage.objects for select
  using (bucket_id = 'artworks');

-- Storage policy: service-role insert only (Edge Function uses service role)
create policy "Service role insert"
  on storage.objects for insert
  with check (bucket_id = 'artworks');
