"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { FiltersBar } from "@/components/video/filters-bar";
import { RelatedVideos } from "@/components/video/related-videos";
import { VideoLocationPanel } from "@/components/map/video-location-panel";
import { LocationPanelSkeleton } from "@/components/map/location-panel";
import { VideoCatalogContext } from "@/components/video/video-catalog-context";
import { getVideos, type VideoListParams } from "@/lib/api";
import type { Category, Video } from "@/lib/types";

function listParamsFromSearch(searchParams: URLSearchParams): VideoListParams {
  const year = searchParams.get("year");
  return {
    page: 1,
    limit: 24,
    search: searchParams.get("search") || undefined,
    city: searchParams.get("city") || undefined,
    category: searchParams.get("category") || undefined,
    year: year ? Number(year) : undefined,
    sort: (searchParams.get("sort") as VideoListParams["sort"]) || "newest",
  };
}

/**
 * Persistent shell for /video/[id]: back link, filters, the route map and
 * "More videos" stay mounted while you switch videos, so only the player
 * and details in the middle change (no full-page reload, map keeps its
 * state and animates to the new route, list keeps its scroll position).
 */
export function VideoWatchFrame({
  children,
  initialVideos,
  categories,
}: {
  children: React.ReactNode;
  initialVideos: Video[];
  categories: Category[];
}) {
  const searchParams = useSearchParams();
  const filterKey = searchParams.toString();
  const [videos, setVideos] = useState(initialVideos);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);

  // The server already sent the unfiltered list; only refetch for filters.
  const isFirstRun = useRef(true);
  useEffect(() => {
    const firstRun = isFirstRun.current;
    isFirstRun.current = false;
    if (firstRun && filterKey === "") return;
    let cancelled = false;
    getVideos(listParamsFromSearch(searchParams))
      .then((result) => {
        if (!cancelled) setVideos(result.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // Refetch when filters change, not when the video changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  const value = useMemo(() => ({ videos, activeVideo, setActiveVideo }), [videos, activeVideo]);

  return (
    <VideoCatalogContext.Provider value={value}>
      <main className="animate-fade-in mx-auto w-full max-w-[1920px] px-4 py-6 lg:px-6 2xl:px-8">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-surface/90 px-3 py-1.5 text-base font-semibold text-foreground shadow-sm backdrop-blur-md transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to catalog
        </Link>

        <div className="z-20 mb-4 lg:sticky lg:top-16">
          <FiltersBar categories={categories} />
        </div>

        <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1.15fr)_minmax(17rem,0.75fr)] 2xl:gap-6">
          <div className="order-2 min-w-0 xl:order-none">
            {activeVideo ? <VideoLocationPanel video={activeVideo} /> : <LocationPanelSkeleton />}
          </div>
          <div className="order-1 flex min-h-0 min-w-0 flex-col gap-3 xl:order-none">{children}</div>
          <div className="order-3 min-w-0 xl:order-none">
            <RelatedVideos current={activeVideo} videos={videos} />
          </div>
        </div>
      </main>
    </VideoCatalogContext.Provider>
  );
}
