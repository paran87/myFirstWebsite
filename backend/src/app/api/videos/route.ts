import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, tryGetAdmin } from "@/lib/auth";
import { applyListSort } from "@/lib/sort";
import { jsonOk, handleApiError, jsonError } from "@/lib/api-response";
import { createVideoSchema, listVideosQuerySchema } from "@/lib/validation";
import type { PaginatedResult, Video } from "@/lib/types";
import { corsHeaders, corsPreflight } from "@/lib/cors";
import { revalidateFrontend } from "@/lib/revalidate-frontend";

export async function OPTIONS(request: NextRequest) {
  return corsPreflight(request);
}

// Columns returned to the PUBLIC frontend — intentionally excludes
// internal storage paths and audit fields (see rule #29: don't fetch
// unnecessary columns).
const PUBLIC_LIST_COLUMNS =
  "id, title, description, video_url, thumbnail_url, location, street, barangay, city, province, region, latitude, longitude, recorded_at, duration_seconds, category_id, tags, views, status, created_at";

const ADMIN_LIST_COLUMNS = "*";

/**
 * GET /api/videos?page=1&limit=24&search=&city=&category=&status=&sort=
 *
 * Public callers only ever see `status = published` videos.
 * Authenticated admins/editors can additionally filter by status,
 * include soft-deleted videos (recycle bin), and search drafts.
 */
export async function GET(request: NextRequest) {
  try {
    const query = listVideosQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams.entries())
    );

    const admin = await tryGetAdmin();
    // Dev admin and other backend-only sessions have no Supabase JWT, so RLS
    // would hide drafts and recycle-bin rows. After auth, use the service role.
    const supabase = admin ? createSupabaseAdminClient() : await createSupabaseServerClient();

    const from = (query.page - 1) * query.limit;
    const to = from + query.limit - 1;

    let builder = supabase
      .from("videos")
      .select(admin ? ADMIN_LIST_COLUMNS : PUBLIC_LIST_COLUMNS, { count: "exact" });

    if (admin) {
      if (query.includeDeleted) {
        builder = builder.not("deleted_at", "is", null);
      } else {
        builder = builder.is("deleted_at", null);
      }
      if (query.status) {
        builder = builder.eq("status", query.status);
      }
    } else {
      // Public visitors can never bypass this, regardless of query params.
      builder = builder.eq("status", "published").is("deleted_at", null);
    }

    if (query.search) {
      // Uses the generated `search_vector` tsvector column + GIN index —
      // avoids downloading the whole table to filter client-side.
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
    const result: PaginatedResult<Video> = {
      data: (data ?? []) as unknown as Video[],
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
 * POST /api/videos — create a new video record. Admin/editor only.
 * The actual video/thumbnail binary must already be uploaded to storage
 * via `POST /api/upload/signed-url` before calling this; this endpoint
 * only persists metadata (video_url, thumbnail_url, storage paths, etc).
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAdmin();
    const body = createVideoSchema.parse(await request.json());

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("videos")
      .insert({ ...body, created_by: userId || null })
      .select("*")
      .single();

    if (error) throw error;

    await revalidateFrontend(["videos"]);
    return jsonOk<Video>(data as unknown as Video, 201);
  } catch (error) {
    if (error instanceof SyntaxError) return jsonError("Invalid JSON body.", 400);
    return handleApiError(error);
  }
}
