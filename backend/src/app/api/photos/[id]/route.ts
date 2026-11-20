import { NextRequest } from "next/server";
import { requireAdmin, tryGetAdmin } from "@/lib/auth";
import { getContent, hardDeleteContent, softDeleteContent, updateContent } from "@/lib/db";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";
import { updatePhotoSchema } from "@/lib/validation";
import type { Photo } from "@/lib/types";
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

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const admin = await tryGetAdmin();

    const photo = await getContent<Photo>("photos", id, Boolean(admin));
    if (!photo) return jsonError("Photo not found.", 404);

    return jsonOk<Photo>(photo, { headers: corsHeaders(request) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = updatePhotoSchema.parse(await request.json());

    const photo = await updateContent<Photo>("photos", id, body);
    if (!photo) return jsonError("Photo not found.", 404);

    await revalidateFrontend(["photos", `photo:${id}`]);
    return jsonOk<Photo>(photo);
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

    if (!permanent) {
      if (!(await softDeleteContent("photos", id))) return jsonError("Photo not found.", 404);

      await revalidateFrontend(["photos", `photo:${id}`]);
      return jsonOk({ success: true, mode: "soft" });
    }

    const removed = await hardDeleteContent("photos", id);
    if (!removed) return jsonError("Photo not found.", 404);

    await deleteObject(uploadConfig.photoBucket, removed.storage_path as string | null);

    await revalidateFrontend(["photos", `photo:${id}`]);
    return jsonOk({ success: true, mode: "permanent" });
  } catch (error) {
    return handleApiError(error);
  }
}
