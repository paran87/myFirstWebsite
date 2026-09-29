-- =====================================================================
-- Street documentation photos (still images), parallel to videos.
-- =====================================================================

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),

  title text not null,
  description text,

  image_url text not null,
  storage_path text,

  location text,
  street text,
  barangay text,
  city text,
  province text default 'Metro Manila',
  region text default 'NCR',

  latitude numeric(10, 7),
  longitude numeric(10, 7),

  recorded_at timestamptz,
  uploaded_at timestamptz not null default now(),
  file_size_bytes bigint,

  category_id uuid references public.categories (id) on delete set null,
  tags text[] not null default '{}',

  views bigint not null default 0,
  status video_status not null default 'draft',

  created_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz,

  search_vector tsvector,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint chk_photos_latitude check (latitude is null or (latitude between -90 and 90)),
  constraint chk_photos_longitude check (longitude is null or (longitude between -180 and 180))
);

create index if not exists idx_photos_status on public.photos (status);
create index if not exists idx_photos_city on public.photos (city);
create index if not exists idx_photos_deleted_at on public.photos (deleted_at);
create index if not exists idx_photos_recorded_at on public.photos (recorded_at desc);

create or replace function public.photos_search_vector_text(p public.photos)
returns text language sql immutable as $$
  select trim(
    coalesce(p.title, '') || ' ' ||
    coalesce(p.description, '') || ' ' ||
    coalesce(p.location, '') || ' ' ||
    coalesce(p.street, '') || ' ' ||
    coalesce(p.barangay, '') || ' ' ||
    coalesce(p.city, '') || ' ' ||
    coalesce(array_to_string(p.tags, ' '), '')
  );
$$;

create or replace function public.photos_set_search_vector()
returns trigger language plpgsql as $$
begin
  new.search_vector := to_tsvector('english', public.photos_search_vector_text(new));
  return new;
end;
$$;

drop trigger if exists trg_photos_search_vector on public.photos;
create trigger trg_photos_search_vector
  before insert or update on public.photos
  for each row execute procedure public.photos_set_search_vector();

create index if not exists idx_photos_search_vector on public.photos using gin (search_vector);

drop trigger if exists trg_photos_updated_at on public.photos;
create trigger trg_photos_updated_at
  before update on public.photos
  for each row execute procedure public.set_updated_at();

alter table public.photos enable row level security;

drop policy if exists "photos_public_read_published" on public.photos;
create policy "photos_public_read_published" on public.photos
  for select using (status = 'published' and deleted_at is null);

drop policy if exists "photos_admin_all" on public.photos;
create policy "photos_admin_all" on public.photos
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'editor'))
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'editor'))
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'photos',
  'photos',
  true,
  20971520,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public_read_photos" on storage.objects;
create policy "public_read_photos" on storage.objects
  for select using (bucket_id = 'photos');
