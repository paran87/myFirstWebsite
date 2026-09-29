import { NextRequest } from "next/server";
import crypto from "node:crypto";
import { requireAdmin } from "@/lib/auth";
import { jsonOk, jsonError, handleApiError } from "@/lib/api-response";
import { uploadConfig } from "@/lib/config";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { resolvePhotoMimeType, resolveThumbnailMimeType, resolveVideoMimeType } from "@/lib/mime";
import { StorageTooLargeError, uploadToSupabaseStorage, VIDEO_STORAGE_MAX_BYTES } from "@/lib/supabase/storage-upload";
import { localPublicUrl, saveLocalUpload, SUPABASE_SAFE_UPLOAD_BYTES } from "@/lib/local-storage";

// Vercel Hobby caps serverless functions at 300s (Pro allows up to 800s).
export const maxDuration = 300;
export const runtime = "nodejs";

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
 * The browser uploads the file to THIS server, which then stores it in
 * Supabase Storage using the service role key. Direct browser → Supabase
 * uploads fail with "fetch failed" because Supabase Storage does not allow
 * cross-origin requests from localhost (or custom origins) by default.
 *
 * Field `kind`: "video" | "thumbnail" | "photo"
 * Field `file` (or repeated `files`): one or more binaries.
 * Photos may send multiple files in a single request (up to maxPhotoBatchCount).
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAdmin();

    const { allowed } = rateLimit(`upload:${getClientIp(request)}:${userId}`, {
      limit: 20,
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
      stored.push(await storeUpload(request.nextUrl.origin, checked.bucket, checked.path, file, checked.contentType));
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
  const maxBytes = isVideo
    ? Math.max(uploadConfig.maxVideoSizeMb * 1024 * 1024, VIDEO_STORAGE_MAX_BYTES)
    : (isPhoto ? uploadConfig.maxPhotoSizeMb : uploadConfig.maxThumbnailSizeMb) * 1024 * 1024;
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
  if (file.size > maxBytes) {
    return {
      error: `"${file.name}" is too large. Maximum allowed size is ${Math.round(maxBytes / (1024 * 1024))} MB.`,
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

async function storeUpload(
  origin: string,
  bucket: string,
  path: string,
  file: File,
  contentType: string
): Promise<StoredUpload> {
  const bytes = await file.arrayBuffer();
  const useLocalFirst = file.size > SUPABASE_SAFE_UPLOAD_BYTES;

  if (!useLocalFirst) {
    try {
      const { publicUrl } = await uploadToSupabaseStorage(bucket, path, bytes, contentType);
      return {
        bucket,
        path,
        publicUrl,
        fileSizeBytes: file.size,
        fileName: file.name,
      };
    } catch (error) {
      if (!(error instanceof StorageTooLargeError)) throw error;
    }
  }

  await saveLocalUpload(bucket, path, Buffer.from(bytes));
  return {
    bucket,
    path,
    publicUrl: localPublicUrl(origin, bucket, path),
    fileSizeBytes: file.size,
    fileName: file.name,
  };
}
