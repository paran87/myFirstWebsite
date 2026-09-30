"use client";

import { useSearchParams } from "next/navigation";
import { VideoCard } from "@/components/video/video-card";
import { LayoutToggle } from "@/components/ui/layout-toggle";
import { useCatalogLayout } from "@/lib/catalog-layout";
import type { Video } from "@/lib/types";

function rankRelated(current: Video, videos: Video[]): Video[] {
  return videos
    .filter((video) => video.id !== current.id)
    .sort((a, b) => score(current, b) - score(current, a));
}

function score(current: Video, video: Video): number {
  let points = 0;
  if (current.category_id && video.category_id === current.category_id) points += 2;
  if (current.city && video.city && video.city === current.city) points += 1;
  return points;
}

export function RelatedVideos({ current, videos }: { current: Video; videos: Video[] }) {
  const [layout, setLayout] = useCatalogLayout();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const related = rankRelated(current, videos);
  const hasFilters = Boolean(
    searchParams.get("city") ||
      searchParams.get("category") ||
      searchParams.get("year") ||
      searchParams.get("search")
  );

  return (
    <aside className="page-shell flex min-h-0 flex-col p-4 sm:p-5 xl:sticky xl:top-20 xl:h-[calc(100vh-6rem)] xl:max-h-[calc(100vh-6rem)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold tracking-tight">More videos</h2>
          <p className="text-sm font-medium text-foreground/80">Keep watching from the catalog</p>
        </div>
        <LayoutToggle layout={layout} onChange={setLayout} />
      </div>

      {related.length === 0 ? (
        <p className="text-sm font-medium text-foreground/75">
          {hasFilters ? "No other videos match these filters." : "No other videos are available yet."}
        </p>
      ) : (
        <div
          className={
            layout === "list"
              ? "flex min-h-0 flex-col gap-2 overflow-y-auto pr-1"
              : "grid min-h-0 auto-rows-max grid-cols-2 items-stretch gap-2.5 overflow-y-auto pr-1 sm:gap-3"
          }
        >
          {related.map((video, index) => (
            <VideoCard key={video.id} video={video} index={index} layout={layout} compact query={query} />
          ))}
        </div>
      )}
    </aside>
  );
}
