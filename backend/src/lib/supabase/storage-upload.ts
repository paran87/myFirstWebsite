import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/env";

/** 2 GiB — matches VIDEO_MAX_FILE_SIZE_MB and the videos bucket migration. */
export const VIDEO_STORAGE_MAX_BYTES = 2 * 1024 * 1024 * 1024;

export class StorageTooLargeError extends Error {
  constructor(message = "File exceeds the remote storage size limit.") {
    super(message);
    this.name = "StorageTooLargeError";
  }
}

const raisedBuckets = new Set<string>();

/**
 * Raises the bucket's own file-size cap so it does not sit below the app
 * limit. This cannot exceed the project-wide Storage setting (50 MB on
 * the Free plan; up to 500 GB on Pro).
 */
export async function ensureBucketFileSizeLimit(bucket: string, maxBytes: number): Promise<void> {
  const cacheKey = `${bucket}:${maxBytes}`;
  if (raisedBuckets.has(cacheKey)) return;

  try {
    const admin = createSupabaseAdminClient();
    const { error } = await admin.storage.updateBucket(bucket, {
      public: true,
      fileSizeLimit: maxBytes,
    });
    if (!error) {
      raisedBuckets.add(cacheKey);
    }
  } catch {
    // A lower global Storage limit will reject this update. The upload
    // error below explains how to raise that dashboard setting.
  }
}

/**
 * Uploads bytes to Supabase Storage with a raw fetch instead of the
 * supabase-js client. The client's internal fetch reports only "fetch
 * failed" when the new `sb_secret_` keys are used, hiding the real
 * HTTP error. This surfaces the actual status and response body.
 */
export async function uploadToSupabaseStorage(
  bucket: string,
  path: string,
  bytes: ArrayBuffer,
  contentType: string
): Promise<{ publicUrl: string }> {
  const baseUrl = getSupabaseUrl();
  const serviceKey = getSupabaseServiceRoleKey();

  await ensureBucketFileSizeLimit(bucket, Math.max(bytes.byteLength, VIDEO_STORAGE_MAX_BYTES));

  const response = await fetch(`${baseUrl}/storage/v1/object/${bucket}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      "Content-Type": contentType,
      "x-upsert": "false",
    },
    body: bytes,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    if (response.status === 404 || /bucket.*not.*found/i.test(detail)) {
      throw new Error(
        `Storage bucket "${bucket}" was not found. Run supabase/migrations/0002_storage.sql in the Supabase SQL Editor.`
      );
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        `Supabase rejected the upload (${response.status}). The secret key in SUPABASE_SERVICE_ROLE_KEY may be invalid or rotated. ${detail.slice(0, 200)}`
      );
    }
    if (response.status === 413 || /EntityTooLarge|Payload too large|exceeded the maximum/i.test(detail)) {
      throw new StorageTooLargeError();
    }
    throw new Error(`Storage upload failed (${response.status}): ${detail.slice(0, 300) || response.statusText}`);
  }

  return { publicUrl: `${baseUrl}/storage/v1/object/public/${bucket}/${path}` };
}
