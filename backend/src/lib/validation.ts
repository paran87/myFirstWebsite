import { z } from "zod";
import { uploadConfig } from "@/lib/config";
import { LIST_SORTS } from "@/lib/sort";

export const videoStatusSchema = z.enum(["draft", "published", "private", "deleted"]);

export const createVideoSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(200),
  description: z.string().trim().max(5000).optional().nullable(),

  video_url: z.string().trim().url("A valid video URL is required."),
  thumbnail_url: z.string().trim().url().optional().nullable(),
  storage_path: z.string().trim().optional().nullable(),
  thumbnail_storage_path: z.string().trim().optional().nullable(),

  location: z.string().trim().max(255).optional().nullable(),
  street: z.string().trim().max(255).optional().nullable(),
  barangay: z.string().trim().max(255).optional().nullable(),
  city: z.string().trim().max(255).optional().nullable(),
  province: z.string().trim().max(255).optional().nullable(),
  region: z.string().trim().max(255).optional().nullable(),

  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),

  recorded_at: z.string().datetime({ offset: true }).optional().nullable(),
  duration_seconds: z.number().int().min(0).optional().nullable(),
  file_size_bytes: z.number().int().min(0).optional().nullable(),

  category_id: z.string().uuid().optional().nullable(),
  tags: z.array(z.string().trim().min(1).max(50)).max(30).default([]),

  status: videoStatusSchema.default("draft"),
});

export const updateVideoSchema = createVideoSchema.partial();

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100),
  description: z.string().trim().max(1000).optional().nullable(),
  is_active: z.boolean().optional().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createPhotoSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(200),
  description: z.string().trim().max(5000).optional().nullable(),

  image_url: z.string().trim().url("A valid image URL is required."),
  storage_path: z.string().trim().optional().nullable(),

  location: z.string().trim().max(255).optional().nullable(),
  street: z.string().trim().max(255).optional().nullable(),
  barangay: z.string().trim().max(255).optional().nullable(),
  city: z.string().trim().max(255).optional().nullable(),
  province: z.string().trim().max(255).optional().nullable(),
  region: z.string().trim().max(255).optional().nullable(),

  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),

  recorded_at: z.string().datetime({ offset: true }).optional().nullable(),
  file_size_bytes: z.number().int().min(0).optional().nullable(),

  category_id: z.string().uuid().optional().nullable(),
  tags: z.array(z.string().trim().min(1).max(50)).max(30).default([]),

  status: videoStatusSchema.default("draft"),
});

export const updatePhotoSchema = createPhotoSchema.partial();

export const createPhotosBatchSchema = z
  .array(createPhotoSchema)
  .min(1, "At least one photo is required.")
  .max(uploadConfig.maxPhotoBatchCount, `You can upload at most ${uploadConfig.maxPhotoBatchCount} photos at once.`);

export const listPhotosQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
  search: z.string().trim().optional(),
  city: z.string().trim().optional(),
  category: z.string().trim().optional(),
  status: videoStatusSchema.optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  year: z.coerce.number().int().optional(),
  includeDeleted: z.coerce.boolean().optional().default(false),
  sort: z.enum(LIST_SORTS).optional().default("newest"),
});

export const listVideosQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
  search: z.string().trim().optional(),
  city: z.string().trim().optional(),
  category: z.string().trim().optional(),
  status: videoStatusSchema.optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  year: z.coerce.number().int().optional(),
  includeDeleted: z.coerce.boolean().optional().default(false),
  sort: z.enum(LIST_SORTS).optional().default("newest"),
});

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
