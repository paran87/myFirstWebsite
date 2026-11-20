import { NextRequest } from "next/server";
import { recordVideoView } from "@/lib/db";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { corsHeaders, corsPreflight } from "@/lib/cors";

interface Params {
  params: Promise<{ id: string }>;
}

export async function OPTIONS(request: NextRequest) {
  return corsPreflight(request);
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * POST /api/videos/:id/view — increments the view counter for a
 * published video, at most once per viewer per video.
 *
 * De-duplication: a `viewer_key` is derived by hashing the client IP + a
 * client-supplied `sessionId` (a random id the frontend generates once per
 * browser and stores in localStorage), so a replay or page reload does not
 * inflate the counter and no accounts are needed.
 */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const { allowed } = rateLimit(`view:${getClientIp(request)}`, {
      limit: 60,
      windowMs: 60_000,
    });
    if (!allowed) return jsonError("Too many requests.", 429);

    const body = (await request.json().catch(() => ({}))) as { sessionId?: unknown };
    const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "anonymous";

    const viewerKey = await sha256Hex(`${getClientIp(request)}:${sessionId}:${id}`);

    const views = await recordVideoView(id, viewerKey);
    if (views === null) return jsonError("Video not found.", 404);

    return jsonOk({ views }, { headers: corsHeaders(request) });
  } catch (error) {
    return handleApiError(error);
  }
}
