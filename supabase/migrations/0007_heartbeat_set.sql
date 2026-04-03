alter table public.artists
  add column heartbeat_set boolean not null default false;
