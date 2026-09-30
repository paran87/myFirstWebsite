"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Camera, Clapperboard, Film, ImageIcon } from "lucide-react";
import { FiltersBar } from "@/components/video/filters-bar";
import { VideoGrid } from "@/components/video/video-grid";
import { PhotoGrid } from "@/components/photo/photo-grid";
import { ErrorState, VideoCardSkeleton } from "@/components/ui/states";
import { getPhotos, getVideos, type VideoListParams } from "@/lib/api";
import type { Category, PaginatedResult, Photo, Video } from "@/lib/types";

type Kind = "video" | "photo";


const TABS = [
  { kind: "video", href: "/", label: "Videos", icon: Film },
  { kind: "photo", href: "/photos", label: "Photos", icon: ImageIcon },
] as const;

/**
 * The Videos/Photos catalog on the home and /photos pages. The tabs swap
 * only this section (heading, filters and grid) in place — the URL is
 * updated without a navigation, so nothing above it re-renders. Each list
 * is fetched once and kept mounted, so switching back keeps your place.
 */
export function CatalogBrowser({
  initialKind,
  initialVideos = null,
  initialPhotos = null,
  loadError,
  categories,
  params,
  titleAs: Title = "h2",
}: {
  initialKind: Kind;
  initialVideos?: PaginatedResult<Video> | null;
  initialPhotos?: PaginatedResult<Photo> | null;
  loadError: string | null;
  categories: Category[];
  params: VideoListParams;
  titleAs?: "h1" | "h2";
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const kind: Kind = pathname.startsWith("/photo") ? "photo" : "video";

  const [videos, setVideos] = useState(initialVideos);
  const [photos, setPhotos] = useState(initialPhotos);
  const [errors, setErrors] = useState<Partial<Record<Kind, string>>>(loadError ? { [initialKind]: loadError } : {});

  // Fetch a list the first time its tab is opened.
  const needsVideos = kind === "video" && !videos && !errors.video;
  const needsPhotos = kind === "photo" && !photos && !errors.photo;
  useEffect(() => {
    if (!needsVideos && !needsPhotos) return;
    let cancelled = false;
    const load: Promise<unknown> = needsVideos
      ? getVideos(params).then((result) => !cancelled && setVideos(result))
      : getPhotos(params).then((result) => !cancelled && setPhotos(result));
    load.catch((e) => {
      if (!cancelled) setErrors((prev) => ({ ...prev, [kind]: e instanceof Error ? e.message : "Unable to load." }));
    });
    return () => {
      cancelled = true;
    };
  }, [needsVideos, needsPhotos, kind, params]);

  function switchTo(next: (typeof TABS)[number]) {
    if (next.kind === kind) return;
    const query = searchParams.toString();
    window.history.pushState(null, "", query ? `${next.href}?${query}` : next.href);
  }

  const result = kind === "video" ? videos : photos;
  const error = errors[kind] ?? null;
  const noun = kind === "video" ? "video" : "photo";

  return (
    <>
      <div
        role="tablist"
        aria-label="Catalog"
        className="mb-8 flex w-full gap-1.5 rounded-full border border-border/80 bg-surface-2/70 p-1.5 shadow-inner sm:w-fit"
      >
        {TABS.map((tab) => {
          const active = tab.kind === kind;
          const Icon = tab.icon;
          return (
            <button
              key={tab.kind}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => switchTo(tab)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-base font-bold transition-all duration-300 sm:flex-none ${
                active
                  ? "bg-brand-gradient text-white shadow-lg shadow-primary/25 dark:text-primary-foreground"
                  : "text-foreground/80 hover:bg-surface hover:text-primary"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mb-6 mt-2 flex flex-col gap-1.5">
        <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-primary">
          {kind === "video" ? <Clapperboard className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
          {kind === "video" ? "The video archive" : "The photo archive"}
        </p>
        <Title className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          {params.search ? (
            <>
              {kind === "video" ? "Results for " : "Photo results for "}
              <span className="text-gradient">&ldquo;{params.search}&rdquo;</span>
            </>
          ) : kind === "video" ? (
            "Latest Documentation"
          ) : (
            "Street Photo Gallery"
          )}
        </Title>
        <p className="text-base font-medium text-foreground/75 sm:text-lg">
          {result
            ? `${result.total.toLocaleString()} ${noun}${result.total === 1 ? "" : "s"} available`
            : kind === "video"
              ? "Browse the public catalog"
              : "Browse documentation photos"}
        </p>
      </div>

      <div className="mb-6">
        <FiltersBar categories={categories} />
      </div>

      {error && <ErrorState message={error} />}
      {!error && !result && (
        <div className="grid grid-cols-2 gap-3 sm:gap-5">
          {Array.from({ length: 6 }, (_, i) => (
            <VideoCardSkeleton key={i} />
          ))}
        </div>
      )}
      {/* Both grids stay mounted once loaded, so switching back is instant. */}
      {videos && (
        <div hidden={kind !== "video"}>
          <VideoGrid initialResult={videos} params={params} />
        </div>
      )}
      {photos && (
        <div hidden={kind !== "photo"}>
          <PhotoGrid initialResult={photos} params={params} />
        </div>
      )}
    </>
  );
}
