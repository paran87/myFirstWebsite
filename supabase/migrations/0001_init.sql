-- =====================================================================
-- Walk Metro Manila — Initial schema
-- Run this in the Supabase SQL editor (or via `supabase db push`)
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- ENUM: video status
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'video_status') then
    create type video_status as enum ('draft', 'published', 'private', 'deleted');
  end if;
end $$;

-- ---------------------------------------------------------------------
-- profiles: one row per authenticated user, links to auth.users
-- role = 'admin' is required to access the admin dashboard / API
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'admin' check (role in ('admin', 'editor')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Admin/editor accounts allowed to manage content. Row must exist for a user to use the admin dashboard.';

-- Auto-create a profile row whenever a new auth user signs up.
-- New accounts default to role='admin' here for simplicity; in production
-- you would create profiles manually / via invite instead of on every signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_categories_slug on public.categories (slug);
create index if not exists idx_categories_is_active on public.categories (is_active);

-- ---------------------------------------------------------------------
-- videos
-- ---------------------------------------------------------------------
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),

  title text not null,
  description text,

  video_url text not null,
  thumbnail_url text,
  storage_path text,           -- path inside the Supabase Storage bucket (for cleanup / signed URLs)
  thumbnail_storage_path text,

  location text,                -- free-text summary, e.g. "EDSA, Quezon City"
  street text,
  barangay text,
  city text,
  province text default 'Metro Manila',
  region text default 'NCR',

  latitude numeric(10, 7),
  longitude numeric(10, 7),

  recorded_at timestamptz,
  uploaded_at timestamptz not null default now(),

  duration_seconds integer,      -- video duration in seconds
  file_size_bytes bigint,

  category_id uuid references public.categories (id) on delete set null,
  tags text[] not null default '{}',

  views bigint not null default 0,
  status video_status not null default 'draft',

  created_by uuid references public.profiles (id) on delete set null,

  deleted_at timestamptz,        -- soft delete marker (recycle bin)

  -- Maintained by trigger (not GENERATED): to_tsvector() is not immutable in PG.
  search_vector tsvector,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint chk_latitude check (latitude is null or (latitude between -90 and 90)),
  constraint chk_longitude check (longitude is null or (longitude between -180 and 180))
);

-- Indexes for frequently filtered / searched columns
create index if not exists idx_videos_status on public.videos (status);
create index if not exists idx_videos_city on public.videos (city);
create index if not exists idx_videos_barangay on public.videos (barangay);
create index if not exists idx_videos_street on public.videos (street);
create index if not exists idx_videos_category_id on public.videos (category_id);
create index if not exists idx_videos_recorded_at on public.videos (recorded_at desc);
create index if not exists idx_videos_deleted_at on public.videos (deleted_at);
create index if not exists idx_videos_title on public.videos using gin (to_tsvector('english', title));
create index if not exists idx_videos_tags on public.videos using gin (tags);

-- Full-text search: trigger keeps search_vector in sync (generated columns cannot use to_tsvector).
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

-- ---------------------------------------------------------------------
-- video_views: append-only log used to de-duplicate view counting.
-- A lightweight "viewer_key" (hashed IP + user agent, or a client-generated
-- id stored in a cookie) prevents the same session from inflating views.
-- ---------------------------------------------------------------------
create table if not exists public.video_views (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos (id) on delete cascade,
  viewer_key text not null,
  viewed_at timestamptz not null default now()
);

create unique index if not exists idx_video_views_unique_per_window
  on public.video_views (video_id, viewer_key);

create index if not exists idx_video_views_video_id on public.video_views (video_id);

-- ---------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_videos_updated_at on public.videos;
create trigger trg_videos_updated_at
  before update on public.videos
  for each row execute procedure public.set_updated_at();

drop trigger if exists trg_categories_updated_at on public.categories;
create trigger trg_categories_updated_at
  before update on public.categories
  for each row execute procedure public.set_updated_at();

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------
-- RPC: increment_video_views — atomic, dedup-aware view counter.
-- Called from the public API with a viewer_key derived from the client.
-- ---------------------------------------------------------------------
create or replace function public.increment_video_views(p_video_id uuid, p_viewer_key text)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  v_new_view boolean := false;
  v_views bigint;
begin
  begin
    insert into public.video_views (video_id, viewer_key) values (p_video_id, p_viewer_key);
    v_new_view := true;
  exception when unique_violation then
    v_new_view := false;
  end;

  if v_new_view then
    update public.videos set views = views + 1 where id = p_video_id and status = 'published'
    returning views into v_views;
  else
    select views into v_views from public.videos where id = p_video_id;
  end if;

  return coalesce(v_views, 0);
end;
$$;

grant execute on function public.increment_video_views(uuid, text) to anon, authenticated;

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.videos enable row level security;
alter table public.video_views enable row level security;

-- profiles: a user can read their own profile only. All writes happen
-- through the trigger / service role, never directly from clients.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

-- categories: anyone can read active categories; only admins can write.
drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read" on public.categories
  for select using (is_active = true);

drop policy if exists "categories_admin_all" on public.categories;
create policy "categories_admin_all" on public.categories
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'editor'))
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'editor'))
  );

-- videos: public can read only published, non-deleted videos.
drop policy if exists "videos_public_read_published" on public.videos;
create policy "videos_public_read_published" on public.videos
  for select using (status = 'published' and deleted_at is null);

-- videos: admins/editors can read & write everything (including deleted).
drop policy if exists "videos_admin_all" on public.videos;
create policy "videos_admin_all" on public.videos
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'editor'))
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'editor'))
  );

-- video_views: no direct client access; only the SECURITY DEFINER RPC
-- above and the service role (used by the backend) may touch this table.
drop policy if exists "video_views_admin_read" on public.video_views;
create policy "video_views_admin_read" on public.video_views
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'editor'))
  );

-- =====================================================================
-- Seed categories (safe to re-run)
-- =====================================================================
insert into public.categories (name, slug, description) values
  ('Street Documentation', 'street-documentation', 'General walkthrough documentation of streets and public areas.'),
  ('Flood-Prone Area', 'flood-prone-area', 'Areas known or observed to be prone to flooding.'),
  ('Infrastructure', 'infrastructure', 'Bridges, public buildings, utilities and other infrastructure.'),
  ('Drainage', 'drainage', 'Drainage systems, canals, and esteros.'),
  ('Road Condition', 'road-condition', 'Pavement quality, potholes, road damage.'),
  ('Traffic', 'traffic', 'Traffic flow, congestion, and management observations.'),
  ('Urban Area', 'urban-area', 'General urban environment documentation.'),
  ('Other', 'other', 'Anything that does not fit the categories above.')
on conflict (name) do nothing;
