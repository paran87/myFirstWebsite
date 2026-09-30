import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, tryGetAdmin } from "@/lib/auth";
import { jsonOk, handleApiError, jsonError } from "@/lib/api-response";
import { createCategorySchema, slugify } from "@/lib/validation";
import type { Category } from "@/lib/types";
import { corsHeaders, corsPreflight } from "@/lib/cors";
import { revalidateFrontend } from "@/lib/revalidate-frontend";

export async function OPTIONS(request: NextRequest) {
  return corsPreflight(request);
}

/** GET /api/categories — public sees active only; admins see all. */
export async function GET(request: NextRequest) {
  try {
    const admin = await tryGetAdmin();
    const supabase = await createSupabaseServerClient();

    let builder = supabase.from("categories").select("*").order("name", { ascending: true });
    if (!admin) builder = builder.eq("is_active", true);

    const { data, error } = await builder;
    if (error) throw error;

    return jsonOk<Category[]>((data ?? []) as unknown as Category[], {
      headers: {
        ...corsHeaders(request),
        ...(admin ? {} : { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" }),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/** POST /api/categories — admin only. */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = createCategorySchema.parse(await request.json());
    const slug = slugify(body.name);

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("categories")
      .insert({ ...body, slug })
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") return jsonError("A category with this name already exists.", 409);
      throw error;
    }

    await revalidateFrontend(["categories"]);
    return jsonOk<Category>(data as unknown as Category, 201);
  } catch (error) {
    if (error instanceof SyntaxError) return jsonError("Invalid JSON body.", 400);
    return handleApiError(error);
  }
}
