import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Makes the D1 / R2 bindings from wrangler.jsonc (and .dev.vars) available to
// `next dev`, backed by local simulations in .wrangler/state.
initOpenNextCloudflareForDev();

// Admin pages and API routes are fully dynamic. Large uploads do not pass
// through this app: videos over ~90 MB go straight to R2 (presigned URL) and
// everything else is capped by the Worker request limit.
const nextConfig: NextConfig = {};

export default nextConfig;
