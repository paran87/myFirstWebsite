import { NextRequest } from "next/server";
import { requireAdmin, tryGetAdmin } from "@/lib/auth";
import { insertContent, insertContentBatch, listContent } from "@/lib/db";
import { jsonOk, handleApiError, jsonError } from "@/lib/api-response";
import { createPhotoSchema, createPhotosBatchSchema, listPhotosQuerySchema } from "@/lib/validation";
import type { PaginatedResult, Photo } from "@/lib/types";
import { corsHeaders, corsPreflight } from "@/lib/cors";
import { revalidateFrontend } from "@/lib/revalidate-frontend";

export async function OPTIONS(request: NextRequest) {
  return corsPreflight(request);
}

export async function GET(request: NextRequest) {
  try {
    const query = listPhotosQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams.entries())
    );

    const admin = await tryGetAdmin();
    const { rows, total } = await listContent<Photo>("photos", query, Boolean(admin));

    const result: PaginatedResult<Photo> = {
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

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAdmin();
    const raw = (await request.json()) as unknown;

    const wrapped = (raw as { photos?: unknown } | null)?.photos;
    const batchItems = Array.isArray(raw) ? raw : Array.isArray(wrapped) ? wrapped : null;

    if (batchItems) {
      const photos = createPhotosBatchSchema.parse(batchItems);
      const created = await insertContentBatch<Photo>("photos", photos, userId);

      await revalidateFrontend(["photos"]);
      return jsonOk({ data: created, count: created.length }, 201);
    }

    const body = createPhotoSchema.parse(raw);
    const photo = await insertContent<Photo>("photos", body, userId);

    await revalidateFrontend(["photos"]);
    return jsonOk<Photo>(photo, 201);
  } catch (error) {
    if (error instanceof SyntaxError) return jsonError("Invalid JSON body.", 400);
    return handleApiError(error);
  }
}
