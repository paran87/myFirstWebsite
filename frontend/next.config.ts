import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Makes the bindings from wrangler.jsonc (and .dev.vars) available to `next dev`.
initOpenNextCloudflareForDev();

function hostnameOf(url: string | undefined) {
  try {
    return url ? new URL(url).hostname : undefined;
  } catch {
    return undefined;
  }
}

// Media (videos, thumbnails, photos) lives in Cloudflare R2. It is served either
// from the bucket's public custom domain (NEXT_PUBLIC_MEDIA_URL) or, when that
// is not set, from the admin Worker at `<backend>/api/files/...`. Both hosts
// must be allowed for next/image.
const mediaHostname = hostnameOf(process.env.NEXT_PUBLIC_MEDIA_URL);
const backendHostname = hostnameOf(process.env.NEXT_PUBLIC_API_URL);

const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  // Browser-side API calls go through the site's own domain and are proxied
  // to the backend here, so they never depend on the backend's CORS setup.
  async rewrites() {
    return [{ source: "/backend-api/:path*", destination: `${apiUrl}/:path*` }];
  },
  images: {
    remotePatterns: [
      ...(mediaHostname ? [{ protocol: "https" as const, hostname: mediaHostname }] : []),
      ...(backendHostname && backendHostname !== "localhost"
        ? [{ protocol: "https" as const, hostname: backendHostname, pathname: "/api/files/**" }]
        : []),
      { protocol: "https" as const, hostname: "images.unsplash.com" },
    ],
    // WebP only: near-AVIF savings, much faster to encode, half the variants.
    formats: ["image/webp"],
    // A small, fixed set of widths/qualities keeps the number of distinct
    // optimized variants (and the Cloudflare Images transformation quota) low.
    deviceSizes: [640, 828, 1080, 1280, 1920],
    imageSizes: [128, 256, 384],
    qualities: [60, 75, 85],
    // Uploads live at random UUID paths and are never overwritten, so an
    // optimized copy can be cached for a long time.
    minimumCacheTTL: 60 * 60 * 24 * 31,
  },
};

export default nextConfig;
