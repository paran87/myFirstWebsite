const VIDEO_EXT_TO_MIME: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  mkv: "video/x-matroska",
};

const IMAGE_EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export function resolveVideoMimeType(fileName: string, reportedType: string): string {
  if (reportedType && reportedType !== "application/octet-stream") return reportedType;
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return VIDEO_EXT_TO_MIME[ext] ?? reportedType ?? "application/octet-stream";
}

export function resolveThumbnailMimeType(fileName: string, reportedType: string): string {
  if (reportedType && reportedType !== "application/octet-stream") return reportedType;
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return IMAGE_EXT_TO_MIME[ext] ?? reportedType ?? "application/octet-stream";
}

export const resolvePhotoMimeType = resolveThumbnailMimeType;
