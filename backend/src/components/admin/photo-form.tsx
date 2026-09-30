"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UploadCloud, X, Loader2, MapPin, LocateFixed, Crosshair } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { uploadFileWithProgress, uploadPhotoFilesWithProgress, CLIENT_UPLOAD_LIMITS } from "@/lib/upload";
import { METRO_MANILA_CITIES } from "@/lib/types";
import type { Category, LatLng, Photo, VideoStatus } from "@/lib/types";
import { PhotoLocationPicker } from "@/components/admin/map";
import { isLatLng, readPhotoGps } from "@/lib/geo";

interface PhotoFormProps {
  mode: "create" | "edit";
  initialPhoto?: Photo;
}

const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

function fileKey(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

function photoMime(file: File): string {
  if (file.type && file.type !== "application/octet-stream") return file.type;
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  return (
    { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" }[ext] ?? file.type
  );
}

export function PhotoForm({ mode, initialPhoto }: PhotoFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);

  const [title, setTitle] = useState(initialPhoto?.title ?? "");
  const [description, setDescription] = useState(initialPhoto?.description ?? "");
  const [street, setStreet] = useState(initialPhoto?.street ?? "");
  const [barangay, setBarangay] = useState(initialPhoto?.barangay ?? "");
  const [city, setCity] = useState(initialPhoto?.city ?? "");
  const [province, setProvince] = useState(initialPhoto?.province ?? "Metro Manila");
  const [region, setRegion] = useState(initialPhoto?.region ?? "NCR");
  const [coords, setCoords] = useState<LatLng | null>(
    initialPhoto && isLatLng(initialPhoto.latitude, initialPhoto.longitude)
      ? [Number(initialPhoto.latitude), Number(initialPhoto.longitude)]
      : null
  );
  // GPS read from each selected file's EXIF: undefined = still reading, null = none.
  const [fileGps, setFileGps] = useState<Record<string, LatLng | null>>({});
  const [readingExisting, setReadingExisting] = useState(false);
  const [recordedDate, setRecordedDate] = useState(
    initialPhoto?.recorded_at ? initialPhoto.recorded_at.slice(0, 10) : ""
  );
  const [categoryId, setCategoryId] = useState(initialPhoto?.category_id ?? "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(initialPhoto?.tags ?? []);
  const [status, setStatus] = useState<VideoStatus>(initialPhoto?.status ?? "published");

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>(
    initialPhoto?.image_url ? [initialPhoto.image_url] : []
  );

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
    if (imageFiles.length === 0) {
      setPreviewUrls(initialPhoto?.image_url ? [initialPhoto.image_url] : []);
      return;
    }
    const urls = imageFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, [imageFiles, initialPhoto]);

  function readGpsFor(files: File[], { replaceCoords = false } = {}) {
    for (const file of files) {
      readPhotoGps(file).then((gps) => {
        setFileGps((current) => ({ ...current, [fileKey(file)]: gps }));
        // The first GPS found fills the pin (it also covers files without GPS).
        if (gps) setCoords((current) => (replaceCoords ? gps : current ?? gps));
      });
    }
  }

  async function readGpsFromExistingPhoto() {
    if (!initialPhoto) return;
    setReadingExisting(true);
    const gps = await readPhotoGps(initialPhoto.image_url);
    setReadingExisting(false);
    if (gps) {
      setCoords(gps);
      toast.success("Location read from the photo's GPS data.");
    } else {
      toast.error("This photo file has no GPS data. Click the map to set the location.");
    }
  }

  function addImageFiles(incoming: File[]) {
    readGpsFor(incoming);
    setImageFiles((current) => {
      const seen = new Set(current.map((file) => `${file.name}:${file.size}:${file.lastModified}`));
      const extra = incoming.filter((file) => !seen.has(`${file.name}:${file.size}:${file.lastModified}`));
      const next = [...current, ...extra];
      if (next.length > CLIENT_UPLOAD_LIMITS.maxPhotoBatchCount) {
        toast.error(`You can upload at most ${CLIENT_UPLOAD_LIMITS.maxPhotoBatchCount} photos at once.`);
        return next.slice(0, CLIENT_UPLOAD_LIMITS.maxPhotoBatchCount);
      }
      return next;
    });
  }

  const cityOptions = useMemo(() => METRO_MANILA_CITIES, []);

  function addTag() {
    const value = tagInput.trim();
    if (value && !tags.includes(value)) setTags((t) => [...t, value]);
    setTagInput("");
  }

  function titleFromFileName(fileName: string): string {
    return fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (mode === "create" && imageFiles.length === 0) {
      setFormError("Please select at least one photo to upload.");
      return;
    }
    if ((mode === "edit" || imageFiles.length === 1) && !title.trim()) {
      setFormError("Title is required.");
      return;
    }

    setSubmitting(true);
    try {
      const shared = {
        description: description.trim() || null,
        street: street.trim() || null,
        barangay: barangay.trim() || null,
        city: city.trim() || null,
        province: province.trim() || null,
        region: region.trim() || null,
        location: [street, barangay, city].filter(Boolean).join(", ") || null,
        latitude: coords ? coords[0] : null,
        longitude: coords ? coords[1] : null,
        recorded_at: recordedDate ? new Date(`${recordedDate}T00:00:00Z`).toISOString() : null,
        category_id: categoryId || null,
        tags,
        status,
      };

      if (mode === "create") {
        if (imageFiles.length > CLIENT_UPLOAD_LIMITS.maxPhotoBatchCount) {
          throw new Error(`You can upload at most ${CLIENT_UPLOAD_LIMITS.maxPhotoBatchCount} photos at once.`);
        }
        for (const file of imageFiles) {
          if (file.size > CLIENT_UPLOAD_LIMITS.maxPhotoMb * 1024 * 1024) {
            throw new Error(`"${file.name}" exceeds the ${CLIENT_UPLOAD_LIMITS.maxPhotoMb} MB limit.`);
          }
          const mime = photoMime(file);
          const allowed = CLIENT_UPLOAD_LIMITS.allowedPhotoTypes ?? ALLOWED_PHOTO_TYPES;
          if (!mime || !allowed.includes(mime)) {
            throw new Error(`"${file.name}" must be JPEG, PNG, or WebP.`);
          }
        }

        setUploadStage(
          imageFiles.length === 1 ? `Uploading ${imageFiles[0].name}` : `Uploading ${imageFiles.length} photos`
        );
        setUploadPercent(0);
        const uploaded = await uploadPhotoFilesWithProgress(imageFiles, setUploadPercent);

        setUploadStage("Saving photo records...");
        setUploadPercent(null);

        const photos = uploaded.map((file, index) => {
          const source = imageFiles[index];
          // Each photo keeps its own GPS; the map pin covers photos without it.
          const gps = (source && fileGps[fileKey(source)]) || coords;
          return {
          ...shared,
          latitude: gps ? gps[0] : null,
          longitude: gps ? gps[1] : null,
          title:
            imageFiles.length === 1
              ? title.trim()
              : title.trim() || titleFromFileName(imageFiles[index]?.name || file.path),
          image_url: file.publicUrl,
          storage_path: file.path,
          file_size_bytes: file.fileSizeBytes,
          };
        });

        await apiFetch("/api/photos", {
          method: "POST",
          body: JSON.stringify({ photos }),
        });
        toast.success(photos.length === 1 ? "Photo created." : `${photos.length} photos created.`);
      } else if (initialPhoto) {
        let imageUrl = initialPhoto.image_url;
        let storagePath = initialPhoto.storage_path;
        let fileSizeBytes = initialPhoto.file_size_bytes;

        const replacement = imageFiles[0];
        if (replacement) {
          if (replacement.size > CLIENT_UPLOAD_LIMITS.maxPhotoMb * 1024 * 1024) {
            throw new Error(`Photo exceeds the ${CLIENT_UPLOAD_LIMITS.maxPhotoMb} MB limit.`);
          }
          const mime = photoMime(replacement);
          const allowed =
            CLIENT_UPLOAD_LIMITS.allowedPhotoTypes ?? ALLOWED_PHOTO_TYPES;
          if (!mime || !allowed.includes(mime)) {
            throw new Error("Replacement file must be JPEG, PNG, or WebP.");
          }
          setUploadStage("Uploading replacement photo...");
          setUploadPercent(0);
          const uploaded = await uploadFileWithProgress("photo", replacement, setUploadPercent);
          imageUrl = uploaded.publicUrl;
          storagePath = uploaded.path;
          fileSizeBytes = uploaded.fileSizeBytes;
        }

        setUploadStage("Saving details...");
        setUploadPercent(null);
        await apiFetch(`/api/photos/${initialPhoto.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            ...shared,
            title: title.trim(),
            image_url: imageUrl,
            storage_path: storagePath,
            file_size_bytes: fileSizeBytes,
          }),
        });
        toast.success("Photo updated.");
      }

      router.push("/admin/photos");
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
  const gpsFoundCount = imageFiles.filter((file) => fileGps[fileKey(file)]).length;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-24">
      {formError && <div className="rounded-lg bg-danger/10 p-3 text-sm text-danger">{formError}</div>}

      <section className="rounded-2xl border border-border bg-surface p-4">
        <label className="mb-2 block text-sm font-medium">
          {mode === "create" ? "Photos" : "Photo"} {mode === "create" && <span className="text-danger">*</span>}
        </label>
        <label className="relative flex min-h-[12rem] cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted hover:bg-background">
          {previewUrls.length === 1 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrls[0]} alt="Preview" className="absolute inset-0 h-full w-full object-cover opacity-90" />
          ) : previewUrls.length > 1 ? (
            <div className="grid w-full grid-cols-3 gap-2 px-4">
              {previewUrls.slice(0, 6).map((url) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={url} src={url} alt="" className="h-20 w-full rounded-lg object-cover" />
              ))}
            </div>
          ) : (
            <>
              <UploadCloud className="h-6 w-6" />
              <span>
                {mode === "edit"
                  ? "Replace photo (optional)"
                  : "Click to select one or more photos (JPEG, PNG, WebP)"}
              </span>
            </>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple={mode === "create"}
            className="hidden"
            onChange={(e) => {
              const incoming = Array.from(e.target.files ?? []);
              if (mode === "edit") {
                setImageFiles(incoming.slice(0, 1));
                readGpsFor(incoming.slice(0, 1), { replaceCoords: true });
              } else addImageFiles(incoming);
              e.target.value = "";
            }}
          />
        </label>
        {imageFiles.length > 0 && (
          <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto text-xs text-muted">
            {imageFiles.map((file) => (
              <li key={fileKey(file)} className="flex items-center justify-between gap-2">
                <span className="truncate">{file.name}</span>
                <span className="ml-auto shrink-0">
                  {fileGps[fileKey(file)] === undefined ? (
                    <span className="text-muted">Reading GPS…</span>
                  ) : fileGps[fileKey(file)] ? (
                    <span className="inline-flex items-center gap-1 text-success">
                      <LocateFixed className="h-3 w-3" /> GPS found
                    </span>
                  ) : (
                    <span className="text-warning">No GPS</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setImageFiles((files) => files.filter((item) => item !== file))}
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
          Max {CLIENT_UPLOAD_LIMITS.maxPhotoMb} MB each
          {mode === "create" ? `, up to ${CLIENT_UPLOAD_LIMITS.maxPhotoBatchCount} files. Same location and status for all.` : "."}
        </p>
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

      <section className="space-y-4 rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold text-muted">Basic Information</h2>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Title {mode === "edit" || imageFiles.length <= 1 ? "*" : "(optional)"}
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required={mode === "edit" || imageFiles.length <= 1}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/40 focus:ring-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea
            value={description ?? ""}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/40 focus:ring-2"
          />
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-surface p-4">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-muted">
          <MapPin className="h-4 w-4" /> Location
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <input value={street ?? ""} onChange={(e) => setStreet(e.target.value)} placeholder="Street" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <input value={barangay ?? ""} onChange={(e) => setBarangay(e.target.value)} placeholder="Barangay" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <select value={city ?? ""} onChange={(e) => setCity(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value="">City...</option>
            {cityOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input type="date" value={recordedDate} onChange={(e) => setRecordedDate(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        </div>

        <div className="space-y-2 border-t border-border pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="flex items-center gap-1.5 text-sm font-medium">
              <Crosshair className="h-4 w-4 text-primary" /> Coordinates
            </h3>
            {mode === "edit" && initialPhoto && imageFiles.length === 0 && (
              <button
                type="button"
                onClick={readGpsFromExistingPhoto}
                disabled={readingExisting}
                className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-border disabled:opacity-50"
              >
                {readingExisting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LocateFixed className="h-3.5 w-3.5" />}
                Read GPS from photo file
              </button>
            )}
          </div>
          <p className="text-xs text-muted">
            {mode === "create" && imageFiles.length > 1
              ? `${gpsFoundCount} of ${imageFiles.length} photos have GPS in the file and will use it (grey pins). The pin you place is used for the rest.`
              : "Read automatically from the photo's GPS when available. Click the map or drag the pin to set or correct it."}
          </p>
          <PhotoLocationPicker
            value={coords}
            onChange={setCoords}
            extras={
              mode === "create" && imageFiles.length > 1
                ? imageFiles.flatMap((file) => {
                    const gps = fileGps[fileKey(file)];
                    return gps ? [{ id: fileKey(file), label: file.name, position: gps }] : [];
                  })
                : []
            }
          />
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-surface p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value as VideoStatus)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="private">Private</option>
          </select>
        </div>
        <div className="flex gap-2">
          <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Add tag" className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <button type="button" onClick={addTag} className="rounded-lg border border-border px-4 py-2 text-sm">
            Add
          </button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs">
                {tag}
                <button type="button" onClick={() => setTags((t) => t.filter((x) => x !== tag))}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-surface/95 p-4 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-3xl justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="rounded-lg border border-border px-4 py-2 text-sm">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">
            {mode === "create"
              ? imageFiles.length > 1
                ? `Create ${imageFiles.length} Photos`
                : "Create Photo"
              : "Save Changes"}
          </button>
        </div>
      </div>
    </form>
  );
}
