export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "Walk Metro Manila",
  adminName: `${process.env.NEXT_PUBLIC_SITE_NAME || "Walk Metro Manila"} Admin`,
};

export const uploadConfig = {
  /** Maximum accepted video file size, in megabytes. Configurable via env. */
  maxVideoSizeMb: Number(process.env.VIDEO_MAX_FILE_SIZE_MB || 2048),
  /** Maximum accepted thumbnail image size, in megabytes. */
  maxThumbnailSizeMb: Number(process.env.THUMBNAIL_MAX_FILE_SIZE_MB || 10),
  allowedVideoMimeTypes: [
    "video/mp4",
    "video/quicktime", // .mov
    "video/webm",
    "video/x-matroska", // .mkv
  ],
  allowedThumbnailMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  maxPhotoSizeMb: Number(process.env.PHOTO_MAX_FILE_SIZE_MB || 20),
  maxPhotoBatchCount: Number(process.env.PHOTO_MAX_BATCH_COUNT || 30),
  allowedPhotoMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  videoBucket: process.env.SUPABASE_VIDEO_BUCKET || "videos",
  thumbnailBucket: process.env.SUPABASE_THUMBNAIL_BUCKET || "thumbnails",
  photoBucket: process.env.SUPABASE_PHOTO_BUCKET || "photos",
  storageProvider: process.env.VIDEO_STORAGE_PROVIDER || "supabase",
  cdnUrl: process.env.VIDEO_CDN_URL || "",
};

export const paginationConfig = {
  defaultLimit: 24,
  maxLimit: 100,
};
