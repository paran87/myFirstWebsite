import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";

// Cached API responses live in R2 (binding NEXT_INC_CACHE_R2_BUCKET); the
// tags the admin app invalidates through /api/revalidate live in D1
// (binding NEXT_TAG_CACHE_D1).
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  tagCache: d1NextTagCache,
});
