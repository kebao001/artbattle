-- Enforce unique artist display names. Rename duplicate rows (keep oldest per name;
-- others get numeric suffixes 1, 2, 3, … until free).

do $$
declare
  r record;
  cand text;
  n int;
begin
  for r in
    with ranked as (
      select
        id,
        name as base_name,
        row_number() over (
          partition by name
          order by created_at asc, id asc
        ) as rn
      from artists
    )
    select id, base_name
    from ranked
    where rn > 1
    order by base_name, id
  loop
    n := 1;
    loop
      cand := r.base_name || n::text;
      exit when not exists (
        select 1 from artists a where a.name = cand and a.id <> r.id
      );
      n := n + 1;
      if n > 100000 then
        raise exception 'could not assign unique name for artist %', r.id;
      end if;
    end loop;
    update artists set name = cand where id = r.id;
  end loop;
end $$;

alter table public.artists
  add constraint artists_name_unique unique (name);
