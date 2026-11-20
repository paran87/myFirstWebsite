import "server-only";
import { getDb } from "@/lib/cf";
import { LIST_SORT_SQL, type ListSort } from "@/lib/sort";
import type { Category, DashboardStats, Photo, Video } from "@/lib/types";

/**
 * D1 (SQLite) data access for videos, photos and categories. Table and
 * column names are interpolated into SQL only from the fixed lists below;
 * every value is a bound parameter.
 */

export type ContentTable = "videos" | "photos";
type Row = Record<string, unknown>;

// Columns the PUBLIC site may see — excludes storage paths and audit fields.
const PUBLIC_COLUMNS: Record<ContentTable, string> = {
  videos:
    "id, title, description, video_url, thumbnail_url, location, street, barangay, city, province, region, latitude, longitude, recorded_at, duration_seconds, category_id, tags, views, status, created_at",
  photos:
    "id, title, description, image_url, location, street, barangay, city, province, region, latitude, longitude, recorded_at, category_id, tags, views, status, created_at",
};

const WRITABLE_COLUMNS: Record<ContentTable, readonly string[]> = {
  videos: [
    "title",
    "description",
    "video_url",
    "thumbnail_url",
    "storage_path",
    "thumbnail_storage_path",
    "location",
    "street",
    "barangay",
    "city",
    "province",
    "region",
    "latitude",
    "longitude",
    "route",
    "recorded_at",
    "duration_seconds",
    "file_size_bytes",
    "category_id",
    "tags",
    "status",
    "deleted_at",
  ],
  photos: [
    "title",
    "description",
    "image_url",
    "storage_path",
    "location",
    "street",
    "barangay",
    "city",
    "province",
    "region",
    "latitude",
    "longitude",
    "recorded_at",
    "file_size_bytes",
    "category_id",
    "tags",
    "status",
    "deleted_at",
  ],
};

const NOW_SQL = "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";

// ---------------------------------------------------------------------
// Row <-> object mapping
// ---------------------------------------------------------------------

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function toIso(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

/** Converts an API value into what D1 stores (JSON text, ISO dates). */
function toDbValue(column: string, value: unknown): unknown {
  if (value === undefined) return undefined;
  if (column === "tags") return JSON.stringify(Array.isArray(value) ? value : []);
  if (column === "route") return value == null ? null : JSON.stringify(value);
  if (column === "recorded_at" || column === "deleted_at") return value == null ? null : toIso(value);
  return value ?? null;
}

function hydrateContent<T>(row: Row): T {
  const out: Row = { ...row };
  if ("tags" in out) out.tags = parseJson<string[]>(out.tags, []);
  if ("route" in out) out.route = out.route == null ? null : parseJson(out.route, null);
  return out as T;
}

function hydrateCategory(row: Row): Category {
  return { ...(row as unknown as Category), is_active: Boolean(row.is_active) };
}

// ---------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------

export function isUniqueViolation(error: unknown): boolean {
  return error instanceof Error && /UNIQUE constraint failed/i.test(error.message);
}

// ---------------------------------------------------------------------
// Full-text search
// ---------------------------------------------------------------------

/**
 * Turns free text into an FTS5 query: every word becomes a quoted prefix
 * term and all words must match (`"edsa"* "manila"*`). Quoting means user
 * input can never inject FTS operators.
 */
export function toFtsQuery(input: string): string {
  const words = input
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .slice(0, 10);
  return words.map((word) => `"${word}"*`).join(" ");
}

// ---------------------------------------------------------------------
// Videos & photos
// ---------------------------------------------------------------------

export interface ContentListQuery {
  page: number;
  limit: number;
  search?: string;
  city?: string;
  category?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  year?: number;
  includeDeleted: boolean;
  sort: ListSort;
}

export async function listContent<T extends Video | Photo>(
  table: ContentTable,
  query: ContentListQuery,
  isAdmin: boolean
): Promise<{ rows: T[]; total: number }> {
  const db = getDb();
  const where: string[] = [];
  const params: unknown[] = [];

  if (isAdmin) {
    where.push(query.includeDeleted ? "deleted_at IS NOT NULL" : "deleted_at IS NULL");
    if (query.status) {
      where.push("status = ?");
      params.push(query.status);
    }
  } else {
    // Public visitors can never bypass this, regardless of query params.
    where.push("status = 'published'", "deleted_at IS NULL");
  }

  if (query.search) {
    const match = toFtsQuery(query.search);
    if (match) {
      const idColumn = table === "videos" ? "video_id" : "photo_id";
      where.push(`id IN (SELECT ${idColumn} FROM ${table}_fts WHERE ${table}_fts MATCH ?)`);
      params.push(match);
    }
  }
  if (query.city) {
    where.push("city = ? COLLATE NOCASE");
    params.push(query.city);
  }
  if (query.category) {
    where.push("category_id = ?");
    params.push(query.category);
  }
  if (query.year) {
    where.push("recorded_at >= ?", "recorded_at < ?");
    params.push(`${query.year}-01-01T00:00:00.000Z`, `${query.year + 1}-01-01T00:00:00.000Z`);
  }
  if (query.dateFrom) {
    where.push("recorded_at >= ?");
    params.push(toIso(query.dateFrom) ?? query.dateFrom);
  }
  if (query.dateTo) {
    where.push("recorded_at <= ?");
    params.push(toIso(query.dateTo) ?? query.dateTo);
  }

  const columns = isAdmin ? "*" : PUBLIC_COLUMNS[table];
  const clause = `FROM ${table} WHERE ${where.join(" AND ")}`;
  const offset = (query.page - 1) * query.limit;

  const [countResult, listResult] = await db.batch([
    db.prepare(`SELECT COUNT(*) AS total ${clause}`).bind(...params),
    db
      .prepare(`SELECT ${columns} ${clause} ORDER BY ${LIST_SORT_SQL[query.sort]}, id ASC LIMIT ? OFFSET ?`)
      .bind(...params, query.limit, offset),
  ]);

  const total = Number((countResult.results[0] as Row | undefined)?.total ?? 0);
  return { rows: (listResult.results as Row[]).map((row) => hydrateContent<T>(row)), total };
}

export async function getContent<T extends Video | Photo>(
  table: ContentTable,
  id: string,
  isAdmin: boolean
): Promise<T | null> {
  const db = getDb();
  const filter = isAdmin ? "" : " AND status = 'published' AND deleted_at IS NULL";
  const row = await db.prepare(`SELECT * FROM ${table} WHERE id = ?${filter}`).bind(id).first<Row>();
  if (!row) return null;

  const item = hydrateContent<T>(row);
  if (row.category_id) {
    // Anonymous visitors only ever see active categories.
    const categoryFilter = isAdmin ? "" : " AND is_active = 1";
    const category = await db
      .prepare(`SELECT * FROM categories WHERE id = ?${categoryFilter}`)
      .bind(row.category_id)
      .first<Row>();
    item.category = category ? hydrateCategory(category) : null;
  } else {
    item.category = null;
  }
  return item;
}

function insertStatement(table: ContentTable, data: Row, createdBy: string | null) {
  const db = getDb();
  const columns = ["id", "created_by"];
  const values: unknown[] = [crypto.randomUUID(), createdBy];

  for (const column of WRITABLE_COLUMNS[table]) {
    const value = toDbValue(column, data[column]);
    if (value === undefined) continue;
    columns.push(column);
    values.push(value);
  }

  const placeholders = columns.map(() => "?").join(", ");
  return db.prepare(`INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders}) RETURNING *`).bind(...values);
}

export async function insertContent<T extends Video | Photo>(
  table: ContentTable,
  data: object,
  createdBy: string | null
): Promise<T> {
  const row = await insertStatement(table, data as Row, createdBy).first<Row>();
  if (!row) throw new Error(`Could not create ${table.slice(0, -1)}.`);
  return hydrateContent<T>(row);
}

/** Inserts several rows atomically (D1 batches run in one transaction). */
export async function insertContentBatch<T extends Video | Photo>(
  table: ContentTable,
  items: object[],
  createdBy: string | null
): Promise<T[]> {
  const results = await getDb().batch(items.map((item) => insertStatement(table, item as Row, createdBy)));
  return results.flatMap((result) => (result.results as Row[]).map((row) => hydrateContent<T>(row)));
}

export async function updateContent<T extends Video | Photo>(
  table: ContentTable,
  id: string,
  patch: object
): Promise<T | null> {
  const sets: string[] = [];
  const values: unknown[] = [];

  for (const column of WRITABLE_COLUMNS[table]) {
    const value = toDbValue(column, (patch as Row)[column]);
    if (value === undefined) continue;
    sets.push(`${column} = ?`);
    values.push(value);
  }
  sets.push(`updated_at = ${NOW_SQL}`);

  const row = await getDb()
    .prepare(`UPDATE ${table} SET ${sets.join(", ")} WHERE id = ? RETURNING *`)
    .bind(...values, id)
    .first<Row>();
  return row ? hydrateContent<T>(row) : null;
}

/** Moves an item to the recycle bin. Returns false if it does not exist. */
export async function softDeleteContent(table: ContentTable, id: string): Promise<boolean> {
  const row = await updateContent(table, id, { deleted_at: new Date().toISOString(), status: "deleted" });
  return row !== null;
}

/** Brings an item back from the recycle bin as a draft. */
export async function restoreContent(table: ContentTable, id: string): Promise<boolean> {
  const row = await updateContent(table, id, { deleted_at: null, status: "draft" });
  return row !== null;
}

/** Deletes the row and returns its storage paths so the caller can remove the files. */
export async function hardDeleteContent(table: ContentTable, id: string): Promise<Row | null> {
  const db = getDb();
  const columns = table === "videos" ? "storage_path, thumbnail_storage_path" : "storage_path";
  const existing = await db.prepare(`SELECT ${columns} FROM ${table} WHERE id = ?`).bind(id).first<Row>();
  if (!existing) return null;
  await db.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run();
  return existing;
}

// ---------------------------------------------------------------------
// Video views
// ---------------------------------------------------------------------

/**
 * Counts a view once per (video, viewer). Returns the new total, or null if
 * the video does not exist / is not published.
 */
export async function recordVideoView(videoId: string, viewerKey: string): Promise<number | null> {
  const db = getDb();
  const video = await db
    .prepare("SELECT views FROM videos WHERE id = ? AND status = 'published' AND deleted_at IS NULL")
    .bind(videoId)
    .first<{ views: number }>();
  if (!video) return null;

  const inserted = await db
    .prepare("INSERT OR IGNORE INTO video_views (video_id, viewer_key) VALUES (?, ?)")
    .bind(videoId, viewerKey)
    .run();
  if (!inserted.meta.changes) return Number(video.views);

  const updated = await db
    .prepare("UPDATE videos SET views = views + 1 WHERE id = ? RETURNING views")
    .bind(videoId)
    .first<{ views: number }>();
  return Number(updated?.views ?? video.views);
}

// ---------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------

export async function listCategories(includeInactive: boolean): Promise<Category[]> {
  const filter = includeInactive ? "" : " WHERE is_active = 1";
  const { results } = await getDb().prepare(`SELECT * FROM categories${filter} ORDER BY name ASC`).all<Row>();
  return results.map(hydrateCategory);
}

export async function insertCategory(data: {
  name: string;
  slug: string;
  description?: string | null;
  is_active?: boolean;
}): Promise<Category> {
  const row = await getDb()
    .prepare("INSERT INTO categories (id, name, slug, description, is_active) VALUES (?, ?, ?, ?, ?) RETURNING *")
    .bind(crypto.randomUUID(), data.name, data.slug, data.description ?? null, data.is_active === false ? 0 : 1)
    .first<Row>();
  if (!row) throw new Error("Could not create category.");
  return hydrateCategory(row);
}

export async function updateCategory(
  id: string,
  patch: { name?: string; slug?: string; description?: string | null; is_active?: boolean }
): Promise<Category | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  if (patch.name !== undefined) {
    sets.push("name = ?");
    values.push(patch.name);
  }
  if (patch.slug !== undefined) {
    sets.push("slug = ?");
    values.push(patch.slug);
  }
  if (patch.description !== undefined) {
    sets.push("description = ?");
    values.push(patch.description);
  }
  if (patch.is_active !== undefined) {
    sets.push("is_active = ?");
    values.push(patch.is_active ? 1 : 0);
  }
  sets.push(`updated_at = ${NOW_SQL}`);

  const row = await getDb()
    .prepare(`UPDATE categories SET ${sets.join(", ")} WHERE id = ? RETURNING *`)
    .bind(...values, id)
    .first<Row>();
  return row ? hydrateCategory(row) : null;
}

export async function deleteCategory(id: string): Promise<void> {
  // Items keep existing: their category_id is set to NULL by the foreign key.
  await getDb().prepare("DELETE FROM categories WHERE id = ?").bind(id).run();
}

// ---------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------

export async function getDashboardStats(): Promise<DashboardStats> {
  const db = getDb();
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const [videos, categories] = await db.batch([
    db
      .prepare(
        `SELECT
           COALESCE(SUM(deleted_at IS NULL), 0) AS total,
           COALESCE(SUM(deleted_at IS NULL AND status = 'draft'), 0) AS drafts,
           COALESCE(SUM(deleted_at IS NULL AND status = 'published'), 0) AS published,
           COALESCE(SUM(deleted_at IS NOT NULL), 0) AS deleted,
           COALESCE(SUM(deleted_at IS NULL AND created_at >= ?), 0) AS this_month,
           COALESCE(SUM(CASE WHEN deleted_at IS NULL THEN views END), 0) AS views,
           COALESCE(SUM(CASE WHEN deleted_at IS NULL THEN file_size_bytes END), 0) AS bytes
         FROM videos`
      )
      .bind(startOfMonth.toISOString()),
    db.prepare("SELECT COUNT(*) AS total FROM categories"),
  ]);

  const v = (videos.results[0] ?? {}) as Row;
  const c = (categories.results[0] ?? {}) as Row;
  return {
    totalVideos: Number(v.total ?? 0),
    totalViews: Number(v.views ?? 0),
    totalCategories: Number(c.total ?? 0),
    videosThisMonth: Number(v.this_month ?? 0),
    storageUsedBytes: Number(v.bytes ?? 0),
    draftCount: Number(v.drafts ?? 0),
    publishedCount: Number(v.published ?? 0),
    deletedCount: Number(v.deleted ?? 0),
  };
}

// ---------------------------------------------------------------------
// Photo GPS backfill
// ---------------------------------------------------------------------

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function listPhotosMissingGps(
  limit: number,
  skipIds: string[]
): Promise<{ rows: { id: string; image_url: string }[]; total: number }> {
  const db = getDb();
  // D1 allows at most 100 bound parameters per statement and the skip list can
  // be longer, so validated UUIDs are inlined instead of bound.
  const skip = skipIds.filter((id) => UUID_PATTERN.test(id));
  const skipClause = skip.length ? ` AND id NOT IN (${skip.map((id) => `'${id}'`).join(",")})` : "";
  const where = `deleted_at IS NULL AND (latitude IS NULL OR longitude IS NULL)${skipClause}`;

  const [countResult, listResult] = await db.batch([
    db.prepare(`SELECT COUNT(*) AS total FROM photos WHERE ${where}`),
    db.prepare(`SELECT id, image_url FROM photos WHERE ${where} ORDER BY created_at DESC LIMIT ?`).bind(limit),
  ]);

  return {
    rows: listResult.results as { id: string; image_url: string }[],
    total: Number((countResult.results[0] as Row | undefined)?.total ?? 0),
  };
}

export async function setPhotoGps(id: string, latitude: number, longitude: number): Promise<void> {
  await getDb()
    .prepare(`UPDATE photos SET latitude = ?, longitude = ?, updated_at = ${NOW_SQL} WHERE id = ?`)
    .bind(latitude, longitude, id)
    .run();
}
