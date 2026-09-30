"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Eye, Pencil, Trash2, Search } from "lucide-react";
import { AdminVideoThumbnail } from "@/components/admin/video-thumbnail";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { StatusBadge } from "@/components/ui/status-badge";
import { LayoutToggle } from "@/components/ui/layout-toggle";
import { useCatalogLayout } from "@/lib/catalog-layout";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/states";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SortSelect } from "@/components/admin/sort-select";
import { formatBytes } from "@/lib/format";
import type { ListSort } from "@/lib/sort";
import type { PaginatedResult, Video, VideoStatus } from "@/lib/types";

const STATUS_FILTERS: { label: string; value: VideoStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Published", value: "published" },
  { label: "Draft", value: "draft" },
  { label: "Private", value: "private" },
];

export default function AdminVideosPage() {
  const [result, setResult] = useState<PaginatedResult<Video> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<VideoStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<ListSort>("uploaded_newest");
  const [toDelete, setToDelete] = useState<Video | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [layout, setLayout] = useCatalogLayout();

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
    apiFetch<PaginatedResult<Video>>(`/api/videos?${queryString}`)
      .then(setResult)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [queryString]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/videos/${toDelete.id}`, { method: "DELETE" });
      toast.success("Video moved to Recycle Bin.");
      setToDelete(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete video.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold">Videos</h1>
          <p className="text-sm text-muted">Manage all documented street footage.</p>
        </div>
        <Link
          href="/admin/videos/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add Video
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
            placeholder="Search by title, city, barangay, street..."
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
        <EmptyState title="No videos found." description="Try changing your search or filters, or add a new video." />
      )}

      {!loading && !error && result && result.data.length > 0 && layout === "grid" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {result.data.map((video) => (
              <article key={video.id} className="overflow-hidden rounded-2xl border border-border bg-surface">
                <AdminVideoThumbnail
                  title={video.title}
                  thumbnailUrl={video.thumbnail_url}
                  videoUrl={video.video_url}
                  className="relative aspect-video w-full overflow-hidden bg-border"
                />
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="line-clamp-2 font-semibold">{video.title}</h2>
                    <StatusBadge status={video.status} />
                  </div>
                  <p className="text-sm text-muted">{video.city || video.location || "—"}</p>
                  <p className="text-sm text-muted">
                    {video.recorded_at ? new Date(video.recorded_at).toLocaleDateString() : "—"}
                    {" · "}
                    {video.file_size_bytes ? formatBytes(video.file_size_bytes) : "—"}
                  </p>
                  <div className="flex justify-end gap-1.5">
                    <Link
                      href={`/admin/videos/${video.id}/edit`}
                      title="Edit"
                      className="rounded-md p-2 text-muted hover:bg-border hover:text-primary"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <a
                      href={video.video_url}
                      target="_blank"
                      rel="noreferrer"
                      title="View"
                      className="rounded-md p-2 text-muted hover:bg-border hover:text-primary"
                    >
                      <Eye className="h-4 w-4" />
                    </a>
                    <button
                      onClick={() => setToDelete(video)}
                      title="Delete"
                      className="rounded-md p-2 text-muted hover:bg-border hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-muted">
            <span>
              Page {result.page} of {result.totalPages} &middot; {result.total} videos
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
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-background/50 text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Thumbnail</th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Size</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.data.map((video) => (
                  <tr key={video.id} className="hover:bg-background/50">
                    <td className="px-4 py-3">
                      <AdminVideoThumbnail
                        title={video.title}
                        thumbnailUrl={video.thumbnail_url}
                        videoUrl={video.video_url}
                      />
                    </td>
                    <td className="max-w-[220px] truncate px-4 py-3 font-medium">{video.title}</td>
                    <td className="px-4 py-3 text-muted">{video.city || video.location || "—"}</td>
                    <td className="px-4 py-3 text-muted">
                      {video.recorded_at ? new Date(video.recorded_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">
                      {video.file_size_bytes ? formatBytes(video.file_size_bytes) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={video.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <Link
                          href={`/admin/videos/${video.id}/edit`}
                          title="Edit"
                          className="rounded-md p-2 text-muted hover:bg-border hover:text-primary"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <a
                          href={video.video_url}
                          target="_blank"
                          rel="noreferrer"
                          title="View"
                          className="rounded-md p-2 text-muted hover:bg-border hover:text-primary"
                        >
                          <Eye className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => setToDelete(video)}
                          title="Delete"
                          className="rounded-md p-2 text-muted hover:bg-border hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted">
            <span>
              Page {result.page} of {result.totalPages} &middot; {result.total} videos
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

      <ConfirmDialog
        open={!!toDelete}
        title="Delete this video?"
        description={`"${toDelete?.title}" will be moved to the Recycle Bin and hidden from the public site. You can restore it later.`}
        confirmLabel="Move to Recycle Bin"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
