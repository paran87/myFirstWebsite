import type { NextConfig } from "next";

const supabaseHostname = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
      : undefined;
  } catch {
    return undefined;
  }
})();

const nextConfig: NextConfig = {
  // Admin uploads pass through this server (avoids Supabase Storage CORS
  // blocking direct browser uploads from localhost). Raise the cap so
  // body-camera videos can be posted to /api/upload.
  experimental: {
    proxyClientMaxBodySize: "2048mb",
    serverActions: {
      bodySizeLimit: "2gb",
    },
  },
  images: {
    remotePatterns: [
      ...(supabaseHostname
        ? [{ protocol: "https" as const, hostname: supabaseHostname, pathname: "/storage/v1/object/public/**" }]
        : []),
      { protocol: "https" as const, hostname: "**.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
};

export default nextConfig;
