"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { MapExplorer } from "@/components/map/map-explorer";
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

  const params = useParams();
  const activeId = String(params.id ?? "");
  const shown = activeVideo?.id === activeId ? activeVideo : null;

  return (
    <VideoCatalogContext.Provider value={value}>
      <MapExplorer
        activeId={activeId}
        activeTitle={shown?.title ?? null}
        kindLabel="Video"
        backHref="/"
        backLabel="Back to catalog"
        listTitle="Videos"
        listCount={videos.length}
        filters={<FiltersBar categories={categories} />}
        map={activeVideo ? <VideoLocationPanel video={activeVideo} /> : <LocationPanelSkeleton />}
        list={<RelatedVideos current={activeVideo} videos={videos} />}
      >
        {children}
      </MapExplorer>
    </VideoCatalogContext.Provider>
  );
}
