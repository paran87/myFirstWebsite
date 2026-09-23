/**
 * Shared domain types for the Walk Metro Manila backend/admin app.
 *
 * NOTE: These types intentionally mirror `frontend/src/lib/types.ts`.
 * The two Next.js apps are deployed independently, so instead of a shared
 * npm package (which would couple their release cycles) we keep a small,
 * duplicated set of types in sync by hand. If this project grows, extract
 * these into a published `@walk-metro-manila/shared-types` package.
 */

export type VideoStatus = "draft" | "published" | "private" | "deleted";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: string;
  title: string;
  description: string | null;

  video_url: string;
  thumbnail_url: string | null;
  storage_path: string | null;
  thumbnail_storage_path: string | null;

  location: string | null;
  street: string | null;
  barangay: string | null;
  city: string | null;
  province: string | null;
  region: string | null;

  latitude: number | null;
  longitude: number | null;

  recorded_at: string | null;
  uploaded_at: string;

  duration_seconds: number | null;
  file_size_bytes: number | null;

  category_id: string | null;
  category?: Category | null;
  tags: string[];

  views: number;
  status: VideoStatus;

  created_by: string | null;
  deleted_at: string | null;

  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "editor";
  created_at: string;
  updated_at: string;
}

export interface PaginatedResult<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DashboardStats {
  totalVideos: number;
  totalViews: number;
  totalCategories: number;
  videosThisMonth: number;
  storageUsedBytes: number;
  draftCount: number;
  publishedCount: number;
  deletedCount: number;
}

export const METRO_MANILA_CITIES = [
  "Manila",
  "Quezon City",
  "Caloocan",
  "Pasig",
  "Taguig",
  "Makati",
  "Pasay",
  "Parañaque",
  "Las Piñas",
  "Muntinlupa",
  "Marikina",
  "Mandaluyong",
  "San Juan",
  "Malabon",
  "Navotas",
  "Valenzuela",
  "Pateros",
] as const;

export type MetroManilaCity = (typeof METRO_MANILA_CITIES)[number];
