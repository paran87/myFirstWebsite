import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, tryGetAdmin } from "@/lib/auth";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";
import { updateVideoSchema } from "@/lib/validation";
import type { Video } from "@/lib/types";
import { corsHeaders, corsPreflight } from "@/lib/cors";
import { removeLocalUpload } from "@/lib/local-storage";
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
    const supabase = admin ? createSupabaseAdminClient() : await createSupabaseServerClient();

    let builder = supabase.from("videos").select("*, category:categories(*)").eq("id", id);
    if (!admin) {
      builder = builder.eq("status", "published").is("deleted_at", null);
    }

    const { data, error } = await builder.maybeSingle();
    if (error) throw error;
    if (!data) return jsonError("Video not found.", 404);

    return jsonOk<Video>(data as unknown as Video, { headers: corsHeaders(request) });
  } catch (error) {
    return handleApiError(error);
  }
}

/** PATCH /api/videos/:id — update metadata. Admin/editor only. */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = updateVideoSchema.parse(await request.json());

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("videos")
      .update(body)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    if (!data) return jsonError("Video not found.", 404);

    await revalidateFrontend(["videos", `video:${id}`]);
    return jsonOk<Video>(data as unknown as Video);
  } catch (error) {
    if (error instanceof SyntaxError) return jsonError("Invalid JSON body.", 400);
    return handleApiError(error);
  }
}

/**
 * DELETE /api/videos/:id
 *   - default: soft delete (sets deleted_at, status='deleted') → recoverable
 *   - `?permanent=true`: hard delete the row AND the underlying storage
 *     objects (used from the Recycle Bin's "Permanently Delete" action).
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const permanent = request.nextUrl.searchParams.get("permanent") === "true";

    const admin = createSupabaseAdminClient();

    if (!permanent) {
      const { data, error } = await admin
        .from("videos")
        .update({ deleted_at: new Date().toISOString(), status: "deleted" })
        .eq("id", id)
        .select("id")
        .maybeSingle();

      if (error) throw error;
      if (!data) return jsonError("Video not found.", 404);

      await revalidateFrontend(["videos", `video:${id}`]);
      return jsonOk({ success: true, mode: "soft" });
    }

    const { data: video, error: fetchError } = await admin
      .from("videos")
      .select("storage_path, thumbnail_storage_path")
      .eq("id", id)
      .maybeSingle();
    if (fetchError) throw fetchError;
    if (!video) return jsonError("Video not found.", 404);

    if (video.storage_path) {
      await removeLocalUpload(process.env.SUPABASE_VIDEO_BUCKET || "videos", video.storage_path);
      await admin.storage.from(process.env.SUPABASE_VIDEO_BUCKET || "videos").remove([video.storage_path]);
    }
    if (video.thumbnail_storage_path) {
      await removeLocalUpload(process.env.SUPABASE_THUMBNAIL_BUCKET || "thumbnails", video.thumbnail_storage_path);
      await admin.storage
        .from(process.env.SUPABASE_THUMBNAIL_BUCKET || "thumbnails")
        .remove([video.thumbnail_storage_path]);
    }

    const { error: deleteError } = await admin.from("videos").delete().eq("id", id);
    if (deleteError) throw deleteError;

    await revalidateFrontend(["videos", `video:${id}`]);
    return jsonOk({ success: true, mode: "permanent" });
  } catch (error) {
    return handleApiError(error);
  }
}
