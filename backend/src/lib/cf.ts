import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Access to Cloudflare bindings (D1, R2) and settings (vars / secrets).
 * Everything here is server-only; bindings never reach the browser.
 */

function bindings(): Record<string, unknown> {
  return getCloudflareContext().env as unknown as Record<string, unknown>;
}

/** The D1 database (binding `DB`). */
export function getDb(): D1Database {
  const db = bindings().DB as D1Database | undefined;
  if (!db) {
    throw new Error('D1 binding "DB" is missing. Check d1_databases in backend/wrangler.jsonc.');
  }
  return db;
}

/** The R2 bucket that holds videos, thumbnails and photos (binding `MEDIA`). */
export function getMedia(): R2Bucket {
  const bucket = bindings().MEDIA as R2Bucket | undefined;
  if (!bucket) {
    throw new Error('R2 binding "MEDIA" is missing. Check r2_buckets in backend/wrangler.jsonc.');
  }
  return bucket;
}

/**
 * Reads a setting: a Worker var/secret first, then `process.env` (set by
 * `next dev` from .env files and by the Workers runtime for vars).
 * Returns "" when unset so callers can simply test for truthiness.
 */
export function setting(name: string): string {
  let fromBinding: unknown;
  try {
    fromBinding = bindings()[name];
  } catch {
    fromBinding = undefined;
  }
  const value = typeof fromBinding === "string" ? fromBinding : process.env[name];
  return (value ?? "").trim();
}

export function settingList(name: string): string[] {
  return setting(name)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
