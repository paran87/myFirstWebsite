"use client";

export interface SignedUploadInfo {
  bucket: string;
  path: string;
  token: string;
  signedUrl: string;
  publicUrl: string;
}

export interface UploadedFile {
  bucket: string;
  path: string;
  publicUrl: string;
  fileSizeBytes: number;
}

/**
 * Uploads a file to the backend (`POST /api/upload`), which stores it in
 * Supabase Storage. Going through the same origin avoids the "fetch failed"
 * error caused by Supabase Storage rejecting cross-origin browser uploads.
 */
export function uploadFileWithProgress(
  kind: "video" | "thumbnail" | "photo",
  file: File,
  onProgress: (percent: number) => void
): Promise<UploadedFile> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload", true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      let body: { error?: string; bucket?: string; path?: string; publicUrl?: string; fileSizeBytes?: number } | null =
        null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        body = null;
      }

      if (xhr.status >= 200 && xhr.status < 300 && body?.publicUrl && body.path) {
        resolve({
          bucket: body.bucket ?? "",
          path: body.path,
          publicUrl: body.publicUrl,
          fileSizeBytes: body.fileSizeBytes ?? file.size,
        });
        return;
      }

      reject(new Error(body?.error || `Upload failed (status ${xhr.status}). Please try again.`));
    };

    xhr.onerror = () =>
      reject(new Error("Network error during upload. Make sure the backend is running at http://localhost:4000."));
    xhr.onabort = () => reject(new Error("Upload cancelled."));

    const form = new FormData();
    form.append("kind", kind);
    form.append("file", file);
    xhr.send(form);
  });
}

/**
 * Uploads one or more photos in a single request so the backend can
 * store the batch without hitting per-file rate limits.
 */
export function uploadPhotoFilesWithProgress(
  files: File[],
  onProgress: (percent: number) => void
): Promise<UploadedFile[]> {
  return new Promise((resolve, reject) => {
    if (files.length === 0) {
      reject(new Error("Please select at least one photo to upload."));
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload", true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      let body: {
        error?: string;
        files?: UploadedFile[];
        bucket?: string;
        path?: string;
        publicUrl?: string;
        fileSizeBytes?: number;
      } | null = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        body = null;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        if (body?.files && body.files.length > 0) {
          resolve(body.files);
          return;
        }
        if (body?.publicUrl && body.path) {
          resolve([
            {
              bucket: body.bucket ?? "",
              path: body.path,
              publicUrl: body.publicUrl,
              fileSizeBytes: body.fileSizeBytes ?? files[0]?.size ?? 0,
            },
          ]);
          return;
        }
      }

      reject(new Error(body?.error || `Upload failed (status ${xhr.status}). Please try again.`));
    };

    xhr.onerror = () =>
      reject(new Error("Network error during upload. Make sure the backend is running at http://localhost:4000."));
    xhr.onabort = () => reject(new Error("Upload cancelled."));

    const form = new FormData();
    form.append("kind", "photo");
    for (const file of files) {
      form.append("file", file);
    }
    xhr.send(form);
  });
}

export const CLIENT_UPLOAD_LIMITS = {
  maxVideoMb: Number(process.env.NEXT_PUBLIC_VIDEO_MAX_FILE_SIZE_MB || 2048),
  maxThumbnailMb: Number(process.env.NEXT_PUBLIC_THUMBNAIL_MAX_FILE_SIZE_MB || 10),
  maxPhotoMb: Number(process.env.NEXT_PUBLIC_PHOTO_MAX_FILE_SIZE_MB || 20),
  maxPhotoBatchCount: Number(process.env.NEXT_PUBLIC_PHOTO_MAX_BATCH_COUNT || 30),
  allowedVideoTypes: ["video/mp4", "video/quicktime", "video/webm", "video/x-matroska"],
  allowedThumbnailTypes: ["image/jpeg", "image/png", "image/webp"],
  allowedPhotoTypes: ["image/jpeg", "image/png", "image/webp"],
};
