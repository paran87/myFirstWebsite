import exifr from "exifr";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { jsonOk, handleApiError } from "@/lib/api-response";
import { isLatLng, roundCoord } from "@/lib/geo";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Photos per request; the admin UI calls again until `remaining` is 0. */
const BATCH_SIZE = 40;
const CONCURRENCY = 5;
/** JPEG/PNG keep EXIF near the start of the file, so a small range is enough. */
const HEAD_BYTES = 256 * 1024;
const MAX_FULL_BYTES = 30 * 1024 * 1024;

async function fetchBytes(url: string, range?: string): Promise<Buffer | null> {
  const response = await fetch(url, {
    headers: range ? { Range: range } : undefined,
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) return null;
  const length = Number(response.headers.get("content-length") ?? 0);
  if (!range && length > MAX_FULL_BYTES) return null;
  return Buffer.from(await response.arrayBuffer());
}

async function gpsFrom(bytes: Buffer): Promise<[number, number] | null> {
  try {
    const gps = await exifr.gps(bytes);
    if (!gps || !isLatLng(gps.latitude, gps.longitude)) return null;
    if (gps.latitude === 0 && gps.longitude === 0) return null;
    return [roundCoord(gps.latitude), roundCoord(gps.longitude)];
  } catch {
    return null;
  }
}

async function readGps(url: string): Promise<[number, number] | null | "error"> {
  try {
    const head = await fetchBytes(url, `bytes=0-${HEAD_BYTES - 1}`);
    if (!head) return "error";
    const fromHead = await gpsFrom(head);
    if (fromHead) return fromHead;
    // WebP (and odd JPEGs) can store EXIF further in; read the whole file
    // once, unless the range request already returned all of it.
    if (head.length < HEAD_BYTES) return null;
    const full = await fetchBytes(url);
    return full ? gpsFrom(full) : "error";
  } catch {
    return "error";
  }
}

/**
 * POST /api/photos/gps-backfill — reads the EXIF GPS position from photo
 * files that don't have coordinates yet and saves it. Processes one batch
 * per call and reports how many are left. Admin/editor only.
 *
 * Photos already checked without GPS are skipped via `skip` (ids the client
 * sends back) so repeated calls always make progress.
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json().catch(() => ({}))) as { skip?: unknown };
    const skip = Array.isArray(body.skip) ? body.skip.filter((id): id is string => typeof id === "string") : [];

    const admin = createSupabaseAdminClient();
    let query = admin
      .from("photos")
      .select("id, image_url", { count: "exact" })
      .is("deleted_at", null)
      .or("latitude.is.null,longitude.is.null")
      .order("created_at", { ascending: false })
      .limit(BATCH_SIZE);
    if (skip.length) query = query.not("id", "in", `(${skip.join(",")})`);

    const { data, error, count } = await query;
    if (error) throw error;

    const rows = data ?? [];
    const updated: string[] = [];
    const noGps: string[] = [];
    const failed: string[] = [];

    for (let i = 0; i < rows.length; i += CONCURRENCY) {
      await Promise.all(
        rows.slice(i, i + CONCURRENCY).map(async (row) => {
          const gps = await readGps(row.image_url);
          if (gps === "error") return failed.push(row.id);
          if (!gps) return noGps.push(row.id);
          const { error: updateError } = await admin
            .from("photos")
            .update({ latitude: gps[0], longitude: gps[1] })
            .eq("id", row.id);
          if (updateError) failed.push(row.id);
          else updated.push(row.id);
        })
      );
    }

    const remaining = Math.max(0, (count ?? rows.length) - rows.length);
    return jsonOk({
      checked: rows.length,
      updated: updated.length,
      noGps,
      failed,
      remaining,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
