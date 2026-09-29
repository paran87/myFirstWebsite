-- Raise the videos bucket cap to 2 GiB so large body-camera uploads
-- are not rejected at the bucket level. The project-wide Storage
-- "Global file size limit" in the Supabase Dashboard must also be
-- at least 2 GB (Free plan is hard-capped at 50 MB).

update storage.buckets
set file_size_limit = 2147483648
where id = 'videos';
