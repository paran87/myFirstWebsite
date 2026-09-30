import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";

/**
 * POST /api/revalidate — called by the admin backend after it changes
 * videos, photos or categories, so the public site drops its cached copy
 * and the next visitor sees the change immediately.
 *
 * Header `x-revalidate-secret` must equal REVALIDATE_SECRET (set the same
 * value in both Vercel projects). Body: `{ "tags": ["videos", "video:<id>"] }`.
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET ?? "";
  const provided = request.headers.get("x-revalidate-secret") ?? "";
  const valid =
    secret.length > 0 &&
    provided.length === secret.length &&
    timingSafeEqual(Buffer.from(provided), Buffer.from(secret));
  if (!valid) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { tags?: unknown } | null;
  const tags = (Array.isArray(body?.tags) ? body.tags : [])
    .filter((tag): tag is string => typeof tag === "string" && /^[\w:-]{1,120}$/.test(tag))
    .slice(0, 50);

  // expire: 0 → the next request fetches fresh data instead of serving stale.
  for (const tag of tags) revalidateTag(tag, { expire: 0 });

  return Response.json({ revalidated: tags });
}
