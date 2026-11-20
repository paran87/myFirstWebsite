import { NextRequest } from "next/server";
import { requireAdmin, tryGetAdmin } from "@/lib/auth";
import { getContent, hardDeleteContent, softDeleteContent, updateContent } from "@/lib/db";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";
import { updateVideoSchema } from "@/lib/validation";
import type { Video } from "@/lib/types";
import { corsHeaders, corsPreflight } from "@/lib/cors";
import { uploadConfig } from "@/lib/config";
import { deleteObject } from "@/lib/storage";
import { revalidateFrontend } from "@/lib/revalidate-frontend";

interface Params {
  params: Promise<{ id: string }>;
}

export async function OPTIONS(request: NextRequest) {
  return corsPreflight(request);
}

/** GET /api/videos/:id — public if published, admin can see any status. */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const admin = await tryGetAdmin();

    const video = await getContent<Video>("videos", id, Boolean(admin));
    if (!video) return jsonError("Video not found.", 404);

    return jsonOk<Video>(video, { headers: corsHeaders(request) });
  } catch (error) {
    return handleApiError(error);
  }
}

/** PATCH /api/videos/:id — update metadata. Admin only. */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = updateVideoSchema.parse(await request.json());

    const video = await updateContent<Video>("videos", id, body);
    if (!video) return jsonError("Video not found.", 404);

    await revalidateFrontend(["videos", `video:${id}`]);
    return jsonOk<Video>(video);
  } catch (error) {
    if (error instanceof SyntaxError) return jsonError("Invalid JSON body.", 400);
    return handleApiError(error);
  }
}

/**
 * DELETE /api/videos/:id
 *   - default: soft delete (sets deleted_at, status='deleted') → recoverable
 *   - `?permanent=true`: hard delete the row AND the underlying R2 objects
 *     (used from the Recycle Bin's "Permanently Delete" action).
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const permanent = request.nextUrl.searchParams.get("permanent") === "true";

    if (!permanent) {
      if (!(await softDeleteContent("videos", id))) return jsonError("Video not found.", 404);

      await revalidateFrontend(["videos", `video:${id}`]);
      return jsonOk({ success: true, mode: "soft" });
    }

    const removed = await hardDeleteContent("videos", id);
    if (!removed) return jsonError("Video not found.", 404);

    await deleteObject(uploadConfig.videoBucket, removed.storage_path as string | null);
    await deleteObject(uploadConfig.thumbnailBucket, removed.thumbnail_storage_path as string | null);

    await revalidateFrontend(["videos", `video:${id}`]);
    return jsonOk({ success: true, mode: "permanent" });
  } catch (error) {
    return handleApiError(error);
  }
}
