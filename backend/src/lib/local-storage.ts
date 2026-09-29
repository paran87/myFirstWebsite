import { createReadStream } from "node:fs";
import { mkdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const STORAGE_ROOT = path.resolve(process.cwd(), "storage");
const ALLOWED_BUCKETS = new Set(["videos", "thumbnails", "photos"]);

/** Files above this size skip Supabase and go to local disk (Free plan cap is 50 MB). */
export const SUPABASE_SAFE_UPLOAD_BYTES = 40 * 1024 * 1024;

export function resolveLocalObjectPath(bucket: string, objectPath: string): string {
  if (!ALLOWED_BUCKETS.has(bucket)) {
    throw new Error(`Unsupported storage bucket "${bucket}".`);
  }

  const normalized = path.normalize(objectPath).replace(/^[/\\]+/, "");
  if (normalized.split(path.sep).includes("..")) {
    throw new Error("Invalid storage path.");
  }

  const fullPath = path.join(STORAGE_ROOT, bucket, normalized);
  const bucketRoot = path.join(STORAGE_ROOT, bucket);
  if (!fullPath.startsWith(bucketRoot + path.sep) && fullPath !== bucketRoot) {
    throw new Error("Invalid storage path.");
  }

  return fullPath;
}

export async function saveLocalUpload(bucket: string, objectPath: string, bytes: Buffer): Promise<void> {
  const fullPath = resolveLocalObjectPath(bucket, objectPath);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, bytes);
}

export async function removeLocalUpload(bucket: string, objectPath: string): Promise<void> {
  try {
    await unlink(resolveLocalObjectPath(bucket, objectPath));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

export async function statLocalUpload(bucket: string, objectPath: string) {
  return stat(resolveLocalObjectPath(bucket, objectPath));
}

export function openLocalUploadStream(bucket: string, objectPath: string, options?: { start?: number; end?: number }) {
  return createReadStream(resolveLocalObjectPath(bucket, objectPath), options);
}

export function localPublicUrl(origin: string, bucket: string, objectPath: string): string {
  const cleanPath = objectPath.replace(/\\/g, "/").replace(/^\/+/, "");
  return `${origin.replace(/\/$/, "")}/api/files/${bucket}/${cleanPath}`;
}

export function isLocalStoragePath(publicUrl: string | null | undefined): boolean {
  return Boolean(publicUrl?.includes("/api/files/"));
}
