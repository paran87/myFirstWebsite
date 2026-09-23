"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UploadCloud, X, Loader2, MapPin } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import {
  requestSignedUploadUrl,
  uploadFileWithProgress,
  CLIENT_UPLOAD_LIMITS,
} from "@/lib/upload";
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
    videoEl.onloadedmetadata = () => {
      const duration = Number.isFinite(videoEl.duration) ? Math.round(videoEl.duration) : null;
      URL.revokeObjectURL(url);
      resolve({ durationSeconds: duration });
    };
    videoEl.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ durationSeconds: null });
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
  const [status, setStatus] = useState<VideoStatus>(initialVideo?.status ?? "draft");

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(initialVideo?.thumbnail_url ?? null);

  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const [uploadStage, setUploadStage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Category[]>("/api/categories")
      .then(setCategories)
      .catch(() => toast.error("Failed to load categories."));
  }, []);

  const cityOptions = useMemo(() => METRO_MANILA_CITIES, []);

  function addTag() {
    const value = tagInput.trim();
    if (value && !tags.includes(value)) {
      setTags((t) => [...t, value]);
    }
    setTagInput("");
  }

  function handleThumbnailChange(file: File | null) {
    setThumbnailFile(file);
    if (file) setThumbnailPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (mode === "create" && !videoFile) {
      setFormError("Please select a video file to upload.");
      return;
    }
    if (!title.trim()) {
      setFormError("Title is required.");
      return;
    }

    setSubmitting(true);
    try {
      let videoUrl = initialVideo?.video_url ?? "";
      let storagePath = initialVideo?.storage_path ?? null;
      let thumbnailUrl = initialVideo?.thumbnail_url ?? null;
      let thumbnailStoragePath = initialVideo?.thumbnail_storage_path ?? null;
      let durationSeconds = initialVideo?.duration_seconds ?? null;
      let fileSizeBytes = initialVideo?.file_size_bytes ?? null;

      if (videoFile) {
        if (videoFile.size > CLIENT_UPLOAD_LIMITS.maxVideoMb * 1024 * 1024) {
          throw new Error(`Video exceeds the ${CLIENT_UPLOAD_LIMITS.maxVideoMb} MB limit.`);
        }
        if (!CLIENT_UPLOAD_LIMITS.allowedVideoTypes.includes(videoFile.type)) {
          throw new Error("Unsupported video format. Use MP4, MOV, WebM, or MKV.");
        }

        setUploadStage("Preparing upload...");
        const signed = await requestSignedUploadUrl("video", videoFile);

        setUploadStage("Uploading video...");
        setUploadPercent(0);
        await uploadFileWithProgress(signed.signedUrl, videoFile, setUploadPercent);

        const meta = await readVideoMetadata(videoFile);
        durationSeconds = meta.durationSeconds;
        fileSizeBytes = videoFile.size;
        videoUrl = signed.publicUrl;
        storagePath = signed.path;
      }

      if (thumbnailFile) {
        if (thumbnailFile.size > CLIENT_UPLOAD_LIMITS.maxThumbnailMb * 1024 * 1024) {
          throw new Error(`Thumbnail exceeds the ${CLIENT_UPLOAD_LIMITS.maxThumbnailMb} MB limit.`);
        }
        setUploadStage("Uploading thumbnail...");
        const signedThumb = await requestSignedUploadUrl("thumbnail", thumbnailFile);
        await uploadFileWithProgress(signedThumb.signedUrl, thumbnailFile, () => {});
        thumbnailUrl = signedThumb.publicUrl;
        thumbnailStoragePath = signedThumb.path;
      }

      setUploadStage("Saving details...");
      setUploadPercent(null);

      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        storage_path: storagePath,
        thumbnail_storage_path: thumbnailStoragePath,
        street: street.trim() || null,
        barangay: barangay.trim() || null,
        city: city.trim() || null,
        province: province.trim() || null,
        region: region.trim() || null,
        location: [street, barangay, city].filter(Boolean).join(", ") || null,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        recorded_at: recordedDate ? new Date(`${recordedDate}T00:00:00Z`).toISOString() : null,
        duration_seconds: durationSeconds,
        file_size_bytes: fileSizeBytes,
        category_id: categoryId || null,
        tags,
        status,
      };

      if (mode === "create") {
        await apiFetch("/api/videos", { method: "POST", body: JSON.stringify(payload) });
        toast.success("Video created.");
      } else if (initialVideo) {
        await apiFetch(`/api/videos/${initialVideo.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
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
            {videoFile ? videoFile.name : mode === "edit" ? "Replace video (optional)" : "Click to select a video (MP4, MOV, WebM)"}
            <input
              type="file"
              accept="video/mp4,video/quicktime,video/webm,video/x-matroska"
              className="hidden"
              onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <p className="mt-2 text-xs text-muted">Max {CLIENT_UPLOAD_LIMITS.maxVideoMb} MB.</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4">
          <label className="mb-2 block text-sm font-medium">Thumbnail</label>
          <label className="relative flex cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted hover:bg-background">
            {thumbnailPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbnailPreview} alt="Thumbnail preview" className="absolute inset-0 h-full w-full object-cover opacity-90" />
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
          <p className="mt-2 text-xs text-muted">Max {CLIENT_UPLOAD_LIMITS.maxThumbnailMb} MB. If omitted, no thumbnail is shown.</p>
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
          <label className="mb-1 block text-sm font-medium">Title *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/40 focus:ring-2"
            placeholder="Walking Along EDSA"
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
          {mode === "create" ? "Create Video" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
