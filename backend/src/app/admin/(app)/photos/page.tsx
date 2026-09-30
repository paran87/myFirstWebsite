"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Eye, Pencil, Trash2, Search, ZoomIn, LocateFixed, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { StatusBadge } from "@/components/ui/status-badge";
import { LayoutToggle } from "@/components/ui/layout-toggle";
import { useCatalogLayout } from "@/lib/catalog-layout";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/states";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SortSelect } from "@/components/admin/sort-select";
import { MediaPreview, type PreviewItem } from "@/components/admin/media-preview";
import { formatBytes } from "@/lib/format";
import type { ListSort } from "@/lib/sort";
import type { PaginatedResult, Photo, VideoStatus } from "@/lib/types";

const STATUS_FILTERS: { label: string; value: VideoStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Published", value: "published" },
  { label: "Draft", value: "draft" },
  { label: "Private", value: "private" },
];

export default function AdminPhotosPage() {
  const [result, setResult] = useState<PaginatedResult<Photo> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<VideoStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<ListSort>("uploaded_newest");
  const [toDelete, setToDelete] = useState<Photo | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [layout, setLayout] = useCatalogLayout();
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [gpsProgress, setGpsProgress] = useState<string | null>(null);

  /** Reads GPS from photo files missing coordinates, batch by batch. */
  async function readGpsFromFiles() {
    const skip: string[] = [];
    let updated = 0;
    let withoutGps = 0;
    let failed = 0;
    setGpsProgress("Reading GPS from photo files…");
    try {
      for (;;) {
        const batch = await apiFetch<{ checked: number; updated: number; noGps: string[]; failed: string[]; remaining: number }>(
          "/api/photos/gps-backfill",
          { method: "POST", body: JSON.stringify({ skip }) }
        );
        updated += batch.updated;
        withoutGps += batch.noGps.length;
        failed += batch.failed.length;
        skip.push(...batch.noGps, ...batch.failed);
        setGpsProgress(`Reading GPS… ${updated} located, ${batch.remaining} left`);
        if (batch.checked === 0 || batch.remaining === 0) break;
      }
      if (updated === 0 && withoutGps === 0 && failed === 0) {
        toast.success("All photos already have coordinates.");
      } else {
        toast.success(
          `Located ${updated} photo${updated === 1 ? "" : "s"}.` +
            (withoutGps ? ` ${withoutGps} have no GPS in the file — set those on the map in Edit.` : "") +
            (failed ? ` ${failed} couldn't be read.` : "")
        );
      }
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't read GPS from photos.");
    } finally {
      setGpsProgress(null);
    }
  }

  const previewItems = useMemo<PreviewItem[]>(
    () =>
      (result?.data ?? []).map((photo) => ({
        id: photo.id,
        kind: "photo",
        title: photo.title,
        src: photo.image_url,
        status: photo.status,
        details: [
          photo.city || photo.location,
          photo.recorded_at ? new Date(photo.recorded_at).toLocaleDateString() : null,
          photo.file_size_bytes ? formatBytes(photo.file_size_bytes) : null,
        ]
          .filter(Boolean)
          .join(" · "),
        editHref: `/admin/photos/${photo.id}/edit`,
      })),
    [result]
  );

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    if (status !== "all") params.set("status", status);
    params.set("sort", sort);
    return params.toString();
  }, [page, search, status, sort]);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    apiFetch<PaginatedResult<Photo>>(`/api/photos?${queryString}`)
      .then(setResult)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [queryString]);

  useEffect(() => {
    load();
  }, [load]);

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/photos/${toDelete.id}`, { method: "DELETE" });
      toast.success("Photo moved to Recycle Bin.");
      setToDelete(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete photo.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold">Photos</h1>
          <p className="text-sm text-muted">Manage street documentation still images.</p>
        </div>
        <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={readGpsFromFiles}
          disabled={gpsProgress !== null}
          title="Read the GPS position stored in each photo file and save it for photos without coordinates"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium hover:bg-border disabled:opacity-60"
        >
          {gpsProgress ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
          {gpsProgress ?? "Read GPS from photos"}
        </button>
        <Link
          href="/admin/photos/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add Photos
        </Link>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Search by title, city, barangay..."
            className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm outline-none ring-primary/40 focus:ring-2"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-surface p-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setPage(1);
                setStatus(f.value);
              }}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition ${
                status === f.value ? "bg-primary text-primary-foreground" : "text-muted hover:bg-border"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <SortSelect
          value={sort}
          onChange={(next) => {
            setPage(1);
            setSort(next);
          }}
        />
        <LayoutToggle layout={layout} onChange={setLayout} />
      </div>

      {loading && <TableSkeleton />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && result && result.data.length === 0 && (
        <EmptyState title="No photos found." description="Try changing filters or add a new photo." />
      )}

      {!loading && !error && result && result.data.length > 0 && layout === "grid" && (
        <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {result.data.map((photo, i) => (
            <article key={photo.id} className="overflow-hidden rounded-2xl border border-border bg-surface">
              <button
                type="button"
                onClick={() => setPreviewIndex(i)}
                className="group relative block aspect-[4/3] w-full bg-border"
                aria-label={`View ${photo.title}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.image_url} alt={photo.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/30">
                  <ZoomIn className="h-8 w-8 text-white opacity-0 drop-shadow transition group-hover:opacity-100" />
                </span>
              </button>
              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="line-clamp-2 font-semibold">{photo.title}</h2>
                  <StatusBadge status={photo.status} />
                </div>
                <p className="flex items-center gap-1 text-sm text-muted">
                  {photo.latitude != null && photo.longitude != null && (
                    <MapPin className="h-3.5 w-3.5 text-primary" aria-label="Has coordinates" />
                  )}
                  {photo.city || photo.location || "—"}
                </p>
                <p className="text-sm text-muted">
                  {photo.recorded_at ? new Date(photo.recorded_at).toLocaleDateString() : "—"}
                  {" · "}
                  {photo.file_size_bytes ? formatBytes(photo.file_size_bytes) : "—"}
                </p>
                <div className="flex justify-end gap-1.5">
                  <Link href={`/admin/photos/${photo.id}/edit`} className="rounded-md p-2 text-muted hover:bg-border hover:text-primary">
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button type="button" onClick={() => setPreviewIndex(i)} title="View" className="rounded-md p-2 text-muted hover:bg-border hover:text-primary">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button onClick={() => setToDelete(photo)} className="rounded-md p-2 text-muted hover:bg-border hover:text-danger">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
          <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-muted">
            <span>
              Page {result.page} of {result.totalPages} &middot; {result.total} photos
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-md border border-border px-3 py-1.5 disabled:opacity-40"
              >
                Prev
              </button>
              <button
                disabled={page >= result.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-md border border-border px-3 py-1.5 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && result && result.data.length > 0 && layout === "list" && (
        <div className="space-y-4">
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-background/50 text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Preview</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Size</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {result.data.map((photo, i) => (
                <tr key={photo.id} className="hover:bg-background/50">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setPreviewIndex(i)}
                      className="group relative block h-12 w-20 overflow-hidden rounded-lg bg-border"
                      aria-label={`View ${photo.title}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.image_url} alt={photo.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
                        <ZoomIn className="h-4 w-4" />
                      </span>
                    </button>
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-3 font-medium">{photo.title}</td>
                  <td className="px-4 py-3 text-muted">
                    <span className="inline-flex items-center gap-1">
                      {photo.latitude != null && photo.longitude != null && (
                        <MapPin className="h-3.5 w-3.5 text-primary" aria-label="Has coordinates" />
                      )}
                      {photo.city || photo.location || "—"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    {photo.recorded_at ? new Date(photo.recorded_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    {photo.file_size_bytes ? formatBytes(photo.file_size_bytes) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={photo.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <Link href={`/admin/photos/${photo.id}/edit`} className="rounded-md p-2 text-muted hover:bg-border hover:text-primary">
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button type="button" onClick={() => setPreviewIndex(i)} title="View" className="rounded-md p-2 text-muted hover:bg-border hover:text-primary">
                    <Eye className="h-4 w-4" />
                  </button>
                      <button onClick={() => setToDelete(photo)} className="rounded-md p-2 text-muted hover:bg-border hover:text-danger">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
          <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-muted">
            <span>
              Page {result.page} of {result.totalPages} &middot; {result.total} photos
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-md border border-border px-3 py-1.5 disabled:opacity-40"
              >
                Prev
              </button>
              <button
                disabled={page >= result.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-md border border-border px-3 py-1.5 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      <MediaPreview
        items={previewItems}
        index={previewIndex !== null && previewIndex < previewItems.length ? previewIndex : null}
        onIndexChange={setPreviewIndex}
        onClose={() => setPreviewIndex(null)}
      />

      <ConfirmDialog
        open={!!toDelete}
        title="Delete this photo?"
        description={`"${toDelete?.title}" will be moved to the Recycle Bin.`}
        confirmLabel="Move to Recycle Bin"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
