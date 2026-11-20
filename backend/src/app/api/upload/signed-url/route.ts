import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";
import { uploadConfig } from "@/lib/config";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { resolveThumbnailMimeType, resolveVideoMimeType } from "@/lib/mime";
import { isPresignConfigured, presignUpload, publicFileUrl } from "@/lib/storage";

const requestSchema = z.object({
  kind: z.enum(["video", "thumbnail"]),
  fileName: z.string().trim().min(1).max(255),
  contentType: z.string().trim().min(1),
  fileSizeBytes: z.number().int().min(1),
});

/**
 * POST /api/upload/signed-url
 *
 * Returns a short-lived presigned R2 URL so the admin browser can PUT the
 * binary DIRECTLY to R2. Large body-camera recordings never pass through the
 * Worker (which caps request bodies at 100 MB). A single PUT supports files
 * up to 5 GB, comfortably above the 2 GB app limit.
 *
 * The browser must PUT with the `Content-Type` returned here, and the R2
 * bucket needs a CORS rule allowing PUT from the admin origin (see r2-cors.json).
 *
 * Responds 501 when the R2 S3 credentials are not configured; the admin UI
 * then falls back to uploading through the Worker (small files only).
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAdmin();

    const { allowed } = rateLimit(`upload:${getClientIp(request)}:${userId}`, {
      limit: 200,
      windowMs: 60_000,
    });
    if (!allowed) return jsonError("Too many upload requests. Please slow down.", 429);

    const body = requestSchema.parse(await request.json());

    if (!isPresignConfigured()) {
      return jsonError("Direct R2 uploads are not configured.", 501, { code: "presign_not_configured" });
    }

    const isVideo = body.kind === "video";
    const contentType = isVideo
      ? resolveVideoMimeType(body.fileName, body.contentType)
      : resolveThumbnailMimeType(body.fileName, body.contentType);

    const allowedTypes = isVideo ? uploadConfig.allowedVideoMimeTypes : uploadConfig.allowedThumbnailMimeTypes;
    const maxBytes = (isVideo ? uploadConfig.maxVideoSizeMb : uploadConfig.maxThumbnailSizeMb) * 1024 * 1024;
    const bucket = isVideo ? uploadConfig.videoBucket : uploadConfig.thumbnailBucket;

    if (!allowedTypes.includes(contentType)) {
      return jsonError(
        `Unsupported file type "${contentType || body.contentType || "unknown"}". Allowed: ${allowedTypes.join(", ")}`,
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
    const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${safeExt}`;

    return jsonOk({
      bucket,
      path,
      uploadUrl: await presignUpload(bucket, path, contentType),
      method: "PUT",
      contentType,
      publicUrl: publicFileUrl(request.nextUrl.origin, bucket, path),
    });
  } catch (error) {
    if (error instanceof SyntaxError) return jsonError("Invalid JSON body.", 400);
    return handleApiError(error);
  }
}
