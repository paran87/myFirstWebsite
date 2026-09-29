/**
 * Shared domain types for the Walk Metro Manila public frontend.
 *
 * NOTE: These mirror `backend/src/lib/types.ts`. Kept as a small,
 * hand-synced duplicate rather than a shared npm package so the two
 * Next.js apps remain independently deployable (see root README,
 * "Why two separate apps instead of a monorepo package").
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

export interface Photo {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  location: string | null;
  street: string | null;
  barangay: string | null;
  city: string | null;
  province: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  recorded_at: string | null;
  uploaded_at?: string;
  category_id: string | null;
  category?: Category | null;
  tags: string[];
  views: number;
  status: VideoStatus;
  created_at: string;
}

export interface Video {
  id: string;
  title: string;
  description: string | null;

  video_url: string;
  thumbnail_url: string | null;

  location: string | null;
  street: string | null;
  barangay: string | null;
  city: string | null;
  province: string | null;
  region: string | null;

  latitude: number | null;
  longitude: number | null;

  recorded_at: string | null;
  uploaded_at?: string;

  duration_seconds: number | null;

  category_id: string | null;
  category?: Category | null;
  tags: string[];

  views: number;
  status: VideoStatus;

  created_at: string;
}

export interface PaginatedResult<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
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
