import { NextRequest } from "next/server";
import crypto from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { corsHeaders, corsPreflight } from "@/lib/cors";

interface Params {
  params: Promise<{ id: string }>;
}

export async function OPTIONS(request: NextRequest) {
  return corsPreflight(request);
}

/**
 * POST /api/videos/:id/view — increments the view counter for a
 * published video, at most once per viewer per video.
 *
 * De-duplication strategy (kept intentionally simple for the MVP, see
 * spec section 24 "view tracking can later become more sophisticated"):
 * a `viewer_key` is derived by hashing the client IP + a client-supplied
 * `sessionId` (a random id the frontend generates once per browser and
 * stores in localStorage). This avoids a single page load / replay from
 * incrementing the counter multiple times while not requiring accounts.
 */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const { allowed } = rateLimit(`view:${getClientIp(request)}`, {
      limit: 60,
      windowMs: 60_000,
    });
    if (!allowed) return jsonError("Too many requests.", 429);

    const body = await request.json().catch(() => ({}));
    const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "anonymous";

    const viewerKey = crypto
      .createHash("sha256")
      .update(`${getClientIp(request)}:${sessionId}:${id}`)
      .digest("hex");

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.rpc("increment_video_views", {
      p_video_id: id,
      p_viewer_key: viewerKey,
    });

    if (error) throw error;

    return jsonOk({ views: data }, { headers: corsHeaders(request) });
  } catch (error) {
    return handleApiError(error);
  }
}
