import { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("photos")
      .update({ deleted_at: null, status: "draft" })
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!data) return jsonError("Photo not found.", 404);

    return jsonOk({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
