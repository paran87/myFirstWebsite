-- =====================================================================
-- 0005 — Video routes (start/end coordinates + the path walked)
--
-- `route` shape (written by the admin video form):
--   {
--     "mode": "walking" | "driving" | "straight",
--     "points": [[lat, lng], ...],   -- start, optional waypoints, end
--     "path":   [[lat, lng], ...],   -- the line drawn on the map
--     "distance_m": 1234             -- optional, length of `path`
--   }
-- `latitude`/`longitude` keep holding the start point so older code and
-- the public list endpoints still have a single location per video.
--
-- Safe to run more than once.
-- =====================================================================

alter table public.videos
  add column if not exists route jsonb;

alter table public.videos
  drop constraint if exists chk_videos_route_shape;

alter table public.videos
  add constraint chk_videos_route_shape
  check (route is null or (jsonb_typeof(route) = 'object' and jsonb_typeof(route -> 'path') = 'array'));

comment on column public.videos.route is
  'Walked route: {mode, points: [[lat,lng]...], path: [[lat,lng]...], distance_m}. Null when not set.';

-- Ask PostgREST (the Supabase API) to pick up the new column immediately.
notify pgrst, 'reload schema';
