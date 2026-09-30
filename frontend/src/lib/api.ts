import { apiBase } from "@/lib/config";
import type { Category, PaginatedResult, Photo, Video } from "@/lib/types";

export type PhotoListParams = VideoListParams;

export interface VideoListParams {
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
  category?: string;
  year?: number;
  dateFrom?: string;
  dateTo?: string;
  sort?: "newest" | "oldest" | "most_viewed";
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

async function request<T>(path: string, revalidateSeconds = 30, tags: string[] = []): Promise<T> {
  const response = await fetch(`${apiBase()}${path}`, {
    // Cached briefly so every page view doesn't hit Supabase. The admin
    // backend calls /api/revalidate with these tags after each change, so
    // edits show up right away instead of when the cache expires.
    next: { revalidate: revalidateSeconds, tags },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error((body && body.error) || `Failed to fetch ${path} (${response.status}).`);
  }

  return response.json() as Promise<T>;
}

export async function getVideos(params: VideoListParams = {}): Promise<PaginatedResult<Video>> {
  const listParams = {
    page: params.page ?? 1,
    limit: params.limit ?? 24,
    search: params.search,
    city: params.city,
    category: params.category,
    year: params.year,
  };

  try {
    const query = buildQuery({
      ...listParams,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      sort: params.sort,
    });
    return await request<PaginatedResult<Video>>(`/videos${query}`, 30, ["videos"]);
  } catch (error) {
    throw error;
  }
}

export async function getVideo(id: string): Promise<Video> {
  return request<Video>(`/videos/${id}`, 30, ["videos", `video:${id}`]);
}

export async function getPhotos(params: PhotoListParams = {}): Promise<PaginatedResult<Photo>> {
  const query = buildQuery({
    page: params.page ?? 1,
    limit: params.limit ?? 24,
    search: params.search,
    city: params.city,
    category: params.category,
    year: params.year,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    sort: params.sort,
  });
  return request<PaginatedResult<Photo>>(`/photos${query}`, 30, ["photos"]);
}

export async function getPhoto(id: string): Promise<Photo> {
  return request<Photo>(`/photos/${id}`, 30, ["photos", `photo:${id}`]);
}

export function getCategories(): Promise<Category[]> {
  return request<Category[]>("/categories", 300, ["categories"]);
}

/** Client-side (browser) call to increment the view counter once per session. */
export async function registerVideoView(videoId: string): Promise<void> {
  try {
    const sessionId = getOrCreateViewSessionId();
    await fetch(`${apiBase()}/videos/${videoId}/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
  } catch {
    // View tracking failures should never break video playback.
  }
}

function getOrCreateViewSessionId(): string {
  const key = "wmm_session_id";
  if (typeof window === "undefined") return "server";
  let id = window.localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(key, id);
  }
  return id;
}
