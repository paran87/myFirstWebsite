import { NextRequest } from "next/server";
import { requireAdmin, tryGetAdmin } from "@/lib/auth";
import { insertCategory, isUniqueViolation, listCategories } from "@/lib/db";
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
    const categories = await listCategories(Boolean(admin));

    return jsonOk<Category[]>(categories, {
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

    let category: Category;
    try {
      category = await insertCategory({ ...body, slug: slugify(body.name) });
    } catch (error) {
      if (isUniqueViolation(error)) return jsonError("A category with this name already exists.", 409);
      throw error;
    }

    await revalidateFrontend(["categories"]);
    return jsonOk<Category>(category, 201);
  } catch (error) {
    if (error instanceof SyntaxError) return jsonError("Invalid JSON body.", 400);
    return handleApiError(error);
  }
}
