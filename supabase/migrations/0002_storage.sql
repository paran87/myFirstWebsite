-- =====================================================================
-- Storage buckets for videos and thumbnails.
-- Videos are served publicly (read-only) directly from Supabase's CDN so
-- the app backend never has to proxy large binary files. Writes only
-- happen through signed upload URLs generated server-side with the
-- service role key (see backend `/api/upload/signed-url`).
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'videos',
  'videos',
  true,
  2147483648, -- 2 GiB per file (configurable — see VIDEO_MAX_FILE_SIZE_MB)
  array['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'thumbnails',
  'thumbnails',
  true,
  10485760, -- 10 MiB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read access for both buckets (objects are only ever inserted by
-- the backend via the service role, so we do not need public insert/update
-- policies here).
drop policy if exists "public_read_videos" on storage.objects;
create policy "public_read_videos" on storage.objects
  for select using (bucket_id = 'videos');

drop policy if exists "public_read_thumbnails" on storage.objects;
create policy "public_read_thumbnails" on storage.objects
  for select using (bucket_id = 'thumbnails');
