import type { NextConfig } from "next";

function hostnameOf(url: string | undefined) {
  try {
    return url ? new URL(url).hostname : undefined;
  } catch {
    return undefined;
  }
}

const supabaseHostname = hostnameOf(process.env.NEXT_PUBLIC_SUPABASE_URL);
// Large uploads that fall back to the backend's own storage are served from
// `<backend>/api/files/...`, so that host must be allowed too.
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
      ...(supabaseHostname
        ? [{ protocol: "https" as const, hostname: supabaseHostname, pathname: "/storage/v1/object/public/**" }]
        : []),
      { protocol: "https" as const, hostname: "**.supabase.co", pathname: "/storage/v1/object/public/**" },
      ...(backendHostname && backendHostname !== "localhost"
        ? [{ protocol: "https" as const, hostname: backendHostname, pathname: "/api/files/**" }]
        : []),
      { protocol: "https" as const, hostname: "images.unsplash.com" },
    ],
    // WebP only: near-AVIF savings, much faster to encode, half the variants.
    formats: ["image/webp"],
    // A small, fixed set of widths/qualities keeps the number of distinct
    // optimized variants (and the Vercel image quota) low.
    deviceSizes: [640, 828, 1080, 1280, 1920],
    imageSizes: [128, 256, 384],
    qualities: [60, 75, 85],
    // Uploads live at random UUID paths and are never overwritten, so an
    // optimized copy can be cached for a long time.
    minimumCacheTTL: 60 * 60 * 24 * 31,
  },
};

export default nextConfig;
