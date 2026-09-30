import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, tryGetAdmin } from "@/lib/auth";
import { applyListSort } from "@/lib/sort";
import { jsonOk, handleApiError, jsonError } from "@/lib/api-response";
import { createPhotoSchema, createPhotosBatchSchema, listPhotosQuerySchema } from "@/lib/validation";
import type { PaginatedResult, Photo } from "@/lib/types";
import { corsHeaders, corsPreflight } from "@/lib/cors";
import { revalidateFrontend } from "@/lib/revalidate-frontend";

export async function OPTIONS(request: NextRequest) {
  return corsPreflight(request);
}

const PUBLIC_LIST_COLUMNS =
  "id, title, description, image_url, location, street, barangay, city, province, region, latitude, longitude, recorded_at, category_id, tags, views, status, created_at";

const ADMIN_LIST_COLUMNS = "*";

export async function GET(request: NextRequest) {
  try {
    const query = listPhotosQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams.entries())
    );

    const admin = await tryGetAdmin();
    const supabase = admin ? createSupabaseAdminClient() : await createSupabaseServerClient();

    const from = (query.page - 1) * query.limit;
    const to = from + query.limit - 1;

    let builder = supabase
      .from("photos")
      .select(admin ? ADMIN_LIST_COLUMNS : PUBLIC_LIST_COLUMNS, { count: "exact" });

    if (admin) {
      if (query.includeDeleted) {
        builder = builder.not("deleted_at", "is", null);
      } else {
        builder = builder.is("deleted_at", null);
      }
      if (query.status) builder = builder.eq("status", query.status);
    } else {
      builder = builder.eq("status", "published").is("deleted_at", null);
    }

    if (query.search) {
      builder = builder.textSearch("search_vector", query.search, {
        type: "websearch",
        config: "english",
      });
    }
    if (query.city) builder = builder.ilike("city", query.city);
    if (query.category) builder = builder.eq("category_id", query.category);
    if (query.year) {
      builder = builder
        .gte("recorded_at", `${query.year}-01-01T00:00:00Z`)
        .lt("recorded_at", `${query.year + 1}-01-01T00:00:00Z`);
    }
    if (query.dateFrom) builder = builder.gte("recorded_at", query.dateFrom);
    if (query.dateTo) builder = builder.lte("recorded_at", query.dateTo);

    builder = applyListSort(builder, query.sort);

    const { data, error, count } = await builder.range(from, to);
    if (error) throw error;

    const total = count ?? 0;
    const result: PaginatedResult<Photo> = {
      data: (data ?? []) as unknown as Photo[],
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
    const raw = await request.json();
    const admin = createSupabaseAdminClient();

    const batchItems = Array.isArray(raw) ? raw : raw && Array.isArray(raw.photos) ? raw.photos : null;

    if (batchItems) {
      const photos = createPhotosBatchSchema.parse(batchItems);
      const { data, error } = await admin
        .from("photos")
        .insert(photos.map((photo) => ({ ...photo, created_by: userId || null })))
        .select("*");

      if (error) throw error;

      await revalidateFrontend(["photos"]);
      return jsonOk({ data: (data ?? []) as unknown as Photo[], count: data?.length ?? 0 }, 201);
    }

    const body = createPhotoSchema.parse(raw);
    const { data, error } = await admin
      .from("photos")
      .insert({ ...body, created_by: userId || null })
      .select("*")
      .single();

    if (error) throw error;

    await revalidateFrontend(["photos"]);
    return jsonOk<Photo>(data as unknown as Photo, 201);
  } catch (error) {
    if (error instanceof SyntaxError) return jsonError("Invalid JSON body.", 400);
    return handleApiError(error);
  }
}
