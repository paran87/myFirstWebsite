import { requireAdmin } from "@/lib/auth";
import { getDashboardStats } from "@/lib/db";
import { jsonOk, handleApiError } from "@/lib/api-response";

/** GET /api/admin/stats — dashboard summary numbers. Admin only. */
export async function GET() {
  try {
    await requireAdmin();
    return jsonOk(await getDashboardStats());
  } catch (error) {
    return handleApiError(error);
  }
}
