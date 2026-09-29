"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Eye, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { StatusBadge } from "@/components/ui/status-badge";
import { LayoutToggle } from "@/components/ui/layout-toggle";
import { useCatalogLayout } from "@/lib/catalog-layout";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/states";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
  const [toDelete, setToDelete] = useState<Photo | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [layout, setLayout] = useCatalogLayout();

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    if (status !== "all") params.set("status", status);
    return params.toString();
  }, [page, search, status]);

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
        <Link
          href="/admin/photos/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add Photos
        </Link>
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
        <LayoutToggle layout={layout} onChange={setLayout} />
      </div>

      {loading && <TableSkeleton />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && result && result.data.length === 0 && (
        <EmptyState title="No photos found." description="Try changing filters or add a new photo." />
      )}

      {!loading && !error && result && result.data.length > 0 && layout === "grid" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {result.data.map((photo) => (
            <article key={photo.id} className="overflow-hidden rounded-2xl border border-border bg-surface">
              <div className="relative aspect-[4/3] bg-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.image_url} alt={photo.title} className="absolute inset-0 h-full w-full object-cover" />
              </div>
              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="line-clamp-2 font-semibold">{photo.title}</h2>
                  <StatusBadge status={photo.status} />
                </div>
                <p className="text-sm text-muted">{photo.city || photo.location || "—"}</p>
                <div className="flex justify-end gap-1.5">
                  <Link href={`/admin/photos/${photo.id}/edit`} className="rounded-md p-2 text-muted hover:bg-border hover:text-primary">
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <a href={photo.image_url} target="_blank" rel="noreferrer" className="rounded-md p-2 text-muted hover:bg-border hover:text-primary">
                    <Eye className="h-4 w-4" />
                  </a>
                  <button onClick={() => setToDelete(photo)} className="rounded-md p-2 text-muted hover:bg-border hover:text-danger">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && !error && result && result.data.length > 0 && layout === "list" && (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-background/50 text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Preview</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {result.data.map((photo) => (
                <tr key={photo.id} className="hover:bg-background/50">
                  <td className="px-4 py-3">
                    <div className="relative h-12 w-20 overflow-hidden rounded-lg bg-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.image_url} alt={photo.title} className="absolute inset-0 h-full w-full object-cover" />
                    </div>
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-3 font-medium">{photo.title}</td>
                  <td className="px-4 py-3 text-muted">{photo.city || photo.location || "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={photo.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <Link href={`/admin/photos/${photo.id}/edit`} className="rounded-md p-2 text-muted hover:bg-border hover:text-primary">
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <a href={photo.image_url} target="_blank" rel="noreferrer" className="rounded-md p-2 text-muted hover:bg-border hover:text-primary">
                        <Eye className="h-4 w-4" />
                      </a>
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
      )}

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
