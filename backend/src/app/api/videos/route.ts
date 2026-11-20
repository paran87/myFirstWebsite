import { NextRequest } from "next/server";
import { requireAdmin, tryGetAdmin } from "@/lib/auth";
import { insertContent, listContent } from "@/lib/db";
import { jsonOk, handleApiError, jsonError } from "@/lib/api-response";
import { createVideoSchema, listVideosQuerySchema } from "@/lib/validation";
import type { PaginatedResult, Video } from "@/lib/types";
import { corsHeaders, corsPreflight } from "@/lib/cors";
import { revalidateFrontend } from "@/lib/revalidate-frontend";

export async function OPTIONS(request: NextRequest) {
  return corsPreflight(request);
}

/**
 * GET /api/videos?page=1&limit=24&search=&city=&category=&status=&sort=
 *
 * Public callers only ever see `status = published` videos, with a reduced
 * set of columns. Authenticated admins can additionally filter by status,
 * include soft-deleted videos (recycle bin), and search drafts.
 */
export async function GET(request: NextRequest) {
  try {
    const query = listVideosQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams.entries())
    );

    const admin = await tryGetAdmin();
    const { rows, total } = await listContent<Video>("videos", query, Boolean(admin));

    const result: PaginatedResult<Video> = {
      data: rows,
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    };

    return jsonOk(result, { headers: corsHeaders(request) });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/videos — create a new video record. Admin only.
 * The video/thumbnail binary must already be in R2 (via `POST /api/upload`
 * or `POST /api/upload/signed-url`); this endpoint only persists metadata.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAdmin();
    const body = createVideoSchema.parse(await request.json());

    const video = await insertContent<Video>("videos", body, userId);

    await revalidateFrontend(["videos"]);
    return jsonOk<Video>(video, 201);
  } catch (error) {
    if (error instanceof SyntaxError) return jsonError("Invalid JSON body.", 400);
    return handleApiError(error);
  }
}
