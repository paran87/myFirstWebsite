"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { MapExplorer } from "@/components/map/map-explorer";
import { FiltersBar } from "@/components/video/filters-bar";
import { PhotoCatalogContext } from "@/components/photo/photo-catalog-context";
import { RelatedPhotos } from "@/components/photo/related-photos";
import { PhotoMapPanel } from "@/components/map/photo-map-panel";
import { getPhotos, type PhotoListParams } from "@/lib/api";
import type { Category, Photo } from "@/lib/types";

function listParamsFromSearch(searchParams: URLSearchParams): PhotoListParams {
  const year = searchParams.get("year");
  return {
    page: 1,
    limit: 24,
    search: searchParams.get("search") || undefined,
    city: searchParams.get("city") || undefined,
    category: searchParams.get("category") || undefined,
    year: year ? Number(year) : undefined,
    sort: (searchParams.get("sort") as PhotoListParams["sort"]) || "newest",
  };
}

export function PhotoWatchFrame({
  children,
  initialPhotos,
  categories,
}: {
  children: React.ReactNode;
  initialPhotos: Photo[];
  categories: Category[];
}) {
  const searchParams = useSearchParams();
  const filterKey = searchParams.toString();
  const [photos, setPhotos] = useState(initialPhotos);
  const [fullscreen, setFullscreen] = useState(false);
  const [activePhoto, setActivePhoto] = useState<Photo | null>(null);

  // The server already sent the unfiltered list, so skip the first fetch
  // unless the page was opened with filters.
  const isFirstRun = useRef(true);

  useEffect(() => {
    const firstRun = isFirstRun.current;
    isFirstRun.current = false;
    if (firstRun && filterKey === "") return;
    let cancelled = false;
    getPhotos(listParamsFromSearch(searchParams))
      .then((result) => {
        if (!cancelled) setPhotos(result.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // Refetch when filters change, not when the photo id changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  const value = useMemo(
    () => ({ photos, query: filterKey, fullscreen, setFullscreen, activePhoto, setActivePhoto }),
    [photos, filterKey, fullscreen, activePhoto]
  );

  const params = useParams();
  const activeId = String(params.id ?? "");
  const shown = activePhoto?.id === activeId ? activePhoto : photos.find((photo) => photo.id === activeId) ?? null;

  return (
    <PhotoCatalogContext.Provider value={value}>
      <MapExplorer
        activeId={activeId}
        activeTitle={shown?.title ?? null}
        kindLabel="Photo"
        backHref="/photos"
        backLabel="Back to photos"
        listTitle="Photos"
        listCount={photos.length}
        filters={<FiltersBar categories={categories} />}
        map={<PhotoMapPanel />}
        list={<RelatedPhotos photos={photos} />}
      >
        {children}
      </MapExplorer>
    </PhotoCatalogContext.Provider>
  );
}
