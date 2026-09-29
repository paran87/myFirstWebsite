/** True when the URL is an auto-generated gradient placeholder, not a real still. */
export function isGeneratedPlaceholderThumbnail(url: string | null | undefined): boolean {
  if (!url) return false;
  return /\/thumbnails\/\d+\/placeholders\//.test(url);
}

export function resolveVideoPosterUrl(
  thumbnailUrl: string | null | undefined,
  videoUrl: string
): { useVideoFrame: boolean; imageUrl: string | null } {
  if (thumbnailUrl && !isGeneratedPlaceholderThumbnail(thumbnailUrl)) {
    return { useVideoFrame: false, imageUrl: thumbnailUrl };
  }
  return { useVideoFrame: true, imageUrl: null };
}
