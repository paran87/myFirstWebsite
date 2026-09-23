"use client";

export interface SignedUploadInfo {
  bucket: string;
  path: string;
  token: string;
  signedUrl: string;
  publicUrl: string;
}

export async function requestSignedUploadUrl(
  kind: "video" | "thumbnail",
  file: File
): Promise<SignedUploadInfo> {
  const response = await fetch("/api/upload/signed-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kind,
      fileName: file.name,
      contentType: file.type,
      fileSizeBytes: file.size,
    }),
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error((body && body.error) || "Failed to prepare upload.");
  }
  return body as SignedUploadInfo;
}

/**
 * Uploads a file directly to a Supabase Storage signed upload URL using
 * raw XHR (instead of the high-level `storage-js` helper) so we can
 * report real upload progress — required for large body-camera videos.
 * The bytes go straight from the browser to Supabase's object storage;
 * this app's server never sees the file body.
 */
export function uploadFileWithProgress(
  signedUrl: string,
  file: File,
  onProgress: (percent: number) => void,
  signal?: AbortSignal
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signedUrl, true);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.setRequestHeader("Cache-Control", "3600");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed (status ${xhr.status}). Please try again.`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload. Please try again."));
    xhr.onabort = () => reject(new Error("Upload cancelled."));

    if (signal) {
      signal.addEventListener("abort", () => xhr.abort());
    }

    xhr.send(file);
  });
}

export const CLIENT_UPLOAD_LIMITS = {
  maxVideoMb: Number(process.env.NEXT_PUBLIC_VIDEO_MAX_FILE_SIZE_MB || 2048),
  maxThumbnailMb: Number(process.env.NEXT_PUBLIC_THUMBNAIL_MAX_FILE_SIZE_MB || 10),
  allowedVideoTypes: ["video/mp4", "video/quicktime", "video/webm", "video/x-matroska"],
  allowedThumbnailTypes: ["image/jpeg", "image/png", "image/webp"],
};
