-- Run this ONLY if 0001_init.sql failed at the search_vector GENERATED column
-- (ERROR: 42P17: generation expression is not immutable).
-- Safe to re-run.

alter table public.videos
  add column if not exists search_vector tsvector;

create or replace function public.videos_search_vector_text(v public.videos)
returns text
language sql
immutable
parallel safe
as $$
  select
    coalesce(v.title, '') || ' ' ||
    coalesce(v.description, '') || ' ' ||
    coalesce(v.location, '') || ' ' ||
    coalesce(v.street, '') || ' ' ||
    coalesce(v.barangay, '') || ' ' ||
    coalesce(v.city, '') || ' ' ||
    coalesce(array_to_string(v.tags, ' '), '');
$$;

create or replace function public.videos_set_search_vector()
returns trigger
language plpgsql
as $$
begin
  new.search_vector := to_tsvector('english', public.videos_search_vector_text(new));
  return new;
end;
$$;

drop trigger if exists trg_videos_search_vector on public.videos;
create trigger trg_videos_search_vector
  before insert or update of title, description, location, street, barangay, city, tags
  on public.videos
  for each row execute procedure public.videos_set_search_vector();

update public.videos v
set search_vector = to_tsvector('english', public.videos_search_vector_text(v))
where search_vector is null;

create index if not exists idx_videos_search_vector on public.videos using gin (search_vector);
