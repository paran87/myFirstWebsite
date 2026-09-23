import { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";

interface Params {
  params: Promise<{ id: string }>;
}

/** POST /api/videos/:id/restore — recycle bin restore (deleted_at = NULL). */
export async function POST(_request: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("videos")
      .update({ deleted_at: null, status: "draft" })
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!data) return jsonError("Video not found.", 404);

    return jsonOk({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
