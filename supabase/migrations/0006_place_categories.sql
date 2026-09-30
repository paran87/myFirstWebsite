-- =====================================================================
-- Place-based categories
-- ---------------------------------------------------------------------
-- The original categories described conditions (flooding, traffic,
-- drainage...). The site documents places, so categories now describe
-- the kind of place a video/photo shows. Existing items are moved to the
-- closest new category before the old ones are removed. Safe to re-run.
-- =====================================================================

insert into public.categories (name, slug, description) values
  ('Streets & Roads', 'streets-roads', 'Streets, avenues, highways and alleys.'),
  ('Landmarks & Monuments', 'landmarks-monuments', 'Well-known landmarks, monuments and statues.'),
  ('Bridges & Flyovers', 'bridges-flyovers', 'Bridges, flyovers, footbridges and underpasses.'),
  ('Rivers & Waterways', 'rivers-waterways', 'Rivers, esteros, canals and creeks.'),
  ('Markets & Commercial Areas', 'markets-commercial', 'Public markets, shopping streets and malls.'),
  ('Churches & Heritage Sites', 'churches-heritage', 'Churches, shrines and historic or heritage sites.'),
  ('Parks & Plazas', 'parks-plazas', 'Parks, plazas, baywalks and open public spaces.'),
  ('Transport Hubs', 'transport-hubs', 'LRT/MRT stations, bus and jeepney terminals, ports.'),
  ('Government & Public Buildings', 'government-public-buildings', 'City halls, barangay halls, hospitals and other public buildings.'),
  ('Schools & Campuses', 'schools-campuses', 'Schools, universities and their surroundings.'),
  ('Residential Areas', 'residential-areas', 'Neighborhoods, barangays and subdivisions.'),
  ('Other', 'other', 'Anything that does not fit the categories above.')
on conflict (name) do update set slug = excluded.slug, description = excluded.description, is_active = true;

-- Move items from the old condition-based categories to the closest place.
with remap(old_slug, new_slug) as (
  values
    ('street-documentation', 'streets-roads'),
    ('road-condition', 'streets-roads'),
    ('traffic', 'streets-roads'),
    ('flood-prone-area', 'streets-roads'),
    ('urban-area', 'streets-roads'),
    ('drainage', 'rivers-waterways'),
    ('infrastructure', 'bridges-flyovers')
),
ids as (
  select o.id as old_id, n.id as new_id
  from remap r
  join public.categories o on o.slug = r.old_slug
  join public.categories n on n.slug = r.new_slug
)
update public.videos v set category_id = ids.new_id from ids where v.category_id = ids.old_id;

with remap(old_slug, new_slug) as (
  values
    ('street-documentation', 'streets-roads'),
    ('road-condition', 'streets-roads'),
    ('traffic', 'streets-roads'),
    ('flood-prone-area', 'streets-roads'),
    ('urban-area', 'streets-roads'),
    ('drainage', 'rivers-waterways'),
    ('infrastructure', 'bridges-flyovers')
),
ids as (
  select o.id as old_id, n.id as new_id
  from remap r
  join public.categories o on o.slug = r.old_slug
  join public.categories n on n.slug = r.new_slug
)
update public.photos p set category_id = ids.new_id from ids where p.category_id = ids.old_id;

delete from public.categories
where slug in (
  'street-documentation', 'road-condition', 'traffic', 'flood-prone-area',
  'urban-area', 'drainage', 'infrastructure'
);
