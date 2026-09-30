"use client";

import { useCallback, useEffect, useState } from "react";
import { Video, Eye, FolderTree, CalendarPlus, HardDrive, FileClock } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { ErrorState } from "@/components/ui/states";
import { apiFetch } from "@/lib/api-client";
import { formatBytes } from "@/lib/format";
import type { DashboardStats } from "@/lib/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    apiFetch<DashboardStats>("/api/admin/stats")
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Initial data fetch on mount. `load` intentionally sets loading/error
    // state so it can also be reused as the "Try Again" retry handler.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted">Overview of your video documentation library.</p>
      </div>

      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
      )}

      {!loading && error && <ErrorState message={error} onRetry={load} />}

      {!loading && stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Videos" value={stats.totalVideos.toLocaleString()} icon={Video} hint={`${stats.publishedCount} published`} />
          <StatCard label="Total Views" value={stats.totalViews.toLocaleString()} icon={Eye} />
          <StatCard label="Total Categories" value={stats.totalCategories.toLocaleString()} icon={FolderTree} />
          <StatCard label="Uploaded This Month" value={stats.videosThisMonth.toLocaleString()} icon={CalendarPlus} />
          <StatCard label="Storage Used" value={formatBytes(stats.storageUsedBytes)} icon={HardDrive} />
          <StatCard label="Drafts" value={stats.draftCount.toLocaleString()} icon={FileClock} hint="Not yet published" />
        </div>
      )}
    </div>
  );
}
