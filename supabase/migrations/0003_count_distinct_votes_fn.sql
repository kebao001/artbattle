-- RPC function for counting distinct (artwork_id, artist_id) vote pairs.
-- Supabase JS client can't express COUNT(DISTINCT ...) directly.

create or replace function count_distinct_votes()
returns bigint
language sql
stable
as $$
  select count(*)
  from (select distinct artwork_id, artist_id from votes) as pairs;
$$;
