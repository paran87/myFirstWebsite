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
  /** R2 key prefixes (all three live in the one `MEDIA` bucket). */
  videoBucket: "videos",
  thumbnailBucket: "thumbnails",
  photoBucket: "photos",
  /**
   * Largest file the admin can send THROUGH the Worker (`POST /api/upload`).
   * Workers cap request bodies at 100 MB, so bigger videos must go straight
   * to R2 with a presigned URL (see `POST /api/upload/signed-url`).
   */
  proxyUploadMaxBytes: 95 * 1024 * 1024,
};

export const paginationConfig = {
  defaultLimit: 24,
  maxLimit: 100,
};
