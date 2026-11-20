import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { restoreContent } from "@/lib/db";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";
import { revalidateFrontend } from "@/lib/revalidate-frontend";

interface Params {
  params: Promise<{ id: string }>;
}

/** POST /api/videos/:id/restore — recycle bin restore (deleted_at = NULL). */
export async function POST(_request: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;

    if (!(await restoreContent("videos", id))) return jsonError("Video not found.", 404);

    await revalidateFrontend(["videos", `video:${id}`]);
    return jsonOk({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
