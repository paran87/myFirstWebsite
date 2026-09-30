"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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
    () => ({ photos, query: filterKey, fullscreen, setFullscreen }),
    [photos, filterKey, fullscreen]
  );

  return (
    <PhotoCatalogContext.Provider value={value}>
      <main className="mx-auto w-full max-w-[1920px] px-4 py-6 lg:px-6 2xl:px-8">
        <Link
          href="/photos"
          className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-surface/90 px-3 py-1.5 text-sm font-semibold text-foreground shadow-sm backdrop-blur-md transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to photos
        </Link>

        <div className="z-20 mb-4 lg:sticky lg:top-16">
          <FiltersBar categories={categories} />
        </div>

        <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(17rem,0.85fr)_minmax(0,2.2fr)_minmax(19rem,1fr)] 2xl:gap-6">
          <div className="order-2 min-w-0 xl:order-none">
            <PhotoMapPanel />
          </div>
          <div className="order-1 min-w-0 xl:order-none">{children}</div>
          <div className="order-3 min-w-0 xl:order-none">
            <RelatedPhotos photos={photos} />
          </div>
        </div>
      </main>
    </PhotoCatalogContext.Provider>
  );
}
