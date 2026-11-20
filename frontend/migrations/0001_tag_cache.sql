-- Tag revalidation table used by OpenNext's D1 tag cache (NEXT_TAG_CACHE_D1).
CREATE TABLE IF NOT EXISTS revalidations (
  tag           TEXT    NOT NULL,
  revalidatedAt INTEGER NOT NULL,
  stale         INTEGER,
  expire        INTEGER
);
CREATE INDEX IF NOT EXISTS idx_revalidations_tag ON revalidations (tag);
