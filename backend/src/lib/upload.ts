"use client";

export interface UploadedFile {
  bucket: string;
  path: string;
  publicUrl: string;
  fileSizeBytes: number;
}

/**
 * Files up to this size go through the Worker (`POST /api/upload`). Bigger
 * videos are PUT straight to R2 with a presigned URL, because a Worker
 * request body is capped at 100 MB.
 */
const WORKER_UPLOAD_MAX_BYTES = 90 * 1024 * 1024;

interface XhrResult {
  status: number;
  body: string;
}

function sendWithProgress(
  method: "POST" | "PUT",
  url: string,
  body: XMLHttpRequestBodyInit,
  headers: Record<string, string>,
  onProgress: (loaded: number, total: number) => void
): Promise<XhrResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    for (const [name, value] of Object.entries(headers)) xhr.setRequestHeader(name, value);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded, event.total);
    };
    xhr.onload = () => resolve({ status: xhr.status, body: xhr.responseText });
    xhr.onerror = () => reject(new Error("Network error during upload. Check your connection and try again."));
    xhr.onabort = () => reject(new Error("Upload cancelled."));
    xhr.send(body);
  });
}

function parseJson<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

interface WorkerUploadBody {
  error?: string;
  bucket?: string;
  path?: string;
  publicUrl?: string;
  fileSizeBytes?: number;
}

/** Uploads one file through the Worker, which stores it in R2. */
async function uploadThroughWorker(
  kind: "video" | "thumbnail" | "photo",
  file: File,
  onProgress: (loaded: number, total: number) => void
): Promise<UploadedFile> {
  const form = new FormData();
  form.append("kind", kind);
  form.append("file", file);

  const { status, body } = await sendWithProgress("POST", "/api/upload", form, {}, onProgress);
  const parsed = parseJson<WorkerUploadBody>(body);

  if (status >= 200 && status < 300 && parsed?.publicUrl && parsed.path) {
    return {
      bucket: parsed.bucket ?? "",
      path: parsed.path,
      publicUrl: parsed.publicUrl,
      fileSizeBytes: parsed.fileSizeBytes ?? file.size,
    };
  }
  throw new Error(parsed?.error || `Upload failed (status ${status}). Please try again.`);
}

interface SignedUploadBody {
  error?: string;
  code?: string;
  bucket?: string;
  path?: string;
  uploadUrl?: string;
  contentType?: string;
  publicUrl?: string;
}

/** Uploads a large video straight to R2 using a presigned PUT URL. */
async function uploadDirectToR2(
  kind: "video" | "thumbnail",
  file: File,
  onProgress: (loaded: number, total: number) => void
): Promise<UploadedFile> {
  const signedResponse = await fetch("/api/upload/signed-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kind,
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      fileSizeBytes: file.size,
    }),
  });
  const signed = (await signedResponse.json().catch(() => null)) as SignedUploadBody | null;

  if (!signedResponse.ok || !signed?.uploadUrl || !signed.path || !signed.publicUrl) {
    if (signedResponse.status === 501) {
      throw new Error(
        `"${file.name}" is too large to upload through the server (limit ${Math.round(
          WORKER_UPLOAD_MAX_BYTES / (1024 * 1024)
        )} MB). Direct R2 uploads are not configured: set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY on the admin Worker.`
      );
    }
    throw new Error(signed?.error || `Could not start the upload (status ${signedResponse.status}).`);
  }

  const { status, body } = await sendWithProgress(
    "PUT",
    signed.uploadUrl,
    file,
    { "Content-Type": signed.contentType || file.type || "application/octet-stream" },
    onProgress
  );
  if (status < 200 || status >= 300) {
    throw new Error(
      `Upload to storage failed (status ${status}). Check the R2 bucket's CORS rule allows PUT from this site. ${body.slice(0, 120)}`
    );
  }

  return {
    bucket: signed.bucket ?? "",
    path: signed.path,
    publicUrl: signed.publicUrl,
    fileSizeBytes: file.size,
  };
}

/**
 * Uploads a video, thumbnail or photo to R2 and reports progress (0–100).
 * Large videos go directly to R2; everything else goes through the Worker.
 */
export async function uploadFileWithProgress(
  kind: "video" | "thumbnail" | "photo",
  file: File,
  onProgress: (percent: number) => void
): Promise<UploadedFile> {
  const report = (loaded: number, total: number) => onProgress(Math.round((loaded / total) * 100));

  if (kind === "video" && file.size > WORKER_UPLOAD_MAX_BYTES) {
    return uploadDirectToR2(kind, file, report);
  }
  return uploadThroughWorker(kind, file, report);
}

/**
 * Uploads several photos one after another (each is its own request, so a
 * batch never exceeds the Worker's request size or memory limits) and reports
 * the combined progress.
 */
export async function uploadPhotoFilesWithProgress(
  files: File[],
  onProgress: (percent: number) => void
): Promise<UploadedFile[]> {
  if (files.length === 0) {
    throw new Error("Please select at least one photo to upload.");
  }

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0) || 1;
  const uploaded: UploadedFile[] = [];
  let finishedBytes = 0;

  for (const file of files) {
    const result = await uploadThroughWorker("photo", file, (loaded, total) => {
      const current = (loaded / total) * file.size;
      onProgress(Math.round(((finishedBytes + current) / totalBytes) * 100));
    });
    uploaded.push(result);
    finishedBytes += file.size;
    onProgress(Math.round((finishedBytes / totalBytes) * 100));
  }

  return uploaded;
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
