"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { getVideos, type VideoListParams } from "@/lib/api";
import { VideoCard } from "@/components/video/video-card";
import { EmptyState, ErrorState, VideoCardSkeleton } from "@/components/ui/states";
import type { PaginatedResult, Video } from "@/lib/types";

interface VideoGridProps {
  initialResult: PaginatedResult<Video>;
  params: VideoListParams;
}

/**
 * Renders the initial (server-fetched) page of videos, then loads
 * additional pages client-side as the user scrolls near the bottom
 * (infinite scroll), falling back to an explicit "Load more" button.
 * Each page is a small, indexed Supabase query
 * (`GET /api/videos?page=n&limit=24`) — we never fetch the whole table.
 */
export function VideoGrid({ initialResult, params }: VideoGridProps) {
  const [videos, setVideos] = useState<Video[]>(initialResult.data);
  const [page, setPage] = useState(initialResult.page);
  const [totalPages, setTotalPages] = useState(initialResult.totalPages);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const hasMore = page < totalPages;

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const next = await getVideos({ ...params, page: page + 1 });
      setVideos((prev) => [...prev, ...next.data]);
      setPage(next.page);
      setTotalPages(next.totalPages);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load more videos.");
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, page, params]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "400px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  if (videos.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <EmptyState />
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
        {loadingMore &&
          Array.from({ length: 4 }).map((_, i) => <VideoCardSkeleton key={`skeleton-${i}`} />)}
      </div>

      {error && (
        <div className="mt-6">
          <ErrorState message={error} onRetry={loadMore} />
        </div>
      )}

      {hasMore && !error && (
        <div ref={sentinelRef} className="mt-6 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-medium hover:bg-border disabled:opacity-60"
          >
            {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
