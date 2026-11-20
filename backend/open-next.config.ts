import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// The admin app is fully dynamic (every page and API route reads the
// request), so it needs no incremental cache.
export default defineCloudflareConfig();
