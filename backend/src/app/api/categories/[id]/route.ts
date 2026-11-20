import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { deleteCategory, isUniqueViolation, updateCategory } from "@/lib/db";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";
import { updateCategorySchema, slugify } from "@/lib/validation";
import type { Category } from "@/lib/types";
import { revalidateFrontend } from "@/lib/revalidate-frontend";

interface Params {
  params: Promise<{ id: string }>;
}

/** PATCH /api/categories/:id — admin only. Handles rename, description, activate/deactivate. */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = updateCategorySchema.parse(await request.json());

    const patch = { ...body, ...(body.name ? { slug: slugify(body.name) } : {}) };

    let category: Category | null;
    try {
      category = await updateCategory(id, patch);
    } catch (error) {
      if (isUniqueViolation(error)) return jsonError("A category with this name already exists.", 409);
      throw error;
    }
    if (!category) return jsonError("Category not found.", 404);

    await revalidateFrontend(["categories", "videos", "photos"]);
    return jsonOk<Category>(category);
  } catch (error) {
    if (error instanceof SyntaxError) return jsonError("Invalid JSON body.", 400);
    return handleApiError(error);
  }
}

/**
 * DELETE /api/categories/:id — admin only.
 * Videos and photos referencing this category have `category_id` set to
 * NULL (see the `ON DELETE SET NULL` foreign key) rather than being deleted.
 */
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;

    await deleteCategory(id);

    await revalidateFrontend(["categories", "videos", "photos"]);
    return jsonOk({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
