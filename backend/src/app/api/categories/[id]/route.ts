import { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";
import { updateCategorySchema, slugify } from "@/lib/validation";
import type { Category } from "@/lib/types";
import type { Database } from "@/lib/supabase/database.types";

type CategoryUpdate = Database["public"]["Tables"]["categories"]["Update"];

interface Params {
  params: Promise<{ id: string }>;
}

/** PATCH /api/categories/:id — admin only. Handles rename, description, activate/deactivate. */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = updateCategorySchema.parse(await request.json());

    const patch: CategoryUpdate = { ...body };
    if (body.name) patch.slug = slugify(body.name);

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("categories")
      .update(patch)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) {
      if (error.code === "23505") return jsonError("A category with this name already exists.", 409);
      throw error;
    }
    if (!data) return jsonError("Category not found.", 404);

    return jsonOk<Category>(data as unknown as Category);
  } catch (error) {
    if (error instanceof SyntaxError) return jsonError("Invalid JSON body.", 400);
    return handleApiError(error);
  }
}

/**
 * DELETE /api/categories/:id — admin only.
 * Videos referencing this category have `category_id` set to NULL
 * (see the `on delete set null` foreign key) rather than being deleted.
 */
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;

    const admin = createSupabaseAdminClient();
    const { error } = await admin.from("categories").delete().eq("id", id);
    if (error) throw error;

    return jsonOk({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
