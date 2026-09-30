"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { MapExplorer, type ListKind } from "@/components/map/map-explorer";
import { ExploreMap } from "@/components/map";
import { LocationPanel } from "@/components/map/location-panel";
import { videoPanelContent } from "@/components/map/video-location-panel";
import { photoPanelContent } from "@/components/map/photo-map-panel";
import { FiltersBar } from "@/components/video/filters-bar";
import { RelatedVideos } from "@/components/video/related-videos";
import { RelatedPhotos } from "@/components/photo/related-photos";
import { VideoCatalogContext } from "@/components/video/video-catalog-context";
import { PhotoCatalogContext } from "@/components/photo/photo-catalog-context";
import { getPhotos, getVideos, type VideoListParams } from "@/lib/api";
import type { Category, Photo, Video } from "@/lib/types";

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
 * Persistent shell for /video/[id] and /photo/[id]. The filters, the map and
 * the list stay mounted while you move between videos and photos, so only
 * the player/photo and details change: the map glides to the new location
 * instead of reloading, and the Videos/Photos tabs swap the list in place.
 */
export function ExploreFrame({
  children,
  initialVideos,
  initialPhotos,
  categories,
}: {
  children: React.ReactNode;
  initialVideos: Video[];
  initialPhotos: Photo[];
  categories: Category[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const searchParams = useSearchParams();
  const filterKey = searchParams.toString();
  const kind: ListKind = pathname.startsWith("/photo") ? "photo" : "video";
  const activeId = String(params.id ?? "");

  const [videos, setVideos] = useState(initialVideos);
  const [photos, setPhotos] = useState(initialPhotos);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [activePhoto, setActivePhoto] = useState<Photo | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  // Which list the drawer shows; follows the page type unless a tab is picked.
  const [listKind, setListKind] = useState<ListKind>(kind);
  const [listFor, setListFor] = useState(kind);
  if (listFor !== kind) {
    setListFor(kind);
    setListKind(kind);
  }

  // The server already sent the unfiltered lists; only refetch for filters.
  const isFirstRun = useRef(true);
  useEffect(() => {
    const firstRun = isFirstRun.current;
    isFirstRun.current = false;
    if (firstRun && filterKey === "") return;
    let cancelled = false;
    const listParams = listParamsFromSearch(searchParams);
    getVideos(listParams)
      .then((result) => {
        if (!cancelled) setVideos(result.data);
      })
      .catch(() => {});
    getPhotos(listParams)
      .then((result) => {
        if (!cancelled) setPhotos(result.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // Refetch when filters change, not when the selection changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  const videoValue = useMemo(() => ({ videos, activeVideo, setActiveVideo }), [videos, activeVideo]);
  const photoValue = useMemo(
    () => ({ photos, query: filterKey, fullscreen, setFullscreen, activePhoto, setActivePhoto }),
    [photos, filterKey, fullscreen, activePhoto]
  );

  const openPhoto = useCallback(
    (id: string) => router.push(filterKey ? `/photo/${id}?${filterKey}` : `/photo/${id}`, { scroll: false }),
    [router, filterKey]
  );

  const shownVideo = kind === "video" && activeVideo?.id === activeId ? activeVideo : null;
  const shownPhoto =
    kind === "photo"
      ? activePhoto?.id === activeId
        ? activePhoto
        : photos.find((photo) => photo.id === activeId) ?? null
      : null;

  const panel =
    kind === "video"
      ? videoPanelContent(shownVideo)
      : photoPanelContent({ photos, activePhoto, activeId, onSelect: openPhoto });

  return (
    <VideoCatalogContext.Provider value={videoValue}>
      <PhotoCatalogContext.Provider value={photoValue}>
        <MapExplorer
          activeId={activeId}
          activeTitle={(kind === "video" ? shownVideo?.title : shownPhoto?.title) ?? null}
          kind={kind}
          listKind={listKind}
          onListKindChange={setListKind}
          listCount={listKind === "video" ? videos.length : photos.length}
          filters={<FiltersBar categories={categories} />}
          map={
            <LocationPanel
              icon={panel.icon}
              title={panel.title}
              subtitle={panel.subtitle}
              empty={panel.empty}
              map={<ExploreMap {...panel.map} />}
            >
              {panel.info}
            </LocationPanel>
          }
          list={
            listKind === "video" ? (
              <RelatedVideos current={kind === "video" ? activeVideo : null} videos={videos} />
            ) : (
              <RelatedPhotos photos={photos} />
            )
          }
        >
          {children}
        </MapExplorer>
      </PhotoCatalogContext.Provider>
    </VideoCatalogContext.Provider>
  );
}
