import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";
import { uploadConfig } from "@/lib/config";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { resolvePhotoMimeType, resolveThumbnailMimeType, resolveVideoMimeType } from "@/lib/mime";
import { publicFileUrl, putObject } from "@/lib/storage";

const IMAGE_UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp"];

type UploadKind = "video" | "thumbnail" | "photo";

export interface StoredUpload {
  bucket: string;
  path: string;
  publicUrl: string;
  fileSizeBytes: number;
  fileName: string;
}

/**
 * POST /api/upload (multipart/form-data)
 *
 * The browser sends the file to THIS Worker, which stores it in R2 through
 * the `MEDIA` binding. Used for thumbnails and photos, and for videos up to
 * ~95 MB. Bigger videos go straight to R2 with a presigned URL
 * (`POST /api/upload/signed-url`) because Workers cap request bodies at 100 MB.
 *
 * Field `kind`: "video" | "thumbnail" | "photo"
 * Field `file` (or repeated `files`): the binary. Photos may send several.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAdmin();

    const { allowed } = rateLimit(`upload:${getClientIp(request)}:${userId}`, {
      limit: 200,
      windowMs: 60_000,
    });
    if (!allowed) return jsonError("Too many upload requests. Please slow down.", 429);

    const form = await request.formData();
    const kind = String(form.get("kind") ?? "") as UploadKind;

    if (kind !== "video" && kind !== "thumbnail" && kind !== "photo") {
      return jsonError('Field "kind" must be "video", "thumbnail", or "photo".', 400);
    }

    const incoming = [...form.getAll("file"), ...form.getAll("files")].filter(
      (value): value is File => value instanceof File && value.size > 0
    );
    const files = incoming.filter(
      (file, index, list) => list.findIndex((other) => other === file) === index
    );

    if (files.length === 0) {
      return jsonError('Field "file" is required.', 400);
    }

    const maxBatch = kind === "photo" ? uploadConfig.maxPhotoBatchCount : 1;
    if (files.length > maxBatch) {
      return jsonError(
        kind === "photo"
          ? `You can upload at most ${maxBatch} photos at once.`
          : 'Field "file" must be a single file.',
        400
      );
    }

    const stored: StoredUpload[] = [];
    for (const file of files) {
      const checked = validateUpload(kind, file);
      if ("error" in checked) {
        return jsonError(checked.error, checked.status);
      }
      await putObject(checked.bucket, checked.path, file, checked.contentType);
      stored.push({
        bucket: checked.bucket,
        path: checked.path,
        publicUrl: publicFileUrl(request.nextUrl.origin, checked.bucket, checked.path),
        fileSizeBytes: file.size,
        fileName: file.name,
      });
    }

    if (stored.length === 1) {
      const [first] = stored;
      return jsonOk({
        ...first,
        files: stored,
      });
    }

    return jsonOk({
      files: stored,
      count: stored.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

type ValidatedUpload =
  | { error: string; status: 413 | 415 }
  | { bucket: string; contentType: string; path: string };

function validateUpload(kind: UploadKind, file: File): ValidatedUpload {
  const isVideo = kind === "video";
  const isPhoto = kind === "photo";
  const contentType = isVideo
    ? resolveVideoMimeType(file.name, file.type)
    : isPhoto
      ? resolvePhotoMimeType(file.name, file.type)
      : resolveThumbnailMimeType(file.name, file.type);

  const allowedTypes = isVideo
    ? uploadConfig.allowedVideoMimeTypes
    : isPhoto
      ? uploadConfig.allowedPhotoMimeTypes ?? IMAGE_UPLOAD_TYPES
      : uploadConfig.allowedThumbnailMimeTypes ?? IMAGE_UPLOAD_TYPES;
  const configuredMax = (isVideo
    ? uploadConfig.maxVideoSizeMb
    : isPhoto
      ? uploadConfig.maxPhotoSizeMb
      : uploadConfig.maxThumbnailSizeMb) * 1024 * 1024;
  const bucket = isVideo
    ? uploadConfig.videoBucket
    : isPhoto
      ? uploadConfig.photoBucket
      : uploadConfig.thumbnailBucket;

  if (!Array.isArray(allowedTypes) || !allowedTypes.includes(contentType)) {
    return {
      error: `"${file.name}" has unsupported type "${contentType || "unknown"}". Allowed: ${allowedTypes.join(", ")}`,
      status: 415 as const,
    };
  }

  const maxBytes = Math.min(configuredMax, uploadConfig.proxyUploadMaxBytes);
  if (file.size > maxBytes) {
    const tooBigForWorker = configuredMax > uploadConfig.proxyUploadMaxBytes && file.size <= configuredMax;
    return {
      error: tooBigForWorker
        ? `"${file.name}" is too large to upload through the server (limit ${Math.round(maxBytes / (1024 * 1024))} MB). Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY so large videos upload directly to R2.`
        : `"${file.name}" is too large. Maximum allowed size is ${Math.round(maxBytes / (1024 * 1024))} MB.`,
      status: 413 as const,
    };
  }

  const safeExt = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  return {
    bucket,
    contentType,
    path: `${new Date().getFullYear()}/${crypto.randomUUID()}.${safeExt}`,
  };
}
