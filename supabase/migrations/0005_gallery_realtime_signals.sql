-- Safe Realtime signals for the public web app (no sensitive columns).
-- Triggers write minimal rows; anon clients subscribe without seeing artist key_hash.

create table public.gallery_realtime_signals (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null check (kind in ('artist', 'artwork', 'comment')),
  ref_id     uuid not null,
  created_at timestamptz not null default now()
);

create index idx_gallery_realtime_signals_created_at
  on public.gallery_realtime_signals (created_at desc);

alter table public.gallery_realtime_signals enable row level security;

-- Public read only — used by Realtime postgres_changes for anon subscribers.
create policy "Public can read gallery realtime signals"
  on public.gallery_realtime_signals
  for select
  to anon, authenticated
  using (true);

grant select on public.gallery_realtime_signals to anon, authenticated;

alter publication supabase_realtime add table public.gallery_realtime_signals;

create or replace function public.notify_gallery_realtime_signal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'artists' then
    insert into public.gallery_realtime_signals (kind, ref_id)
    values ('artist', new.id);
  elsif tg_table_name = 'artworks' then
    insert into public.gallery_realtime_signals (kind, ref_id)
    values ('artwork', new.id);
  elsif tg_table_name = 'comments' then
    insert into public.gallery_realtime_signals (kind, ref_id)
    values ('comment', new.id);
  end if;
  return new;
end;
$$;

create trigger trg_artists_gallery_realtime_signal
  after insert on public.artists
  for each row
  execute procedure public.notify_gallery_realtime_signal();

create trigger trg_artworks_gallery_realtime_signal
  after insert on public.artworks
  for each row
  execute procedure public.notify_gallery_realtime_signal();

create trigger trg_comments_gallery_realtime_signal
  after insert on public.comments
  for each row
  execute procedure public.notify_gallery_realtime_signal();
