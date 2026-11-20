import "server-only";
import { AwsClient } from "aws4fetch";
import { getMedia, setting } from "@/lib/cf";

/**
 * Cloudflare R2 storage. One bucket (binding `MEDIA`) holds everything,
 * with the old bucket names kept as key prefixes:
 *   videos/<year>/<uuid>.mp4   thumbnails/...   photos/...
 */

export const MEDIA_BUCKETS = ["videos", "thumbnails", "photos"] as const;
export type MediaBucket = (typeof MEDIA_BUCKETS)[number];

export function isMediaBucket(value: string): value is MediaBucket {
  return (MEDIA_BUCKETS as readonly string[]).includes(value);
}

export function objectKey(bucket: string, path: string): string {
  const cleanPath = path.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!isMediaBucket(bucket) || cleanPath.split("/").includes("..")) {
    throw new Error("Invalid storage path.");
  }
  return `${bucket}/${cleanPath}`;
}

/**
 * URL the browser uses to load a stored file: the bucket's public custom
 * domain when R2_PUBLIC_URL is set, otherwise this Worker's /api/files route.
 */
export function publicFileUrl(origin: string, bucket: string, path: string): string {
  const cleanPath = path.replace(/\\/g, "/").replace(/^\/+/, "");
  const base = setting("R2_PUBLIC_URL").replace(/\/+$/, "");
  if (base) return `${base}/${bucket}/${cleanPath}`;
  return `${origin.replace(/\/+$/, "")}/api/files/${bucket}/${cleanPath}`;
}

export async function putObject(bucket: string, path: string, body: Blob | ArrayBuffer, contentType: string) {
  await getMedia().put(objectKey(bucket, path), body, { httpMetadata: { contentType } });
}

export async function deleteObject(bucket: string, path: string | null | undefined) {
  if (!path) return;
  await getMedia().delete(objectKey(bucket, path));
}

/** Direct browser → R2 uploads need S3-compatible credentials. */
export function isPresignConfigured(): boolean {
  return Boolean(
    setting("R2_ACCOUNT_ID") &&
      setting("R2_BUCKET_NAME") &&
      setting("R2_ACCESS_KEY_ID") &&
      setting("R2_SECRET_ACCESS_KEY")
  );
}

/**
 * Presigned PUT URL for one object. The browser uploads straight to R2, so
 * large videos never pass through the Worker (which caps request bodies).
 * The upload must send the same Content-Type that was signed.
 */
export async function presignUpload(
  bucket: string,
  path: string,
  contentType: string,
  expiresInSeconds = 3600
): Promise<string> {
  const client = new AwsClient({
    accessKeyId: setting("R2_ACCESS_KEY_ID"),
    secretAccessKey: setting("R2_SECRET_ACCESS_KEY"),
    service: "s3",
    region: "auto",
  });

  const url = new URL(
    `https://${setting("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com/${setting("R2_BUCKET_NAME")}/${objectKey(bucket, path)}`
  );
  url.searchParams.set("X-Amz-Expires", String(expiresInSeconds));

  const signed = await client.sign(new Request(url, { method: "PUT", headers: { "Content-Type": contentType } }), {
    aws: { signQuery: true },
  });
  return signed.url;
}
