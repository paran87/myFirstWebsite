"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { getPhotos, type PhotoListParams } from "@/lib/api";
import { PhotoCard } from "@/components/photo/photo-card";
import { LayoutToggle } from "@/components/ui/layout-toggle";
import { useCatalogLayout } from "@/lib/catalog-layout";
import { EmptyState, ErrorState, VideoCardSkeleton } from "@/components/ui/states";
import type { PaginatedResult, Photo } from "@/lib/types";

export function PhotoGrid({
  initialResult,
  params,
}: {
  initialResult: PaginatedResult<Photo>;
  params: PhotoListParams;
}) {
  const [photos, setPhotos] = useState<Photo[]>(initialResult.data);
  const [page, setPage] = useState(initialResult.page);
  const [totalPages, setTotalPages] = useState(initialResult.totalPages);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [layout, setLayout] = useCatalogLayout();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasMore = page < totalPages;

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const next = await getPhotos({ ...params, page: page + 1 });
      setPhotos((prev) => [...prev, ...next.data]);
      setPage(next.page);
      setTotalPages(next.totalPages);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load more photos.");
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

  if (photos.length === 0) {
    return <EmptyState title="No photos yet." description="Published photos from the admin will appear here." />;
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <LayoutToggle layout={layout} onChange={setLayout} />
      </div>
      <div
        className={
          layout === "list"
            ? "flex flex-col gap-3"
            : "grid grid-cols-1 content-start items-start gap-5 sm:grid-cols-2 lg:grid-cols-3"
        }
      >
        {photos.map((photo, index) => (
          <PhotoCard key={photo.id} photo={photo} index={index} layout={layout} />
        ))}
      </div>
      {error && <ErrorState message={error} />}
      <div ref={sentinelRef} className="flex justify-center py-8">
        {loadingMore && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
        {hasMore && !loadingMore && (
          <button
            onClick={loadMore}
            className="rounded-full border border-border bg-surface px-6 py-2.5 text-sm font-medium transition hover:border-primary hover:text-primary"
          >
            Load more
          </button>
        )}
      </div>
    </>
  );
}
