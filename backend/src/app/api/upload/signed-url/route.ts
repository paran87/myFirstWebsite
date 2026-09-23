import { NextRequest } from "next/server";
import crypto from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";
import { uploadConfig } from "@/lib/config";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

const requestSchema = z.object({
  kind: z.enum(["video", "thumbnail"]),
  fileName: z.string().trim().min(1).max(255),
  contentType: z.string().trim().min(1),
  fileSizeBytes: z.number().int().min(1),
});

/**
 * POST /api/upload/signed-url
 *
 * Returns a short-lived, single-file Supabase Storage signed upload URL
 * (+ token) so the admin browser can upload the video/thumbnail binary
 * DIRECTLY to object storage — it never passes through this backend
 * server, which keeps large body-camera recordings off our compute
 * bandwidth entirely (see spec section 15/16).
 *
 * The client uploads with:
 *   supabase.storage.from(bucket).uploadToSignedUrl(path, token, file)
 * using the PUBLIC anon key — the service role key never leaves the server.
 *
 * For files larger than a few hundred MB in production, swap this for
 * Supabase's resumable (TUS) upload endpoint
 * (`https://<project>.supabase.co/storage/v1/upload/resumable`) using
 * `tus-js-client`, which supports chunked/resumable uploads with retry.
 * The response shape here (`path`, bucket name) is designed so that
 * swap only touches the admin upload widget, not the rest of the app.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAdmin();

    const { allowed } = rateLimit(`upload:${getClientIp(request)}:${userId}`, {
      limit: 20,
      windowMs: 60_000,
    });
    if (!allowed) return jsonError("Too many upload requests. Please slow down.", 429);

    const body = requestSchema.parse(await request.json());

    const isVideo = body.kind === "video";
    const allowedTypes = isVideo ? uploadConfig.allowedVideoMimeTypes : uploadConfig.allowedThumbnailMimeTypes;
    const maxBytes = (isVideo ? uploadConfig.maxVideoSizeMb : uploadConfig.maxThumbnailSizeMb) * 1024 * 1024;
    const bucket = isVideo ? uploadConfig.videoBucket : uploadConfig.thumbnailBucket;

    if (!allowedTypes.includes(body.contentType)) {
      return jsonError(
        `Unsupported file type "${body.contentType}". Allowed: ${allowedTypes.join(", ")}`,
        415
      );
    }
    if (body.fileSizeBytes > maxBytes) {
      return jsonError(
        `File is too large. Maximum allowed size is ${Math.round(maxBytes / (1024 * 1024))} MB.`,
        413
      );
    }

    const safeExt = (body.fileName.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
    const uniquePath = `${new Date().getFullYear()}/${crypto.randomUUID()}.${safeExt}`;

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.storage.from(bucket).createSignedUploadUrl(uniquePath);
    if (error) throw error;

    const { data: publicUrlData } = admin.storage.from(bucket).getPublicUrl(uniquePath);

    return jsonOk({
      bucket,
      path: uniquePath,
      token: data.token,
      signedUrl: data.signedUrl,
      publicUrl: publicUrlData.publicUrl,
    });
  } catch (error) {
    if (error instanceof SyntaxError) return jsonError("Invalid JSON body.", 400);
    return handleApiError(error);
  }
}
