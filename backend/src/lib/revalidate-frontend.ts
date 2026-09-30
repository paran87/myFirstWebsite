import "server-only";

/**
 * Tells the public site to drop its cached copies of the given data so an
 * admin change shows up on the next page view instead of after the cache
 * expires. Needs REVALIDATE_SECRET (same value in both projects) and the
 * public site's URL (FRONTEND_URL, or the first ALLOWED_FRONTEND_ORIGINS
 * entry). Never throws: without the settings, the site simply refreshes on
 * its normal ~30s schedule.
 */
export async function revalidateFrontend(tags: string[]): Promise<void> {
  const secret = process.env.REVALIDATE_SECRET;
  const base = (process.env.FRONTEND_URL || (process.env.ALLOWED_FRONTEND_ORIGINS ?? "").split(",")[0] || "").trim();
  if (!secret || !base || tags.length === 0) return;

  try {
    await fetch(`${base.replace(/\/+$/, "")}/api/revalidate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-revalidate-secret": secret },
      body: JSON.stringify({ tags }),
      signal: AbortSignal.timeout(4000),
    });
  } catch {
    // The public site will still refresh on its own schedule.
  }
}
