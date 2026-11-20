-- Place-based categories (what kind of place a video/photo shows).
INSERT INTO categories (name, slug, description) VALUES
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
  ('Other', 'other', 'Anything that does not fit the categories above.');
