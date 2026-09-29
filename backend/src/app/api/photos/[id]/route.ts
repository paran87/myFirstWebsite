import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, tryGetAdmin } from "@/lib/auth";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";
import { updatePhotoSchema } from "@/lib/validation";
import type { Photo } from "@/lib/types";
import { corsHeaders, corsPreflight } from "@/lib/cors";
import { uploadConfig } from "@/lib/config";

interface Params {
  params: Promise<{ id: string }>;
}

export async function OPTIONS(request: NextRequest) {
  return corsPreflight(request);
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const admin = await tryGetAdmin();
    const supabase = admin ? createSupabaseAdminClient() : await createSupabaseServerClient();

    let builder = supabase.from("photos").select("*, category:categories(*)").eq("id", id);
    if (!admin) {
      builder = builder.eq("status", "published").is("deleted_at", null);
    }

    const { data, error } = await builder.maybeSingle();
    if (error) throw error;
    if (!data) return jsonError("Photo not found.", 404);

    return jsonOk<Photo>(data as unknown as Photo, {
      headers: {
        ...corsHeaders(request),
        // Same short CDN cache as the list endpoints; admins always get fresh data.
        ...(admin ? {} : { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" }),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = updatePhotoSchema.parse(await request.json());

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.from("photos").update(body).eq("id", id).select("*").maybeSingle();

    if (error) throw error;
    if (!data) return jsonError("Photo not found.", 404);

    return jsonOk<Photo>(data as unknown as Photo);
  } catch (error) {
    if (error instanceof SyntaxError) return jsonError("Invalid JSON body.", 400);
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const permanent = request.nextUrl.searchParams.get("permanent") === "true";

    const admin = createSupabaseAdminClient();

    if (!permanent) {
      const { data, error } = await admin
        .from("photos")
        .update({ deleted_at: new Date().toISOString(), status: "deleted" })
        .eq("id", id)
        .select("id")
        .maybeSingle();

      if (error) throw error;
      if (!data) return jsonError("Photo not found.", 404);

      return jsonOk({ success: true, mode: "soft" });
    }

    const { data: photo, error: fetchError } = await admin
      .from("photos")
      .select("storage_path")
      .eq("id", id)
      .maybeSingle();
    if (fetchError) throw fetchError;
    if (!photo) return jsonError("Photo not found.", 404);

    if (photo.storage_path) {
      await admin.storage.from(uploadConfig.photoBucket).remove([photo.storage_path]);
    }

    const { error: deleteError } = await admin.from("photos").delete().eq("id", id);
    if (deleteError) throw deleteError;

    return jsonOk({ success: true, mode: "permanent" });
  } catch (error) {
    return handleApiError(error);
  }
}
