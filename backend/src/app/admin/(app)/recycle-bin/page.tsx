"use client";

import { useCallback, useEffect, useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { AdminVideoThumbnail } from "@/components/admin/video-thumbnail";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/states";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { PaginatedResult, Photo, Video } from "@/lib/types";

type Tab = "videos" | "photos";
type BinItem = (Video | Photo) & { kind: Tab };

export default function RecycleBinPage() {
  const [tab, setTab] = useState<Tab>("videos");
  const [items, setItems] = useState<BinItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toPurge, setToPurge] = useState<BinItem | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const path =
      tab === "videos"
        ? "/api/videos?includeDeleted=true&status=deleted&limit=50"
        : "/api/photos?includeDeleted=true&status=deleted&limit=50";

    apiFetch<PaginatedResult<Video | Photo>>(path)
      .then((result) => setItems(result.data.map((row) => ({ ...row, kind: tab }))))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  async function restore(item: BinItem) {
    setBusyId(item.id);
    try {
      const base = item.kind === "videos" ? "videos" : "photos";
      await apiFetch(`/api/${base}/${item.id}/restore`, { method: "POST" });
      toast.success(`"${item.title}" restored as a draft.`);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to restore item.");
    } finally {
      setBusyId(null);
    }
  }

  async function purge() {
    if (!toPurge) return;
    setBusyId(toPurge.id);
    try {
      const base = toPurge.kind === "videos" ? "videos" : "photos";
      await apiFetch(`/api/${base}/${toPurge.id}?permanent=true`, { method: "DELETE" });
      toast.success(`"${toPurge.title}" permanently deleted.`);
      setToPurge(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete item.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Recycle Bin</h1>
        <p className="text-sm text-muted">Deleted videos and photos can be restored or permanently removed.</p>
      </div>

      <div className="flex gap-1 rounded-lg border border-border bg-surface p-1 w-fit">
        {(["videos", "photos"] as Tab[]).map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize ${
              tab === key ? "bg-primary text-primary-foreground" : "text-muted hover:bg-border"
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      {loading && <TableSkeleton />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && items.length === 0 && (
        <EmptyState title="Recycle bin is empty." description={`Deleted ${tab} will appear here.`} />
      )}

      {!loading && !error && items.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-background/50 text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Preview</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Deleted At</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-background/50">
                  <td className="px-4 py-3">
                    {item.kind === "videos" ? (
                      <AdminVideoThumbnail
                        title={item.title}
                        thumbnailUrl={(item as Video).thumbnail_url}
                        videoUrl={(item as Video).video_url}
                      />
                    ) : (
                      <div className="relative h-12 w-20 overflow-hidden rounded-lg bg-border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={(item as Photo).image_url} alt={item.title} className="h-full w-full object-cover" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{item.title}</td>
                  <td className="px-4 py-3 text-muted">
                    {item.deleted_at ? new Date(item.deleted_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => restore(item)}
                        disabled={busyId === item.id}
                        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-primary hover:bg-primary/10 disabled:opacity-50"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Restore
                      </button>
                      <button
                        onClick={() => setToPurge(item)}
                        disabled={busyId === item.id}
                        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-danger hover:bg-danger/10 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Forever
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
        open={!!toPurge}
        title={`Permanently delete this ${toPurge?.kind === "photos" ? "photo" : "video"}?`}
        description={`"${toPurge?.title}" and its storage files will be permanently removed.`}
        confirmLabel="Delete Forever"
        loading={busyId === toPurge?.id}
        onConfirm={purge}
        onCancel={() => setToPurge(null)}
      />
    </div>
  );
}
