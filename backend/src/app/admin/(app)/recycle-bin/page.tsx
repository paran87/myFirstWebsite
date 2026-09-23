"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/states";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { PaginatedResult, Video } from "@/lib/types";

export default function RecycleBinPage() {
  const [result, setResult] = useState<PaginatedResult<Video> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toPurge, setToPurge] = useState<Video | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    apiFetch<PaginatedResult<Video>>("/api/videos?includeDeleted=true&limit=50")
      .then(setResult)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function restore(video: Video) {
    setBusyId(video.id);
    try {
      await apiFetch(`/api/videos/${video.id}/restore`, { method: "POST" });
      toast.success(`"${video.title}" restored as a draft.`);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to restore video.");
    } finally {
      setBusyId(null);
    }
  }

  async function purge() {
    if (!toPurge) return;
    setBusyId(toPurge.id);
    try {
      await apiFetch(`/api/videos/${toPurge.id}?permanent=true`, { method: "DELETE" });
      toast.success(`"${toPurge.title}" permanently deleted.`);
      setToPurge(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete video.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Recycle Bin</h1>
        <p className="text-sm text-muted">Deleted videos are hidden from the public site but recoverable here.</p>
      </div>

      {loading && <TableSkeleton />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && result && result.data.length === 0 && (
        <EmptyState title="Recycle bin is empty." description="Deleted videos will appear here." />
      )}

      {!loading && !error && result && result.data.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-background/50 text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Thumbnail</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Deleted At</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {result.data.map((video) => (
                <tr key={video.id} className="hover:bg-background/50">
                  <td className="px-4 py-3">
                    <div className="relative h-12 w-20 overflow-hidden rounded-lg bg-border">
                      {video.thumbnail_url && (
                        <Image src={video.thumbnail_url} alt={video.title} fill className="object-cover" unoptimized />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{video.title}</td>
                  <td className="px-4 py-3 text-muted">
                    {video.deleted_at ? new Date(video.deleted_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => restore(video)}
                        disabled={busyId === video.id}
                        title="Restore"
                        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-primary hover:bg-primary/10 disabled:opacity-50"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Restore
                      </button>
                      <button
                        onClick={() => setToPurge(video)}
                        disabled={busyId === video.id}
                        title="Permanently delete"
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
        title="Permanently delete this video?"
        description={`"${toPurge?.title}" and its storage files will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete Forever"
        loading={busyId === toPurge?.id}
        onConfirm={purge}
        onCancel={() => setToPurge(null)}
      />
    </div>
  );
}
