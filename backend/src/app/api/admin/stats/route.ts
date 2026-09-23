import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { jsonOk, handleApiError } from "@/lib/api-response";
import type { DashboardStats } from "@/lib/types";

/** GET /api/admin/stats — dashboard summary numbers. Admin only. */
export async function GET() {
  try {
    await requireAdmin();
    const admin = createSupabaseAdminClient();

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      { count: totalVideos },
      { count: draftCount },
      { count: publishedCount },
      { count: deletedCount },
      { count: totalCategories },
      { count: videosThisMonth },
      { data: viewsRows },
      { data: sizeRows },
    ] = await Promise.all([
      admin.from("videos").select("*", { count: "exact", head: true }).is("deleted_at", null),
      admin
        .from("videos")
        .select("*", { count: "exact", head: true })
        .eq("status", "draft")
        .is("deleted_at", null),
      admin
        .from("videos")
        .select("*", { count: "exact", head: true })
        .eq("status", "published")
        .is("deleted_at", null),
      admin.from("videos").select("*", { count: "exact", head: true }).not("deleted_at", "is", null),
      admin.from("categories").select("*", { count: "exact", head: true }),
      admin
        .from("videos")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null)
        .gte("created_at", startOfMonth.toISOString()),
      admin.from("videos").select("views").is("deleted_at", null),
      admin.from("videos").select("file_size_bytes").is("deleted_at", null),
    ]);

    const totalViews = (viewsRows ?? []).reduce((sum, r) => sum + (r.views ?? 0), 0);
    const storageUsedBytes = (sizeRows ?? []).reduce((sum, r) => sum + (r.file_size_bytes ?? 0), 0);

    const stats: DashboardStats = {
      totalVideos: totalVideos ?? 0,
      totalViews,
      totalCategories: totalCategories ?? 0,
      videosThisMonth: videosThisMonth ?? 0,
      storageUsedBytes,
      draftCount: draftCount ?? 0,
      publishedCount: publishedCount ?? 0,
      deletedCount: deletedCount ?? 0,
    };

    return jsonOk(stats);
  } catch (error) {
    return handleApiError(error);
  }
}
