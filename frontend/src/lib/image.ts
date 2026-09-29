import { getImageProps } from "next/image";

function hostnameOf(url: string | undefined) {
  try {
    return url ? new URL(url).hostname : undefined;
  } catch {
    return undefined;
  }
}

const supabaseHostname = hostnameOf(process.env.NEXT_PUBLIC_SUPABASE_URL);
const backendHostname = hostnameOf(process.env.NEXT_PUBLIC_API_URL);

/**
 * Whether `src` may go through the Next.js image optimizer. Must mirror
 * `images.remotePatterns` in next.config.ts — next/image throws for hosts
 * that aren't allowed, so anything else is rendered as the original file.
 */
export function canOptimizeImage(src: string | null | undefined): src is string {
  if (!src) return false;
  if (src.startsWith("/") && !src.startsWith("//")) return true;
  try {
    const url = new URL(src);
    if (url.protocol !== "https:") return false;
    const isStorage = url.pathname.startsWith("/storage/v1/object/public/");
    if (isStorage && (url.hostname.endsWith(".supabase.co") || url.hostname === supabaseHostname)) return true;
    if (backendHostname && url.hostname === backendHostname && url.pathname.startsWith("/api/files/")) return true;
    return url.hostname === "images.unsplash.com";
  } catch {
    return false;
  }
}

/** Resized WebP URL for places that need a plain URL (e.g. a video `poster`). */
export function optimizedImageUrl(src: string, width = 1280, quality = 75): string {
  if (!canOptimizeImage(src)) return src;
  const { props } = getImageProps({ src, alt: "", width, height: Math.round((width * 9) / 16), quality });
  return props.src;
}
