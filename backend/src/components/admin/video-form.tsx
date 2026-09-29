"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UploadCloud, X, Loader2, MapPin } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { uploadFileWithProgress, CLIENT_UPLOAD_LIMITS } from "@/lib/upload";
import { captureVideoThumbnailFile } from "@/lib/capture-video-thumbnail";
import { AdminVideoThumbnail } from "@/components/admin/video-thumbnail";
import { isGeneratedPlaceholderThumbnail } from "@/lib/thumbnail";
import { METRO_MANILA_CITIES } from "@/lib/types";
import type { Category, Video, VideoStatus } from "@/lib/types";

interface VideoFormProps {
  mode: "create" | "edit";
  initialVideo?: Video;
}

function readVideoMetadata(file: File): Promise<{ durationSeconds: number | null }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const videoEl = document.createElement("video");
    videoEl.preload = "metadata";
    const done = (durationSeconds: number | null) => {
      URL.revokeObjectURL(url);
      videoEl.removeAttribute("src");
      resolve({ durationSeconds });
    };
    const timer = window.setTimeout(() => done(null), 4000);
    videoEl.onloadedmetadata = () => {
      window.clearTimeout(timer);
      const duration = Number.isFinite(videoEl.duration) ? Math.round(videoEl.duration) : null;
      done(duration);
    };
    videoEl.onerror = () => {
      window.clearTimeout(timer);
      done(null);
    };
    videoEl.src = url;
  });
}

export function VideoForm({ mode, initialVideo }: VideoFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);

  const [title, setTitle] = useState(initialVideo?.title ?? "");
  const [description, setDescription] = useState(initialVideo?.description ?? "");
  const [street, setStreet] = useState(initialVideo?.street ?? "");
  const [barangay, setBarangay] = useState(initialVideo?.barangay ?? "");
  const [city, setCity] = useState(initialVideo?.city ?? "");
  const [province, setProvince] = useState(initialVideo?.province ?? "Metro Manila");
  const [region, setRegion] = useState(initialVideo?.region ?? "NCR");
  const [latitude, setLatitude] = useState(initialVideo?.latitude?.toString() ?? "");
  const [longitude, setLongitude] = useState(initialVideo?.longitude?.toString() ?? "");
  const [recordedDate, setRecordedDate] = useState(
    initialVideo?.recorded_at ? initialVideo.recorded_at.slice(0, 10) : ""
  );
  const [categoryId, setCategoryId] = useState(initialVideo?.category_id ?? "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(initialVideo?.tags ?? []);
  const [status, setStatus] = useState<VideoStatus>(initialVideo?.status ?? "published");

  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const initialThumb =
    initialVideo?.thumbnail_url && !isGeneratedPlaceholderThumbnail(initialVideo.thumbnail_url)
      ? initialVideo.thumbnail_url
      : null;
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(initialThumb);
  const [localVideoObjectUrl, setLocalVideoObjectUrl] = useState<string | null>(null);
  const capturedThumbs = useRef(new WeakMap<File, File>());
  const captureJobs = useRef(new WeakMap<File, Promise<File | null>>());

  function ensureCapturedThumb(file: File): Promise<File | null> {
    const ready = capturedThumbs.current.get(file);
    if (ready) return Promise.resolve(ready);
    const inflight = captureJobs.current.get(file);
    if (inflight) return inflight;
    const job = captureVideoThumbnailFile(file).then((frame) => {
      if (frame) capturedThumbs.current.set(file, frame);
      return frame;
    });
    captureJobs.current.set(file, job);
    return job;
  }

  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const [uploadStage, setUploadStage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Category[]>("/api/categories")
      .then(setCategories)
      .catch(() => toast.error("Failed to load categories."));
  }, []);

  useEffect(() => {
    const file = videoFiles[0];
    if (!file) {
      setLocalVideoObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setLocalVideoObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [videoFiles]);

  useEffect(() => {
    if (thumbnailFile) return;

    const source = videoFiles[0];
    if (!source) {
      if (initialThumb) setThumbnailPreview(initialThumb);
      else setThumbnailPreview(null);
      return;
    }

    let active = true;
    let objectUrl: string | null = null;
    ensureCapturedThumb(source).then((frame) => {
      if (!active) return;
      if (frame) {
        objectUrl = URL.createObjectURL(frame);
        setThumbnailPreview(objectUrl);
      } else {
        setThumbnailPreview(null);
      }
    });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [videoFiles, thumbnailFile, initialThumb]);

  const cityOptions = useMemo(() => METRO_MANILA_CITIES, []);

  function addTag() {
    const value = tagInput.trim();
    if (value && !tags.includes(value)) {
      setTags((t) => [...t, value]);
    }
    setTagInput("");
  }

  function videoMime(file: File): string {
    if (file.type && file.type !== "application/octet-stream") return file.type;
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    return (
      { webm: "video/webm", mp4: "video/mp4", mov: "video/quicktime", mkv: "video/x-matroska" }[ext] ??
      file.type
    );
  }

  function titleFromFileName(fileName: string): string {
    return fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
  }

  function handleThumbnailChange(file: File | null) {
    setThumbnailFile(file);
    if (file) setThumbnailPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (mode === "create" && videoFiles.length === 0) {
      setFormError("Please select at least one video file to upload.");
      return;
    }
    if (mode === "edit" && !title.trim()) {
      setFormError("Title is required.");
      return;
    }
    if (mode === "create" && videoFiles.length === 1 && !title.trim()) {
      setFormError("Title is required.");
      return;
    }

    setSubmitting(true);
    try {
      let sharedThumbnailUrl = initialVideo?.thumbnail_url ?? null;
      let sharedThumbnailStoragePath = initialVideo?.thumbnail_storage_path ?? null;

      if (thumbnailFile) {
        if (thumbnailFile.size > CLIENT_UPLOAD_LIMITS.maxThumbnailMb * 1024 * 1024) {
          throw new Error(`Thumbnail exceeds the ${CLIENT_UPLOAD_LIMITS.maxThumbnailMb} MB limit.`);
        }
        setUploadStage("Uploading thumbnail...");
        const uploadedThumb = await uploadFileWithProgress("thumbnail", thumbnailFile, () => {});
        sharedThumbnailUrl = uploadedThumb.publicUrl;
        sharedThumbnailStoragePath = uploadedThumb.path;
      }

      async function uploadCapturedThumb(source: File) {
        const frame = await ensureCapturedThumb(source);
        if (!frame) return null;
        if (frame.size > CLIENT_UPLOAD_LIMITS.maxThumbnailMb * 1024 * 1024) return null;
        const uploadedThumb = await uploadFileWithProgress("thumbnail", frame, () => {});
        return { url: uploadedThumb.publicUrl, path: uploadedThumb.path };
      }

      const shared = {
        description: description.trim() || null,
        street: street.trim() || null,
        barangay: barangay.trim() || null,
        city: city.trim() || null,
        province: province.trim() || null,
        region: region.trim() || null,
        location: [street, barangay, city].filter(Boolean).join(", ") || null,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        recorded_at: recordedDate ? new Date(`${recordedDate}T00:00:00Z`).toISOString() : null,
        category_id: categoryId || null,
        tags,
        status,
      };

      if (mode === "create") {
        for (let index = 0; index < videoFiles.length; index++) {
          const file = videoFiles[index];
          if (file.size > CLIENT_UPLOAD_LIMITS.maxVideoMb * 1024 * 1024) {
            throw new Error(`"${file.name}" exceeds the ${CLIENT_UPLOAD_LIMITS.maxVideoMb} MB limit.`);
          }
          const mime = videoMime(file);
          if (!mime || !CLIENT_UPLOAD_LIMITS.allowedVideoTypes.includes(mime)) {
            throw new Error(`"${file.name}" is not a supported format. Use MP4, MOV, WebM, or MKV.`);
          }

          setUploadStage(`Uploading ${index + 1} of ${videoFiles.length}: ${file.name}`);
          setUploadPercent(0);
          const thumbJob = thumbnailFile ? Promise.resolve(null) : uploadCapturedThumb(file);
          const [uploaded, meta, captured] = await Promise.all([
            uploadFileWithProgress("video", file, setUploadPercent),
            readVideoMetadata(file),
            thumbJob,
          ]);

          const videoTitle =
            videoFiles.length === 1 ? title.trim() : title.trim() || titleFromFileName(file.name);

          const thumbnailUrl = thumbnailFile ? sharedThumbnailUrl : captured?.url ?? null;
          const thumbnailStoragePath = thumbnailFile
            ? sharedThumbnailStoragePath
            : captured?.path ?? null;

          await apiFetch("/api/videos", {
            method: "POST",
            body: JSON.stringify({
              ...shared,
              title: videoTitle,
              thumbnail_url: thumbnailUrl,
              thumbnail_storage_path: thumbnailStoragePath,
              video_url: uploaded.publicUrl,
              storage_path: uploaded.path,
              duration_seconds: meta.durationSeconds,
              file_size_bytes: uploaded.fileSizeBytes,
            }),
          });
        }
        toast.success(videoFiles.length === 1 ? "Video created." : `${videoFiles.length} videos created.`);
      } else if (initialVideo) {
        let videoUrl = initialVideo.video_url;
        let storagePath = initialVideo.storage_path;
        let durationSeconds = initialVideo.duration_seconds;
        let fileSizeBytes = initialVideo.file_size_bytes;

        const replacement = videoFiles[0];
        if (replacement) {
          if (replacement.size > CLIENT_UPLOAD_LIMITS.maxVideoMb * 1024 * 1024) {
            throw new Error(`Video exceeds the ${CLIENT_UPLOAD_LIMITS.maxVideoMb} MB limit.`);
          }
          const mime = videoMime(replacement);
          if (!mime || !CLIENT_UPLOAD_LIMITS.allowedVideoTypes.includes(mime)) {
            throw new Error("Unsupported video format. Use MP4, MOV, WebM, or MKV.");
          }
          setUploadStage("Uploading replacement video...");
          setUploadPercent(0);
          const thumbJob = thumbnailFile ? Promise.resolve(null) : uploadCapturedThumb(replacement);
          const [uploaded, meta, captured] = await Promise.all([
            uploadFileWithProgress("video", replacement, setUploadPercent),
            readVideoMetadata(replacement),
            thumbJob,
          ]);
          videoUrl = uploaded.publicUrl;
          storagePath = uploaded.path;
          durationSeconds = meta.durationSeconds;
          fileSizeBytes = uploaded.fileSizeBytes;

          if (!thumbnailFile && captured) {
            sharedThumbnailUrl = captured.url;
            sharedThumbnailStoragePath = captured.path;
          }
        }

        setUploadStage("Saving details...");
        setUploadPercent(null);
        await apiFetch(`/api/videos/${initialVideo.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            ...shared,
            thumbnail_url: sharedThumbnailUrl,
            thumbnail_storage_path: sharedThumbnailStoragePath,
            title: title.trim(),
            video_url: videoUrl,
            storage_path: storagePath,
            duration_seconds: durationSeconds,
            file_size_bytes: fileSizeBytes,
          }),
        });
        toast.success("Video updated.");
      }

      router.push("/admin/videos");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong.";
      setFormError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
      setUploadStage(null);
      setUploadPercent(null);
    }
  }

  const isUploading = uploadStage !== null;
  const previewVideoUrl = localVideoObjectUrl ?? initialVideo?.video_url ?? null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-24">
      {formError && (
        <div className="rounded-lg bg-danger/10 p-3 text-sm text-danger">{formError}</div>
      )}

      {/* Files */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-4">
          <label className="mb-2 block text-sm font-medium">
            Video File {mode === "create" && <span className="text-danger">*</span>}
          </label>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted hover:bg-background">
            <UploadCloud className="h-6 w-6" />
            {videoFiles.length > 0
              ? `${videoFiles.length} video${videoFiles.length === 1 ? "" : "s"} selected`
              : mode === "edit"
                ? "Replace video (optional)"
                : "Click to select videos (MP4, MOV, WebM)"}
            <input
              type="file"
              accept="video/mp4,video/quicktime,video/webm,video/x-matroska"
              multiple={mode === "create"}
              className="hidden"
              onChange={(e) => setVideoFiles(Array.from(e.target.files ?? []))}
            />
          </label>
          {videoFiles.length > 0 && (
            <ul className="mt-3 max-h-32 space-y-1 overflow-y-auto text-xs text-muted">
              {videoFiles.map((file) => (
                <li key={file.name} className="flex items-center justify-between gap-2">
                  <span className="truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => setVideoFiles((files) => files.filter((f) => f !== file))}
                    className="text-danger"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-xs text-muted">
            Max {CLIENT_UPLOAD_LIMITS.maxVideoMb} MB (2 GB) each. Files over 40 MB are stored on this server so Supabase's free 50 MB cap does not block them.
            {mode === "create" && " Select several files to upload them together with the same location and status."}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4">
          <label className="mb-2 block text-sm font-medium">Thumbnail</label>
          <label className="relative flex min-h-[10rem] cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted hover:bg-background">
            {thumbnailPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbnailPreview} alt="Thumbnail preview" className="absolute inset-0 h-full w-full object-cover opacity-90" />
            ) : previewVideoUrl && !thumbnailFile ? (
              <AdminVideoThumbnail
                title={title || initialVideo?.title || "Video preview"}
                thumbnailUrl={null}
                videoUrl={previewVideoUrl}
                className="absolute inset-0 h-full w-full overflow-hidden rounded-xl bg-border"
                imageClassName="object-cover opacity-90"
              />
            ) : (
              <>
                <UploadCloud className="h-6 w-6" />
                <span>Click to select a thumbnail (JPEG, PNG, WebP)</span>
              </>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handleThumbnailChange(e.target.files?.[0] ?? null)}
            />
          </label>
          <p className="mt-2 text-xs text-muted">
            Max {CLIENT_UPLOAD_LIMITS.maxThumbnailMb} MB. If omitted, a still frame is captured from each video automatically.
          </p>
        </div>
      </section>

      {isUploading && (
        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            {uploadStage}
            {uploadPercent !== null && <span className="ml-auto text-muted">{uploadPercent}%</span>}
          </div>
          {uploadPercent !== null && (
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-border">
              <div className="h-full bg-primary transition-all" style={{ width: `${uploadPercent}%` }} />
            </div>
          )}
        </div>
      )}

      {/* Basic info */}
      <section className="space-y-4 rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold text-muted">Basic Information</h2>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Title {mode === "edit" || videoFiles.length <= 1 ? "*" : "(optional)"}
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required={mode === "edit" || videoFiles.length <= 1}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/40 focus:ring-2"
            placeholder={
              videoFiles.length > 1
                ? "Leave blank to use each file name as the title"
                : "Walking Along EDSA"
            }
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea
            value={description ?? ""}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/40 focus:ring-2"
            placeholder="Body-camera documentation of street conditions..."
          />
        </div>
      </section>

      {/* Location */}
      <section className="space-y-4 rounded-2xl border border-border bg-surface p-4">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-muted">
          <MapPin className="h-4 w-4" /> Location
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Street</label>
            <input value={street ?? ""} onChange={(e) => setStreet(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/40 focus:ring-2" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Barangay</label>
            <input value={barangay ?? ""} onChange={(e) => setBarangay(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/40 focus:ring-2" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">City</label>
            <select
              value={city ?? ""}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/40 focus:ring-2"
            >
              <option value="">Select city...</option>
              {cityOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Province</label>
            <input value={province ?? ""} onChange={(e) => setProvince(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/40 focus:ring-2" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Region</label>
            <input value={region ?? ""} onChange={(e) => setRegion(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/40 focus:ring-2" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Recorded Date</label>
            <input
              type="date"
              value={recordedDate}
              onChange={(e) => setRecordedDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/40 focus:ring-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Latitude</label>
            <input
              type="number"
              step="any"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="14.5995"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/40 focus:ring-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Longitude</label>
            <input
              type="number"
              step="any"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="120.9842"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/40 focus:ring-2"
            />
          </div>
        </div>
      </section>

      {/* Categorization */}
      <section className="space-y-4 rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold text-muted">Categorization</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/40 focus:ring-2"
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as VideoStatus)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/40 focus:ring-2"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Tags</label>
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background px-2 py-2">
            {tags.map((tag) => (
              <span key={tag} className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">
                {tag}
                <button type="button" onClick={() => setTags((t) => t.filter((x) => x !== tag))}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTag();
                }
              }}
              onBlur={addTag}
              placeholder="Type a tag and press Enter"
              className="min-w-[140px] flex-1 bg-transparent text-sm outline-none"
            />
          </div>
        </div>
      </section>

      <div className="sticky bottom-4 flex justify-end gap-3 rounded-2xl border border-border bg-surface p-4 shadow-lg">
        <button
          type="button"
          onClick={() => router.push("/admin/videos")}
          className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-background"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "create"
            ? videoFiles.length > 1
              ? `Create ${videoFiles.length} Videos`
              : "Create Video"
            : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
